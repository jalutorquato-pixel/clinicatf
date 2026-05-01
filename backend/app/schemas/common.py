from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(ORMModel):
    id: int
    username: str
    is_active: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ClientBase(BaseModel):
    full_name: str
    phone: str | None = None
    email: EmailStr | None = None
    cpf: str | None = None
    birth_date: date | None = None
    address: str | None = None
    zip_code: str | None = None
    street: str | None = None
    address_number: str | None = None
    address_complement: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    origin: str | None = None
    notes: str | None = None
    is_active: bool = True


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ClientBase):
    full_name: str | None = None


class ClientOut(ClientBase, ORMModel):
    id: int
    created_at: datetime


class AmbassadorBase(BaseModel):
    client_id: int
    public_name: str | None = None
    coupon: str | None = None
    status: str = "ativa"
    level: str = "comum"
    notes: str | None = None


class AmbassadorCreate(AmbassadorBase):
    pass


class AmbassadorUpdate(BaseModel):
    public_name: str | None = None
    coupon: str | None = None
    status: str | None = None
    level: str | None = None
    notes: str | None = None


class AmbassadorOut(ORMModel):
    id: int
    client_id: int
    public_name: str
    coupon: str
    exclusive_link: str
    joined_at: date
    status: str
    level: str
    notes: str | None = None
    client: ClientOut | None = None


class ReferralBase(BaseModel):
    ambassador_id: int
    client_id: int | None = None
    referred_name: str
    referred_phone: str | None = None
    referred_email: EmailStr | None = None
    coupon_used: str | None = None
    channel: str = "recepção"
    status: str = "recebida"
    notes: str | None = None


class ReferralCreate(ReferralBase):
    pass


class ReferralUpdate(BaseModel):
    client_id: int | None = None
    referred_name: str | None = None
    referred_phone: str | None = None
    referred_email: EmailStr | None = None
    coupon_used: str | None = None
    channel: str | None = None
    status: str | None = None
    notes: str | None = None


class ReferralOut(ReferralBase, ORMModel):
    id: int
    referred_at: datetime
    generated_point: bool
    point_validated_at: datetime | None = None


class ProcedureBase(BaseModel):
    name: str
    category: str | None = None
    description: str | None = None
    default_price: float = 0
    is_active: bool = True


class ProcedureOut(ProcedureBase, ORMModel):
    id: int


class ProcedureRecordBase(BaseModel):
    client_id: int
    referral_id: int | None = None
    procedure_id: int
    date: date
    charged_value: float = 0
    professional: str | None = None
    notes: str | None = None
    status: str = "realizado"
    linked_contract_id: int | None = None


class ProcedureRecordOut(ProcedureRecordBase, ORMModel):
    id: int


class CycleBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    status: str = "futuro"
    notes: str | None = None


class CycleOut(CycleBase, ORMModel):
    id: int


class PointOut(ORMModel):
    id: int
    ambassador_id: int
    referral_id: int
    cycle_id: int
    points: int
    date: datetime
    reason: str
    validated_by: str | None = None


class BenefitBase(BaseModel):
    required_points: int
    name: str
    description: str | None = None
    type: str | None = None
    is_active: bool = True


class BenefitOut(BenefitBase, ORMModel):
    id: int


class EarnedBenefitOut(ORMModel):
    id: int
    ambassador_id: int
    benefit_id: int
    cycle_id: int
    status: str
    earned_at: datetime
    used_at: datetime | None = None
    notes: str | None = None
    benefit: BenefitOut | None = None


class CreditBase(BaseModel):
    ambassador_id: int
    referral_id: int | None = None
    value: float
    type: str = "entrada"
    description: str | None = None


class CreditOut(CreditBase, ORMModel):
    id: int
    date: datetime


class ContractTemplateBase(BaseModel):
    name: str
    category: str | None = None
    content: str
    is_active: bool = True


class ContractTemplateOut(ContractTemplateBase, ORMModel):
    id: int
    created_at: datetime


class GeneratedContractCreate(BaseModel):
    client_id: int
    template_id: int
    procedure_record_id: int | None = None
    notes: str | None = None


class GeneratedContractOut(ORMModel):
    id: int
    client_id: int
    procedure_record_id: int | None = None
    template_id: int
    final_content: str
    status: str
    generated_at: datetime
    signed_at: datetime | None = None
    notes: str | None = None


class SettingIn(BaseModel):
    key: str
    value: str | None = None


class SettingOut(SettingIn, ORMModel):
    id: int


class DashboardOut(BaseModel):
    metrics: dict[str, Any]
    ranking: list[dict[str, Any]]
    charts: dict[str, list[dict[str, Any]]]
