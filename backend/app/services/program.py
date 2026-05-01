import re
import shutil
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import DATA_DIR
from app.models import (
    Ambassador,
    Benefit,
    Client,
    Credit,
    Cycle,
    EarnedBenefit,
    Point,
    ProcedureRecord,
    Referral,
    Setting,
)


def normalize_code(text: str) -> str:
    code = re.sub(r"[^A-Za-z0-9]+", "", text).upper()
    return code[:24] or "CUPOM"


def build_coupon(db: Session, name: str) -> str:
    base = normalize_code(name.split()[0] if name else "EMBAIXADORA")
    coupon = base
    i = 1
    while db.query(Ambassador).filter(Ambassador.coupon == coupon).first():
        i += 1
        coupon = f"{base}{i}"
    return coupon


def build_link(coupon: str) -> str:
    return f"http://localhost:5173/indicacao/{coupon}"


def get_active_cycle(db: Session) -> Cycle:
    cycle = db.query(Cycle).filter(Cycle.status == "ativo").first()
    if not cycle:
        raise HTTPException(status_code=400, detail="Nenhum ciclo ativo encontrado")
    return cycle


def check_referral_duplicate(db: Session, phone: str | None, email: str | None, client_id: int | None, current_id: int | None = None):
    filters = []
    if phone:
        filters.append(Referral.referred_phone == phone)
    if email:
        filters.append(Referral.referred_email == email)
    if client_id:
        client = db.get(Client, client_id)
        if client and client.cpf:
            filters.append(Client.cpf == client.cpf)
    if not filters:
        return
    query = db.query(Referral).outerjoin(Client, Referral.client_id == Client.id).filter(or_(*filters))
    if current_id:
        query = query.filter(Referral.id != current_id)
    if query.first():
        raise HTTPException(status_code=409, detail="Possível indicação duplicada por telefone, e-mail ou CPF")


def mark_referral_procedure_done(db: Session, record: ProcedureRecord):
    if record.status == "realizado" and record.referral_id:
        referral = db.get(Referral, record.referral_id)
        if referral and referral.status not in {"ponto_validado", "cancelada", "invalida"}:
            referral.status = "procedimento_realizado"


def total_cycle_points(db: Session, ambassador_id: int, cycle_id: int) -> int:
    return db.query(func.coalesce(func.sum(Point.points), 0)).filter(
        Point.ambassador_id == ambassador_id,
        Point.cycle_id == cycle_id,
    ).scalar()


def sync_earned_benefits(db: Session, ambassador_id: int, cycle_id: int):
    total = total_cycle_points(db, ambassador_id, cycle_id)
    benefits = db.query(Benefit).filter(Benefit.is_active == True, Benefit.required_points <= total).all()
    for benefit in benefits:
        exists = db.query(EarnedBenefit).filter_by(
            ambassador_id=ambassador_id,
            benefit_id=benefit.id,
            cycle_id=cycle_id,
        ).first()
        if not exists:
            db.add(EarnedBenefit(ambassador_id=ambassador_id, benefit_id=benefit.id, cycle_id=cycle_id))


def get_setting(db: Session, key: str, default: str = "") -> str:
    setting = db.query(Setting).filter(Setting.key == key).first()
    return setting.value if setting and setting.value is not None else default


def validate_referral_point(db: Session, referral_id: int, username: str):
    referral = db.get(Referral, referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Indicação não encontrada")
    if referral.generated_point:
        raise HTTPException(status_code=400, detail="Esta indicação já gerou ponto")
    if referral.status != "procedimento_realizado":
        raise HTTPException(status_code=400, detail="A indicação precisa estar como procedimento_realizado")

    cycle = get_active_cycle(db)
    before = total_cycle_points(db, referral.ambassador_id, cycle.id)
    point = Point(
        ambassador_id=referral.ambassador_id,
        referral_id=referral.id,
        cycle_id=cycle.id,
        points=1,
        validated_by=username,
    )
    referral.generated_point = True
    referral.point_validated_at = datetime.utcnow()
    referral.status = "ponto_validado"
    db.add(point)
    db.flush()
    sync_earned_benefits(db, referral.ambassador_id, cycle.id)

    if before >= 20:
        value = float(get_setting(db, "default_credit_after_20", "50") or 50)
        db.add(Credit(
            ambassador_id=referral.ambassador_id,
            referral_id=referral.id,
            value=value,
            type="entrada",
            description="Crédito por indicação após 20 pontos",
        ))
    db.commit()
    db.refresh(point)
    return point


def activate_cycle(db: Session, cycle_id: int):
    cycle = db.get(Cycle, cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Ciclo não encontrado")
    db.query(Cycle).filter(Cycle.status == "ativo", Cycle.id != cycle_id).update({"status": "encerrado"})
    cycle.status = "ativo"
    db.commit()
    db.refresh(cycle)
    return cycle


def close_cycle(db: Session, cycle_id: int):
    cycle = db.get(Cycle, cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Ciclo não encontrado")
    cycle.status = "encerrado"
    db.commit()
    db.refresh(cycle)
    return cycle


def backup_database() -> Path:
    source = DATA_DIR / "clinica.db"
    if not source.exists():
        raise HTTPException(status_code=404, detail="Banco de dados ainda não foi criado")
    dest_dir = DATA_DIR.parent / "backups"
    dest_dir.mkdir(exist_ok=True)
    dest = dest_dir / f"clinica-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"
    shutil.copy2(source, dest)
    return dest
