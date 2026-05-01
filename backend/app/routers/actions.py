import csv
import io
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Ambassador,
    Benefit,
    Client,
    ContractTemplate,
    Credit,
    Cycle,
    EarnedBenefit,
    GeneratedContract,
    Point,
    Procedure,
    ProcedureRecord,
    Referral,
    Setting,
    User,
)
from app.routers.deps import get_current_user
from app.schemas.common import DashboardOut, GeneratedContractCreate, GeneratedContractOut, SettingIn, SettingOut
from app.services.program import backup_database, get_active_cycle, get_setting, validate_referral_point

router = APIRouter(dependencies=[Depends(get_current_user)])


def month_filter(query, column, month: str | None):
    if not month:
        return query
    year, mon = month.split("-")
    return query.filter(extract("year", column) == int(year), extract("month", column) == int(mon))


def ranking(db: Session, cycle_id: int):
    rows = db.query(Ambassador, Client.full_name, func.coalesce(func.sum(Point.points), 0).label("points")).join(Client).outerjoin(
        Point, (Point.ambassador_id == Ambassador.id) & (Point.cycle_id == cycle_id)
    ).group_by(Ambassador.id, Client.full_name).order_by(func.coalesce(func.sum(Point.points), 0).desc()).all()
    return [{"ambassador_id": a.id, "name": a.public_name, "client_name": client, "points": int(points or 0)} for a, client, points in rows]


@router.post("/referrals/{referral_id}/validate-point")
def validate_point(referral_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return validate_referral_point(db, referral_id, user.username)


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    today = date.today()
    month_start = datetime(today.year, today.month, 1)
    cycle = db.query(Cycle).filter(Cycle.status == "ativo").first()
    cycle_id = cycle.id if cycle else 0
    referrals_month = db.query(Referral).filter(Referral.referred_at >= month_start).count()
    valid_month = db.query(Referral).filter(Referral.point_validated_at >= month_start).count()
    procedures_month = db.query(ProcedureRecord).filter(ProcedureRecord.date >= month_start.date(), ProcedureRecord.status == "realizado").count()
    revenue = db.query(func.coalesce(func.sum(ProcedureRecord.charged_value), 0)).join(Referral, ProcedureRecord.referral_id == Referral.id).filter(ProcedureRecord.status == "realizado").scalar()
    metrics = {
        "total_clients": db.query(Client).count(),
        "active_ambassadors": db.query(Ambassador).filter(Ambassador.status == "ativa").count(),
        "referrals_month": referrals_month,
        "valid_referrals_month": valid_month,
        "conversion_rate": round((valid_month / referrals_month * 100), 1) if referrals_month else 0,
        "procedures_month": procedures_month,
        "referral_revenue": float(revenue or 0),
        "pending_benefits": db.query(EarnedBenefit).filter(EarnedBenefit.status.in_(["conquistado", "agendado"])).count(),
        "pending_contracts": db.query(GeneratedContract).filter(GeneratedContract.status.in_(["gerado", "impresso"])).count(),
    }
    referrals_chart = db.query(extract("month", Referral.referred_at).label("month"), func.count(Referral.id)).group_by("month").all()
    procedure_chart = db.query(Procedure.category, func.count(ProcedureRecord.id)).join(ProcedureRecord).group_by(Procedure.category).all()
    points_chart = ranking(db, cycle_id) if cycle_id else []
    revenue_chart = db.query(
        Ambassador.public_name,
        func.coalesce(func.sum(ProcedureRecord.charged_value), 0),
    ).select_from(Ambassador).join(
        Referral, Referral.ambassador_id == Ambassador.id
    ).join(
        ProcedureRecord, ProcedureRecord.referral_id == Referral.id
    ).group_by(Ambassador.id).all()
    return {
        "metrics": metrics,
        "ranking": points_chart,
        "charts": {
            "referrals_by_month": [{"name": str(int(m)), "value": c} for m, c in referrals_chart],
            "procedures_by_type": [{"name": k or "Outros", "value": c} for k, c in procedure_chart],
            "points_by_ambassador": [{"name": r["name"], "value": r["points"]} for r in points_chart],
            "revenue_by_ambassador": [{"name": n, "value": float(v or 0)} for n, v in revenue_chart],
        },
    }


@router.get("/ambassadors/{ambassador_id}/dashboard")
def ambassador_dashboard(ambassador_id: int, db: Session = Depends(get_db)):
    ambassador = db.get(Ambassador, ambassador_id)
    if not ambassador:
        raise HTTPException(404, "Embaixadora não encontrada")
    cycle = get_active_cycle(db)
    rank = ranking(db, cycle.id)
    current_points = next((r["points"] for r in rank if r["ambassador_id"] == ambassador_id), 0)
    position = next((i + 1 for i, r in enumerate(rank) if r["ambassador_id"] == ambassador_id), None)
    total_points = db.query(func.coalesce(func.sum(Point.points), 0)).filter(Point.ambassador_id == ambassador_id).scalar()
    referrals = db.query(Referral).filter(Referral.ambassador_id == ambassador_id).all()
    valid = [r for r in referrals if r.generated_point]
    revenue = db.query(func.coalesce(func.sum(ProcedureRecord.charged_value), 0)).join(Referral, ProcedureRecord.referral_id == Referral.id).filter(Referral.ambassador_id == ambassador_id).scalar()
    next_benefit = db.query(Benefit).filter(Benefit.is_active == True, Benefit.required_points > current_points).order_by(Benefit.required_points).first()
    credits = db.query(func.coalesce(func.sum(Credit.value), 0)).filter(Credit.ambassador_id == ambassador_id).scalar()
    earned = db.query(EarnedBenefit).filter(EarnedBenefit.ambassador_id == ambassador_id).all()
    return {
        "ambassador": {"id": ambassador.id, "public_name": ambassador.public_name, "coupon": ambassador.coupon, "link": ambassador.exclusive_link, "status": ambassador.status, "level": ambassador.level},
        "current_points": int(current_points or 0),
        "historical_points": int(total_points or 0),
        "ranking_position": position,
        "referrals_received": len(referrals),
        "valid_referrals": len(valid),
        "conversion_rate": round(len(valid) / len(referrals) * 100, 1) if referrals else 0,
        "revenue": float(revenue or 0),
        "next_benefit": {"name": next_benefit.name, "required_points": next_benefit.required_points} if next_benefit else None,
        "earned_benefits": [{"id": e.id, "status": e.status, "benefit_id": e.benefit_id} for e in earned],
        "credits_available": float(credits or 0),
        "referrals": [{"id": r.id, "name": r.referred_name, "status": r.status, "phone": r.referred_phone} for r in referrals],
    }


@router.get("/reports/{kind}")
def report(kind: str, month: str | None = None, cycle_id: int | None = None, ambassador_id: int | None = None, db: Session = Depends(get_db)):
    mapping = {
        "clientes": (Client, ["id", "full_name", "phone", "email", "cpf", "created_at", "is_active"]),
        "indicacoes": (Referral, ["id", "ambassador_id", "referred_name", "referred_phone", "status", "generated_point", "referred_at"]),
        "procedimentos": (ProcedureRecord, ["id", "client_id", "referral_id", "procedure_id", "date", "charged_value", "professional", "status"]),
        "pontos": (Point, ["id", "ambassador_id", "referral_id", "cycle_id", "points", "date", "validated_by"]),
        "beneficios": (EarnedBenefit, ["id", "ambassador_id", "benefit_id", "cycle_id", "status", "earned_at", "used_at"]),
        "ranking": (Point, ["ambassador_id", "cycle_id", "points", "date"]),
    }
    if kind == "receita-embaixadora":
        rows = db.query(
            Ambassador.public_name,
            func.coalesce(func.sum(ProcedureRecord.charged_value), 0),
        ).select_from(Ambassador).join(
            Referral, Referral.ambassador_id == Ambassador.id
        ).join(
            ProcedureRecord, ProcedureRecord.referral_id == Referral.id
        )
        if ambassador_id:
            rows = rows.filter(Ambassador.id == ambassador_id)
        rows = rows.group_by(Ambassador.id).all()
        return [{"embaixadora": n, "receita": float(v or 0)} for n, v in rows]
    if kind not in mapping:
        raise HTTPException(404, "Relatório não encontrado")
    model, fields = mapping[kind]
    query = db.query(model)
    if hasattr(model, "ambassador_id") and ambassador_id:
        query = query.filter(model.ambassador_id == ambassador_id)
    if hasattr(model, "cycle_id") and cycle_id:
        query = query.filter(model.cycle_id == cycle_id)
    rows = query.limit(1000).all()
    return [{field: getattr(row, field) for field in fields} for row in rows]


@router.get("/reports/{kind}/csv")
def report_csv(kind: str, db: Session = Depends(get_db)):
    data = report(kind, db=db)
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(data[0].keys()) if data else ["sem_dados"])
    writer.writeheader()
    writer.writerows(data)
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={kind}.csv"})


@router.get("/settings", response_model=list[SettingOut])
def settings(db: Session = Depends(get_db)):
    return db.query(Setting).order_by(Setting.key).all()


@router.put("/settings", response_model=SettingOut)
def upsert_setting(payload: SettingIn, db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.key == payload.key).first()
    if not setting:
        setting = Setting(key=payload.key)
        db.add(setting)
    setting.value = payload.value
    db.commit()
    db.refresh(setting)
    return setting


@router.post("/backup")
def backup():
    path = backup_database()
    return {"path": str(path)}


def render_contract_content(db: Session, client: Client, template: ContractTemplate, record: ProcedureRecord | None):
    procedure_name = ""
    value = ""
    professional = ""
    proc_date = date.today().isoformat()
    if record:
        procedure = db.get(Procedure, record.procedure_id)
        procedure_name = procedure.name if procedure else ""
        value = f"{record.charged_value:.2f}"
        professional = record.professional or ""
        proc_date = record.date.isoformat()
    replacements = {
        "{{nome_cliente}}": client.full_name,
        "{{cpf_cliente}}": client.cpf or "",
        "{{telefone_cliente}}": client.phone or "",
        "{{procedimento}}": procedure_name,
        "{{valor}}": value,
        "{{data}}": proc_date,
        "{{profissional}}": professional,
        "{{nome_clinica}}": get_setting(db, "clinic_name", "Clínica TF"),
        "{{cnpj_clinica}}": get_setting(db, "clinic_cnpj", ""),
    }
    content = template.content
    for key, value in replacements.items():
        content = content.replace(key, value)
    return content


@router.get("/contracts/generated", response_model=list[GeneratedContractOut])
def list_generated_contracts(db: Session = Depends(get_db)):
    return db.query(GeneratedContract).order_by(GeneratedContract.generated_at.desc()).all()


@router.post("/contracts/generated", response_model=GeneratedContractOut)
def generate_contract(payload: GeneratedContractCreate, db: Session = Depends(get_db)):
    client = db.get(Client, payload.client_id)
    template = db.get(ContractTemplate, payload.template_id)
    if not client or not template:
        raise HTTPException(404, "Cliente ou modelo não encontrado")
    record = db.get(ProcedureRecord, payload.procedure_record_id) if payload.procedure_record_id else None
    contract = GeneratedContract(
        client_id=client.id,
        template_id=template.id,
        procedure_record_id=record.id if record else None,
        final_content=render_contract_content(db, client, template, record),
        notes=payload.notes,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.post("/contracts/generated/{contract_id}/sign", response_model=GeneratedContractOut)
def sign_contract(contract_id: int, db: Session = Depends(get_db)):
    contract = db.get(GeneratedContract, contract_id)
    if not contract:
        raise HTTPException(404, "Contrato não encontrado")
    contract.status = "assinado"
    contract.signed_at = datetime.utcnow()
    db.commit()
    db.refresh(contract)
    return contract


@router.get("/contracts/generated/{contract_id}/pdf")
def contract_pdf(contract_id: int, db: Session = Depends(get_db)):
    contract = db.get(GeneratedContract, contract_id)
    if not contract:
        raise HTTPException(404, "Contrato não encontrado")
    path = f"data/contrato-{contract.id}.pdf"
    c = canvas.Canvas(path, pagesize=A4)
    text = c.beginText(40, 800)
    text.setFont("Helvetica", 11)
    for line in contract.final_content.splitlines():
        text.textLine(line[:100])
    c.drawText(text)
    c.save()
    return FileResponse(path, filename=f"contrato-{contract.id}.pdf")
