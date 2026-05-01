from datetime import date, timedelta

from app.database import Base, SessionLocal, engine
from app.models import (
    Ambassador,
    Benefit,
    Client,
    ContractTemplate,
    Cycle,
    AnamnesisTemplate,
    PrescriptionTemplate,
    Product,
    Procedure,
    Setting,
    User,
)
from app.services.program import build_coupon, build_link
from app.utils.migrations import ensure_sqlite_columns
from app.utils.security import get_password_hash


Base.metadata.create_all(bind=engine)
ensure_sqlite_columns()

benefits = [
    (3, "Limpeza de pele"),
    (5, "Peeling"),
    (7, "Microagulhamento"),
    (8, "Skinbooster"),
    (10, "Botox 1 região"),
    (12, "Lipo enzimática papada ou abdômen"),
    (14, "Botox 2 regiões"),
    (16, "Preenchimento labial ou preenchimento de bigode chinês"),
    (18, "Bioestimulador de colágeno, preenchimento ou combo botox + skinbooster"),
    (20, "Harmonização facial"),
]

procedures = [
    ("Limpeza de pele", "Facial", 180),
    ("Peeling químico", "Facial", 320),
    ("Microagulhamento", "Facial", 550),
    ("Skinbooster", "Injetáveis", 900),
    ("Botox", "Injetáveis", 750),
    ("Preenchimento labial", "Injetáveis", 1200),
]

settings = {
    "clinic_name": "Clínica TF",
    "clinic_cnpj": "00.000.000/0001-00",
    "default_credit_after_20": "50",
    "program_rules": "Cada indicação validada vale 1 ponto. Benefícios são preservados ao fim do ciclo.",
    "professionals": "Dra. Fernanda; Dra. Marina",
}


def upsert_setting(db, key, value):
    row = db.query(Setting).filter(Setting.key == key).first()
    if not row:
        row = Setting(key=key)
        db.add(row)
    row.value = value


def main():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(username="admin", hashed_password=get_password_hash("admin123")))

        for key, value in settings.items():
            upsert_setting(db, key, value)

        for points, name in benefits:
            if not db.query(Benefit).filter(Benefit.required_points == points, Benefit.name == name).first():
                db.add(Benefit(required_points=points, name=name, description=name, type="procedimento"))

        for name, category, price in procedures:
            if not db.query(Procedure).filter(Procedure.name == name).first():
                db.add(Procedure(name=name, category=category, description=f"Procedimento de {category.lower()}", default_price=price))

        if not db.query(Cycle).filter(Cycle.status == "ativo").first():
            today = date.today()
            db.add(Cycle(name="Ciclo Atual", start_date=today, end_date=today + timedelta(days=90), status="ativo", notes="Ciclo inicial de demonstração"))

        demo_client = db.query(Client).filter(Client.email == "ana@example.com").first()
        if not demo_client:
            demo_client = Client(full_name="Ana Ribeiro", phone="11999990000", email="ana@example.com", cpf="12345678900", origin="Cliente antiga", notes="Cliente demo")
            db.add(demo_client)
            db.flush()

        if not db.query(Ambassador).filter(Ambassador.client_id == demo_client.id).first():
            coupon = build_coupon(db, demo_client.full_name)
            db.add(Ambassador(client_id=demo_client.id, public_name="Ana R.", coupon=coupon, exclusive_link=build_link(coupon), status="ativa", level="comum"))

        if not db.query(ContractTemplate).first():
            db.add(ContractTemplate(
                name="Contrato padrão de procedimento",
                category="Procedimentos estéticos",
                content=(
                    "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\n"
                    "Cliente: {{nome_cliente}}\nCPF: {{cpf_cliente}}\nTelefone: {{telefone_cliente}}\n"
                    "Procedimento: {{procedimento}}\nValor: R$ {{valor}}\nData: {{data}}\nProfissional: {{profissional}}\n\n"
                    "{{nome_clinica}} - CNPJ {{cnpj_clinica}}"
                ),
            ))

        if not db.query(Product).first():
            db.add_all([
                Product(name="Protetor solar FPS 50", category="Dermocosmético", sku="PROT-FPS50", price=89.90, cost=45, stock_quantity=12, min_stock=3),
                Product(name="Sérum hidratante", category="Dermocosmético", sku="SER-HID", price=129.90, cost=62, stock_quantity=8, min_stock=2),
            ])

        if not db.query(AnamnesisTemplate).first():
            db.add(AnamnesisTemplate(
                name="Anamnese estética padrão",
                category="Estética",
                content="Queixa principal:\nHistórico de alergias:\nMedicamentos em uso:\nProcedimentos anteriores:\nContraindicações:",
            ))

        if not db.query(PrescriptionTemplate).first():
            db.add(PrescriptionTemplate(
                name="Orientações pós-procedimento",
                content="Cliente: {{nome_cliente}}\nOrientações:\n- Evitar exposição solar.\n- Usar protetor solar.\n- Retornar em caso de reação inesperada.",
            ))

        db.commit()
        print("Seed concluído. Admin padrão: admin / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    main()
