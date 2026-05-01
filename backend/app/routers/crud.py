from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    Ambassador,
    Benefit,
    Client,
    ContractTemplate,
    Credit,
    Cycle,
    EarnedBenefit,
    Procedure,
    ProcedureRecord,
    Referral,
    User,
)
from app.routers.deps import get_current_user
from app.schemas.common import (
    AmbassadorCreate,
    AmbassadorOut,
    AmbassadorUpdate,
    BenefitBase,
    BenefitOut,
    ClientCreate,
    ClientOut,
    ClientUpdate,
    ContractTemplateBase,
    ContractTemplateOut,
    CreditBase,
    CreditOut,
    CycleBase,
    CycleOut,
    EarnedBenefitOut,
    ProcedureBase,
    ProcedureOut,
    ProcedureRecordBase,
    ProcedureRecordOut,
    ReferralCreate,
    ReferralOut,
    ReferralUpdate,
)
from app.services.program import (
    activate_cycle,
    build_coupon,
    build_link,
    check_referral_duplicate,
    close_cycle,
    mark_referral_procedure_done,
)


def format_cpf(value: str | None) -> str | None:
    if not value:
        return value
    digits = "".join(ch for ch in value if ch.isdigit())[:11]
    if len(digits) != 11:
        return value
    return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"


def format_phone(value: str | None) -> str | None:
    if not value:
        return value
    digits = "".join(ch for ch in value if ch.isdigit())[:11]
    if len(digits) != 11:
        return value
    return f"({digits[:2]}) {digits[2:7]}.{digits[7:]}"


def compose_address(data: dict) -> str | None:
    existing = data.get("address")
    parts = [
        data.get("street"),
        data.get("address_number"),
        data.get("address_complement"),
        data.get("neighborhood"),
        data.get("city"),
        data.get("state"),
        data.get("zip_code"),
    ]
    compact = [str(part).strip() for part in parts if part]
    return ", ".join(compact) if compact else existing

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/clients", response_model=list[ClientOut])
def list_clients(q: str | None = Query(None), db: Session = Depends(get_db)):
    query = db.query(Client)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Client.full_name.ilike(like), Client.phone.ilike(like), Client.cpf.ilike(like), Client.email.ilike(like)))
    return query.order_by(Client.created_at.desc()).all()


@router.post("/clients", response_model=ClientOut)
def create_client(payload: ClientCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["cpf"] = format_cpf(data.get("cpf"))
    data["phone"] = format_phone(data.get("phone"))
    data["address"] = compose_address(data)
    client = Client(**data)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/clients/{client_id}", response_model=ClientOut)
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")
    return client


@router.put("/clients/{client_id}", response_model=ClientOut)
def update_client(client_id: int, payload: ClientUpdate, db: Session = Depends(get_db)):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "cpf" in data:
        data["cpf"] = format_cpf(data.get("cpf"))
    if "phone" in data:
        data["phone"] = format_phone(data.get("phone"))
    if any(key in data for key in ["street", "address_number", "address_complement", "neighborhood", "city", "state", "zip_code"]):
        merged = {**client.__dict__, **data}
        data["address"] = compose_address(merged)
    for key, value in data.items():
        setattr(client, key, value)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/clients/{client_id}", response_model=ClientOut)
def deactivate_client(client_id: int, db: Session = Depends(get_db)):
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")
    client.is_active = False
    db.commit()
    db.refresh(client)
    return client


@router.get("/ambassadors", response_model=list[AmbassadorOut])
def list_ambassadors(db: Session = Depends(get_db)):
    return db.query(Ambassador).options(joinedload(Ambassador.client)).order_by(Ambassador.id.desc()).all()


@router.post("/ambassadors", response_model=AmbassadorOut)
def create_ambassador(payload: AmbassadorCreate, db: Session = Depends(get_db)):
    client = db.get(Client, payload.client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")
    coupon = payload.coupon or build_coupon(db, payload.public_name or client.full_name)
    if db.query(Ambassador).filter(Ambassador.coupon == coupon).first():
        raise HTTPException(409, "Cupom já existe")
    ambassador = Ambassador(
        client_id=client.id,
        public_name=payload.public_name or client.full_name,
        coupon=coupon,
        exclusive_link=build_link(coupon),
        status=payload.status,
        level=payload.level,
        notes=payload.notes,
    )
    db.add(ambassador)
    db.commit()
    db.refresh(ambassador)
    return ambassador


@router.get("/ambassadors/{ambassador_id}", response_model=AmbassadorOut)
def get_ambassador(ambassador_id: int, db: Session = Depends(get_db)):
    ambassador = db.query(Ambassador).options(joinedload(Ambassador.client)).filter(Ambassador.id == ambassador_id).first()
    if not ambassador:
        raise HTTPException(404, "Embaixadora não encontrada")
    return ambassador


@router.put("/ambassadors/{ambassador_id}", response_model=AmbassadorOut)
def update_ambassador(ambassador_id: int, payload: AmbassadorUpdate, db: Session = Depends(get_db)):
    ambassador = db.get(Ambassador, ambassador_id)
    if not ambassador:
        raise HTTPException(404, "Embaixadora não encontrada")
    data = payload.model_dump(exclude_unset=True)
    if data.get("coupon"):
        data["exclusive_link"] = build_link(data["coupon"])
    for key, value in data.items():
        setattr(ambassador, key, value)
    db.commit()
    db.refresh(ambassador)
    return ambassador


@router.get("/referrals", response_model=list[ReferralOut])
def list_referrals(ambassador_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Referral)
    if ambassador_id:
        query = query.filter(Referral.ambassador_id == ambassador_id)
    return query.order_by(Referral.referred_at.desc()).all()


@router.post("/referrals", response_model=ReferralOut)
def create_referral(payload: ReferralCreate, db: Session = Depends(get_db)):
    check_referral_duplicate(db, payload.referred_phone, payload.referred_email, payload.client_id)
    referral = Referral(**payload.model_dump())
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return referral


@router.put("/referrals/{referral_id}", response_model=ReferralOut)
def update_referral(referral_id: int, payload: ReferralUpdate, db: Session = Depends(get_db)):
    referral = db.get(Referral, referral_id)
    if not referral:
        raise HTTPException(404, "Indicação não encontrada")
    data = payload.model_dump(exclude_unset=True)
    check_referral_duplicate(db, data.get("referred_phone", referral.referred_phone), data.get("referred_email", referral.referred_email), data.get("client_id", referral.client_id), referral_id)
    for key, value in data.items():
        setattr(referral, key, value)
    db.commit()
    db.refresh(referral)
    return referral


@router.get("/procedures", response_model=list[ProcedureOut])
def list_procedures(db: Session = Depends(get_db)):
    return db.query(Procedure).order_by(Procedure.name).all()


@router.post("/procedures", response_model=ProcedureOut)
def create_procedure(payload: ProcedureBase, db: Session = Depends(get_db)):
    procedure = Procedure(**payload.model_dump())
    db.add(procedure)
    db.commit()
    db.refresh(procedure)
    return procedure


@router.put("/procedures/{procedure_id}", response_model=ProcedureOut)
def update_procedure(procedure_id: int, payload: ProcedureBase, db: Session = Depends(get_db)):
    procedure = db.get(Procedure, procedure_id)
    if not procedure:
        raise HTTPException(404, "Procedimento não encontrado")
    for key, value in payload.model_dump().items():
        setattr(procedure, key, value)
    db.commit()
    db.refresh(procedure)
    return procedure


@router.get("/procedure-records", response_model=list[ProcedureRecordOut])
def list_procedure_records(db: Session = Depends(get_db)):
    return db.query(ProcedureRecord).order_by(ProcedureRecord.date.desc()).all()


@router.post("/procedure-records", response_model=ProcedureRecordOut)
def create_procedure_record(payload: ProcedureRecordBase, db: Session = Depends(get_db)):
    record = ProcedureRecord(**payload.model_dump())
    db.add(record)
    db.flush()
    mark_referral_procedure_done(db, record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/cycles", response_model=list[CycleOut])
def list_cycles(db: Session = Depends(get_db)):
    return db.query(Cycle).order_by(Cycle.start_date.desc()).all()


@router.post("/cycles", response_model=CycleOut)
def create_cycle(payload: CycleBase, db: Session = Depends(get_db)):
    cycle = Cycle(**payload.model_dump())
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle


@router.post("/cycles/{cycle_id}/activate", response_model=CycleOut)
def activate(cycle_id: int, db: Session = Depends(get_db)):
    return activate_cycle(db, cycle_id)


@router.post("/cycles/{cycle_id}/close", response_model=CycleOut)
def close(cycle_id: int, db: Session = Depends(get_db)):
    return close_cycle(db, cycle_id)


@router.get("/benefits", response_model=list[BenefitOut])
def list_benefits(db: Session = Depends(get_db)):
    return db.query(Benefit).order_by(Benefit.required_points).all()


@router.post("/benefits", response_model=BenefitOut)
def create_benefit(payload: BenefitBase, db: Session = Depends(get_db)):
    benefit = Benefit(**payload.model_dump())
    db.add(benefit)
    db.commit()
    db.refresh(benefit)
    return benefit


@router.get("/earned-benefits", response_model=list[EarnedBenefitOut])
def list_earned_benefits(db: Session = Depends(get_db)):
    return db.query(EarnedBenefit).options(joinedload(EarnedBenefit.benefit)).order_by(EarnedBenefit.earned_at.desc()).all()


@router.put("/earned-benefits/{earned_id}/status", response_model=EarnedBenefitOut)
def update_earned_status(earned_id: int, status: str, db: Session = Depends(get_db)):
    earned = db.get(EarnedBenefit, earned_id)
    if not earned:
        raise HTTPException(404, "Benefício conquistado não encontrado")
    earned.status = status
    db.commit()
    db.refresh(earned)
    return earned


@router.get("/credits", response_model=list[CreditOut])
def list_credits(ambassador_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Credit)
    if ambassador_id:
        query = query.filter(Credit.ambassador_id == ambassador_id)
    return query.order_by(Credit.date.desc()).all()


@router.post("/credits", response_model=CreditOut)
def create_credit(payload: CreditBase, db: Session = Depends(get_db)):
    credit = Credit(**payload.model_dump())
    db.add(credit)
    db.commit()
    db.refresh(credit)
    return credit


@router.get("/contracts/templates", response_model=list[ContractTemplateOut])
def list_contract_templates(db: Session = Depends(get_db)):
    return db.query(ContractTemplate).order_by(ContractTemplate.created_at.desc()).all()


@router.post("/contracts/templates", response_model=ContractTemplateOut)
def create_contract_template(payload: ContractTemplateBase, db: Session = Depends(get_db)):
    template = ContractTemplate(**payload.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template
