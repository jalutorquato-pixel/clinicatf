from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    AccountEntry,
    AnamnesisRecord,
    AnamnesisTemplate,
    Appointment,
    PrescriptionRecord,
    PrescriptionTemplate,
    Product,
    Sale,
    SaleItem,
    StockMovement,
)
from app.routers.deps import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])


class AppointmentIn(BaseModel):
    client_id: int | None = None
    referral_id: int | None = None
    procedure_id: int | None = None
    title: str
    start_at: datetime
    end_at: datetime | None = None
    professional: str | None = None
    room: str | None = None
    status: str = "agendado"
    color: str | None = None
    recurrence: str | None = None
    notify_client: bool = False
    notes: str | None = None


class SaleItemIn(BaseModel):
    item_type: str = "procedimento"
    procedure_id: int | None = None
    product_id: int | None = None
    description: str
    quantity: float = 1
    unit_price: float = 0


class SaleIn(BaseModel):
    client_id: int | None = None
    appointment_id: int | None = None
    type: str = "orcamento"
    status: str = "aberto"
    sale_date: date = date.today()
    due_date: date | None = None
    payment_method: str | None = None
    professional: str | None = None
    notes: str | None = None
    items: list[SaleItemIn] = []


class AccountEntryIn(BaseModel):
    type: str = "receita"
    description: str
    client_id: int | None = None
    sale_id: int | None = None
    category: str | None = None
    due_date: date = date.today()
    paid_at: date | None = None
    value: float = 0
    status: str = "nao_pago"
    payment_method: str | None = None
    notes: str | None = None


class ProductIn(BaseModel):
    name: str
    category: str | None = None
    sku: str | None = None
    description: str | None = None
    price: float = 0
    cost: float = 0
    stock_quantity: float = 0
    min_stock: float = 0
    is_active: bool = True


class StockMovementIn(BaseModel):
    product_id: int
    type: str = "entrada"
    quantity: float
    reason: str | None = None
    notes: str | None = None


class TextTemplateIn(BaseModel):
    name: str
    category: str | None = None
    content: str
    is_active: bool = True


class AnamnesisRecordIn(BaseModel):
    client_id: int
    appointment_id: int | None = None
    template_id: int | None = None
    title: str
    answers: str | None = None
    status: str = "pendente"


class PrescriptionRecordIn(BaseModel):
    client_id: int
    template_id: int | None = None
    title: str
    content: str
    professional: str | None = None


def apply_model(obj, data: dict):
    for key, value in data.items():
        setattr(obj, key, value)


@router.get("/appointments")
def list_appointments(status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Appointment)
    if status:
        query = query.filter(Appointment.status == status)
    return query.order_by(Appointment.start_at.desc()).all()


@router.post("/appointments")
def create_appointment(payload: AppointmentIn, db: Session = Depends(get_db)):
    appointment = Appointment(**payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/appointments/{appointment_id}")
def update_appointment(appointment_id: int, payload: AppointmentIn, db: Session = Depends(get_db)):
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(404, "Agendamento não encontrado")
    apply_model(appointment, payload.model_dump())
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/sales")
def list_sales(type: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Sale)
    if type:
        query = query.filter(Sale.type == type)
    return query.order_by(Sale.sale_date.desc(), Sale.id.desc()).all()


@router.post("/sales")
def create_sale(payload: SaleIn, db: Session = Depends(get_db)):
    sale_data = payload.model_dump(exclude={"items"})
    items = []
    total = 0
    for item in payload.items:
        item_total = item.quantity * item.unit_price
        total += item_total
        items.append(SaleItem(**item.model_dump(), total=item_total))
    sale = Sale(**sale_data, total=total, items=items)
    db.add(sale)
    db.flush()
    if sale.type == "venda":
        db.add(AccountEntry(type="receita", description=f"Venda #{sale.id}", client_id=sale.client_id, sale_id=sale.id, due_date=sale.due_date or sale.sale_date, value=sale.total, status="nao_pago", payment_method=sale.payment_method))
    db.commit()
    db.refresh(sale)
    return sale


@router.get("/finance/accounts")
def list_accounts(type: str | None = None, status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(AccountEntry)
    if type:
        query = query.filter(AccountEntry.type == type)
    if status:
        query = query.filter(AccountEntry.status == status)
    return query.order_by(AccountEntry.due_date.desc()).all()


@router.post("/finance/accounts")
def create_account(payload: AccountEntryIn, db: Session = Depends(get_db)):
    entry = AccountEntry(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/finance/accounts/{entry_id}/pay")
def pay_account(entry_id: int, db: Session = Depends(get_db)):
    entry = db.get(AccountEntry, entry_id)
    if not entry:
        raise HTTPException(404, "Conta não encontrada")
    entry.status = "pago"
    entry.paid_at = date.today()
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/finance/summary")
def finance_summary(db: Session = Depends(get_db)):
    today = date.today()
    receivable_today = db.query(func.coalesce(func.sum(AccountEntry.value), 0)).filter(AccountEntry.type == "receita", AccountEntry.due_date == today, AccountEntry.status != "pago").scalar()
    payable_today = db.query(func.coalesce(func.sum(AccountEntry.value), 0)).filter(AccountEntry.type == "despesa", AccountEntry.due_date == today, AccountEntry.status != "pago").scalar()
    overdue_receivable = db.query(func.coalesce(func.sum(AccountEntry.value), 0)).filter(AccountEntry.type == "receita", AccountEntry.due_date < today, AccountEntry.status != "pago").scalar()
    overdue_payable = db.query(func.coalesce(func.sum(AccountEntry.value), 0)).filter(AccountEntry.type == "despesa", AccountEntry.due_date < today, AccountEntry.status != "pago").scalar()
    realized_revenue = db.query(func.coalesce(func.sum(AccountEntry.value), 0)).filter(AccountEntry.type == "receita", AccountEntry.status == "pago").scalar()
    realized_expense = db.query(func.coalesce(func.sum(AccountEntry.value), 0)).filter(AccountEntry.type == "despesa", AccountEntry.status == "pago").scalar()
    return {
        "receivable_today": float(receivable_today or 0),
        "payable_today": float(payable_today or 0),
        "overdue_receivable": float(overdue_receivable or 0),
        "overdue_payable": float(overdue_payable or 0),
        "realized_revenue": float(realized_revenue or 0),
        "realized_expense": float(realized_expense or 0),
        "balance": float((realized_revenue or 0) - (realized_expense or 0)),
    }


@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.name).all()


@router.post("/products")
def create_product(payload: ProductIn, db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.post("/stock-movements")
def create_stock_movement(payload: StockMovementIn, db: Session = Depends(get_db)):
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(404, "Produto não encontrado")
    movement = StockMovement(**payload.model_dump())
    product.stock_quantity += payload.quantity if payload.type == "entrada" else -payload.quantity
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


@router.get("/stock-movements")
def list_stock_movements(db: Session = Depends(get_db)):
    return db.query(StockMovement).order_by(StockMovement.date.desc()).all()


@router.get("/anamnesis/templates")
def list_anamnesis_templates(db: Session = Depends(get_db)):
    return db.query(AnamnesisTemplate).order_by(AnamnesisTemplate.created_at.desc()).all()


@router.post("/anamnesis/templates")
def create_anamnesis_template(payload: TextTemplateIn, db: Session = Depends(get_db)):
    template = AnamnesisTemplate(**payload.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/anamnesis/records")
def list_anamnesis_records(db: Session = Depends(get_db)):
    return db.query(AnamnesisRecord).order_by(AnamnesisRecord.created_at.desc()).all()


@router.post("/anamnesis/records")
def create_anamnesis_record(payload: AnamnesisRecordIn, db: Session = Depends(get_db)):
    record = AnamnesisRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/anamnesis/records/{record_id}/finish")
def finish_anamnesis(record_id: int, db: Session = Depends(get_db)):
    record = db.get(AnamnesisRecord, record_id)
    if not record:
        raise HTTPException(404, "Anamnese não encontrada")
    record.status = "finalizada"
    record.signed_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record


@router.get("/prescriptions/templates")
def list_prescription_templates(db: Session = Depends(get_db)):
    return db.query(PrescriptionTemplate).order_by(PrescriptionTemplate.created_at.desc()).all()


@router.post("/prescriptions/templates")
def create_prescription_template(payload: TextTemplateIn, db: Session = Depends(get_db)):
    template = PrescriptionTemplate(name=payload.name, content=payload.content, is_active=payload.is_active)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/prescriptions/records")
def list_prescription_records(db: Session = Depends(get_db)):
    return db.query(PrescriptionRecord).order_by(PrescriptionRecord.created_at.desc()).all()


@router.post("/prescriptions/records")
def create_prescription_record(payload: PrescriptionRecordIn, db: Session = Depends(get_db)):
    record = PrescriptionRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/quick-search")
def quick_search(q: str = Query(""), db: Session = Depends(get_db)):
    from app.models import Client, Procedure, Referral

    like = f"%{q}%"
    return {
        "clients": db.query(Client).filter(Client.full_name.ilike(like)).limit(8).all() if q else [],
        "procedures": db.query(Procedure).filter(Procedure.name.ilike(like)).limit(8).all() if q else [],
        "referrals": db.query(Referral).filter(Referral.referred_name.ilike(like)).limit(8).all() if q else [],
    }
