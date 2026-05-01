from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(180), index=True)
    phone: Mapped[str | None] = mapped_column(String(40), index=True)
    email: Mapped[str | None] = mapped_column(String(140), index=True)
    cpf: Mapped[str | None] = mapped_column(String(20), index=True)
    birth_date: Mapped[date | None] = mapped_column(Date)
    address: Mapped[str | None] = mapped_column(Text)
    zip_code: Mapped[str | None] = mapped_column(String(12))
    street: Mapped[str | None] = mapped_column(String(180))
    address_number: Mapped[str | None] = mapped_column(String(30))
    address_complement: Mapped[str | None] = mapped_column(String(120))
    neighborhood: Mapped[str | None] = mapped_column(String(120))
    city: Mapped[str | None] = mapped_column(String(120))
    state: Mapped[str | None] = mapped_column(String(2))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    origin: Mapped[str | None] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    ambassador = relationship("Ambassador", back_populates="client", uselist=False)


class Ambassador(Base):
    __tablename__ = "ambassadors"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), unique=True)
    public_name: Mapped[str] = mapped_column(String(160))
    coupon: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    exclusive_link: Mapped[str] = mapped_column(String(255))
    joined_at: Mapped[date] = mapped_column(Date, default=date.today)
    status: Mapped[str] = mapped_column(String(20), default="ativa")
    level: Mapped[str] = mapped_column(String(20), default="comum")
    notes: Mapped[str | None] = mapped_column(Text)

    client = relationship("Client", back_populates="ambassador")
    referrals = relationship("Referral", back_populates="ambassador")


class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(primary_key=True)
    ambassador_id: Mapped[int] = mapped_column(ForeignKey("ambassadors.id"))
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"))
    referred_name: Mapped[str] = mapped_column(String(180))
    referred_phone: Mapped[str | None] = mapped_column(String(40), index=True)
    referred_email: Mapped[str | None] = mapped_column(String(140), index=True)
    coupon_used: Mapped[str | None] = mapped_column(String(60))
    channel: Mapped[str] = mapped_column(String(30), default="recepção")
    referred_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(40), default="recebida")
    notes: Mapped[str | None] = mapped_column(Text)
    generated_point: Mapped[bool] = mapped_column(Boolean, default=False)
    point_validated_at: Mapped[datetime | None] = mapped_column(DateTime)

    ambassador = relationship("Ambassador", back_populates="referrals")
    client = relationship("Client")


class Procedure(Base):
    __tablename__ = "procedures"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    category: Mapped[str | None] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    default_price: Mapped[float] = mapped_column(Float, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class ProcedureRecord(Base):
    __tablename__ = "procedure_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    referral_id: Mapped[int | None] = mapped_column(ForeignKey("referrals.id"))
    procedure_id: Mapped[int] = mapped_column(ForeignKey("procedures.id"))
    date: Mapped[date] = mapped_column(Date, default=date.today)
    charged_value: Mapped[float] = mapped_column(Float, default=0)
    professional: Mapped[str | None] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="realizado")
    linked_contract_id: Mapped[int | None] = mapped_column(Integer)

    client = relationship("Client")
    referral = relationship("Referral")
    procedure = relationship("Procedure")


class Cycle(Base):
    __tablename__ = "cycles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="futuro")
    notes: Mapped[str | None] = mapped_column(Text)


class Point(Base):
    __tablename__ = "points"
    __table_args__ = (UniqueConstraint("referral_id", name="uq_point_referral"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ambassador_id: Mapped[int] = mapped_column(ForeignKey("ambassadors.id"))
    referral_id: Mapped[int] = mapped_column(ForeignKey("referrals.id"))
    cycle_id: Mapped[int] = mapped_column(ForeignKey("cycles.id"))
    points: Mapped[int] = mapped_column(Integer, default=1)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reason: Mapped[str] = mapped_column(String(180), default="Indicação validada")
    validated_by: Mapped[str | None] = mapped_column(String(80))


class Benefit(Base):
    __tablename__ = "benefits"

    id: Mapped[int] = mapped_column(primary_key=True)
    required_points: Mapped[int] = mapped_column(Integer, index=True)
    name: Mapped[str] = mapped_column(String(180))
    description: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str | None] = mapped_column(String(80))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class EarnedBenefit(Base):
    __tablename__ = "earned_benefits"
    __table_args__ = (UniqueConstraint("ambassador_id", "benefit_id", "cycle_id", name="uq_earned_benefit_cycle"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ambassador_id: Mapped[int] = mapped_column(ForeignKey("ambassadors.id"))
    benefit_id: Mapped[int] = mapped_column(ForeignKey("benefits.id"))
    cycle_id: Mapped[int] = mapped_column(ForeignKey("cycles.id"))
    status: Mapped[str] = mapped_column(String(20), default="conquistado")
    earned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    used_at: Mapped[datetime | None] = mapped_column(DateTime)
    notes: Mapped[str | None] = mapped_column(Text)

    benefit = relationship("Benefit")


class Credit(Base):
    __tablename__ = "credits"

    id: Mapped[int] = mapped_column(primary_key=True)
    ambassador_id: Mapped[int] = mapped_column(ForeignKey("ambassadors.id"))
    referral_id: Mapped[int | None] = mapped_column(ForeignKey("referrals.id"))
    value: Mapped[float] = mapped_column(Float, default=0)
    type: Mapped[str] = mapped_column(String(20), default="entrada")
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    description: Mapped[str | None] = mapped_column(Text)


class ContractTemplate(Base):
    __tablename__ = "contract_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    category: Mapped[str | None] = mapped_column(String(100))
    content: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class GeneratedContract(Base):
    __tablename__ = "generated_contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    procedure_record_id: Mapped[int | None] = mapped_column(ForeignKey("procedure_records.id"))
    template_id: Mapped[int] = mapped_column(ForeignKey("contract_templates.id"))
    final_content: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="gerado")
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    signed_at: Mapped[datetime | None] = mapped_column(DateTime)
    notes: Mapped[str | None] = mapped_column(Text)

    client = relationship("Client")
    template = relationship("ContractTemplate")
    procedure_record = relationship("ProcedureRecord")


class Setting(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(120), unique=True)
    value: Mapped[str | None] = mapped_column(Text)


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"))
    referral_id: Mapped[int | None] = mapped_column(ForeignKey("referrals.id"))
    procedure_id: Mapped[int | None] = mapped_column(ForeignKey("procedures.id"))
    title: Mapped[str] = mapped_column(String(180))
    start_at: Mapped[datetime] = mapped_column(DateTime)
    end_at: Mapped[datetime | None] = mapped_column(DateTime)
    professional: Mapped[str | None] = mapped_column(String(120))
    room: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(40), default="agendado")
    color: Mapped[str | None] = mapped_column(String(20))
    recurrence: Mapped[str | None] = mapped_column(String(40))
    notify_client: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client = relationship("Client")
    procedure = relationship("Procedure")


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"))
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id"))
    type: Mapped[str] = mapped_column(String(20), default="orcamento")
    status: Mapped[str] = mapped_column(String(30), default="aberto")
    sale_date: Mapped[date] = mapped_column(Date, default=date.today)
    due_date: Mapped[date | None] = mapped_column(Date)
    total: Mapped[float] = mapped_column(Float, default=0)
    paid_value: Mapped[float] = mapped_column(Float, default=0)
    payment_method: Mapped[str | None] = mapped_column(String(80))
    professional: Mapped[str | None] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client = relationship("Client")
    items = relationship("SaleItem", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    sale_id: Mapped[int] = mapped_column(ForeignKey("sales.id"))
    item_type: Mapped[str] = mapped_column(String(30), default="procedimento")
    procedure_id: Mapped[int | None] = mapped_column(ForeignKey("procedures.id"))
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"))
    description: Mapped[str] = mapped_column(String(180))
    quantity: Mapped[float] = mapped_column(Float, default=1)
    unit_price: Mapped[float] = mapped_column(Float, default=0)
    total: Mapped[float] = mapped_column(Float, default=0)


class AccountEntry(Base):
    __tablename__ = "account_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(20), default="receita")
    description: Mapped[str] = mapped_column(String(180))
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"))
    sale_id: Mapped[int | None] = mapped_column(ForeignKey("sales.id"))
    category: Mapped[str | None] = mapped_column(String(120))
    due_date: Mapped[date] = mapped_column(Date, default=date.today)
    paid_at: Mapped[date | None] = mapped_column(Date)
    value: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(30), default="nao_pago")
    payment_method: Mapped[str | None] = mapped_column(String(80))
    notes: Mapped[str | None] = mapped_column(Text)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    category: Mapped[str | None] = mapped_column(String(120))
    sku: Mapped[str | None] = mapped_column(String(80), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float, default=0)
    cost: Mapped[float] = mapped_column(Float, default=0)
    stock_quantity: Mapped[float] = mapped_column(Float, default=0)
    min_stock: Mapped[float] = mapped_column(Float, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    type: Mapped[str] = mapped_column(String(20), default="entrada")
    quantity: Mapped[float] = mapped_column(Float, default=0)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reason: Mapped[str | None] = mapped_column(String(180))
    notes: Mapped[str | None] = mapped_column(Text)

    product = relationship("Product")


class AnamnesisTemplate(Base):
    __tablename__ = "anamnesis_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    category: Mapped[str | None] = mapped_column(String(120))
    content: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AnamnesisRecord(Base):
    __tablename__ = "anamnesis_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id"))
    template_id: Mapped[int | None] = mapped_column(ForeignKey("anamnesis_templates.id"))
    title: Mapped[str] = mapped_column(String(180))
    answers: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="pendente")
    signed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client = relationship("Client")


class PrescriptionTemplate(Base):
    __tablename__ = "prescription_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    content: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PrescriptionRecord(Base):
    __tablename__ = "prescription_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    template_id: Mapped[int | None] = mapped_column(ForeignKey("prescription_templates.id"))
    title: Mapped[str] = mapped_column(String(180))
    content: Mapped[str] = mapped_column(Text)
    professional: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client = relationship("Client")
