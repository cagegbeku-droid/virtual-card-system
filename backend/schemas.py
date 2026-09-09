from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserRegisterRequest(BaseModel):
    phone_number: str = Field(..., min_length=9, max_length=20)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=3, max_length=100)
    email: Optional[str] = None

class UserLoginRequest(BaseModel):
    phone_number: str = Field(..., min_length=9, max_length=20)
    password: str = Field(..., min_length=6, max_length=100)

class KycSubmitRequest(BaseModel):
    ghana_card_number: str = Field(..., min_length=13, max_length=30)
    full_name: str = Field(..., min_length=3, max_length=100)
    dob: Optional[str] = None

class OtpSendRequest(BaseModel):
    phone_number: str = Field(..., min_length=9, max_length=20)

class OtpVerifyRequest(BaseModel):
    phone_number: str = Field(..., min_length=9, max_length=20)
    otp_code: str = Field(..., min_length=4, max_length=10)

class KycActionRequest(BaseModel):
    user_id: str
    action: str = Field(..., description="APPROVE or REJECT")
    rejection_reason: Optional[str] = None

class AdminCardToggleRequest(BaseModel):
    card_id: str
    status: str = Field(..., description="ACTIVE or FROZEN")

class CardCreateRequest(BaseModel):
    cardholder_name: str = Field(..., min_length=3, max_length=60)
    color_theme: str = Field(default="cyber_neon")  # cyber_neon, obsidian, royal_gold, emerald
    daily_limit: float = Field(default=500.0, ge=10.0, le=5000.0)
    per_tx_limit: float = Field(default=250.0, ge=5.0, le=2500.0)

class CardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    masked_number: str
    cardholder_name: str
    expiry_month: int
    expiry_year: int
    balance: float
    currency: str
    status: str
    color_theme: str
    daily_limit: float
    per_tx_limit: float
    online_enabled: bool
    intl_enabled: bool
    billing_address: str
    postal_code: str
    created_at: datetime

class CardDetailsResponse(CardResponse):
    card_number: str
    cvv: str
    pin: str

class CardUpdateControls(BaseModel):
    status: Optional[str] = None
    daily_limit: Optional[float] = None
    per_tx_limit: Optional[float] = None
    online_enabled: Optional[bool] = None
    intl_enabled: Optional[bool] = None

class TopupRequest(BaseModel):
    card_id: str
    network: str = Field(..., description="MTN, TELECEL, or AT")
    phone_number: str = Field(..., min_length=9, max_length=15)
    ghs_amount: float = Field(..., ge=20.0, le=10000.0)

class TopupResponse(BaseModel):
    reference: str
    status: str
    ghs_amount: float
    usd_credited: float
    fx_rate: float
    fee_ghs: float
    new_balance: float
    message: str

class SweepRequest(BaseModel):
    card_id: str
    network: str
    phone_number: str
    usd_amount: float = Field(..., gt=0.0)

class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    card_id: str
    type: str
    amount: float
    local_amount: float
    fee: float
    merchant_name: str
    merchant_category: str
    status: str
    decline_reason: Optional[str]
    reference: str
    created_at: datetime

class ExchangeRateResponse(BaseModel):
    fx_rate: float            # 1 USD = 15.50 GHS
    fee_percent: float        # e.g., 1.5%
    base_currency: str = "USD"
    quote_currency: str = "GHS"
    min_topup_ghs: float = 20.0
