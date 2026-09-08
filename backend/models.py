import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Integer, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number = Column(String(20), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    kyc_status = Column(String(20), default="UNVERIFIED")  # UNVERIFIED, PENDING, VERIFIED
    ghana_card_number = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cards = relationship("VirtualCard", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user")

class VirtualCard(Base):
    __tablename__ = "virtual_cards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String(30), default="BRIDGECARD")  # BRIDGECARD, FLUTTERWAVE, SANDBOX
    provider_card_id = Column(String(100), nullable=True)
    provider_token = Column(String(255), nullable=True)
    
    card_number = Column(String(19), nullable=False, unique=True)
    masked_number = Column(String(24), nullable=False)
    cardholder_name = Column(String(100), nullable=False)
    expiry_month = Column(Integer, nullable=False)
    expiry_year = Column(Integer, nullable=False)
    cvv = Column(String(4), nullable=False)
    pin = Column(String(4), default="1234")
    billing_address = Column(Text, default="Coratech Global Hub, Independence Ave, Accra, Ghana")
    postal_code = Column(String(20), default="GA-110-2345")
    
    balance = Column(Float, default=0.0)
    currency = Column(String(3), default="USD")
    status = Column(String(20), default="ACTIVE")  # ACTIVE, FROZEN, TERMINATED
    color_theme = Column(String(20), default="obsidian")  # obsidian, cyber_neon, royal_gold, emerald
    
    # Controls & Limits
    daily_limit = Column(Float, default=500.0)
    per_tx_limit = Column(Float, default=250.0)
    online_enabled = Column(Boolean, default=True)
    intl_enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="cards")
    transactions = relationship("Transaction", back_populates="card", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    card_id = Column(String(36), ForeignKey("virtual_cards.id"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # TOPUP, PURCHASE, REFUND, SWEEP
    amount = Column(Float, nullable=False)      # USD
    local_amount = Column(Float, default=0.0)  # GHS
    fee = Column(Float, default=0.0)
    merchant_name = Column(String(100), nullable=False)
    merchant_category = Column(String(50), default="Online")
    status = Column(String(20), default="SUCCESS")  # SUCCESS, DECLINED, PENDING
    decline_reason = Column(String(255), nullable=True)
    reference = Column(String(50), unique=True, default=lambda: f"TX-{uuid.uuid4().hex[:10].upper()}")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    card = relationship("VirtualCard", back_populates="transactions")

class MoMoTopupOrder(Base):
    __tablename__ = "momo_topup_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    card_id = Column(String(36), nullable=False, index=True)
    network = Column(String(20), nullable=False)  # MTN, TELECEL, AT
    phone_number = Column(String(20), nullable=False)
    ghs_amount = Column(Float, nullable=False)
    usd_amount = Column(Float, nullable=False)
    fx_rate = Column(Float, nullable=False)       # 1 USD = X GHS
    fee_ghs = Column(Float, default=0.0)
    reference = Column(String(50), unique=True, default=lambda: f"MOMO-{uuid.uuid4().hex[:10].upper()}")
    paystack_reference = Column(String(100), nullable=True)
    status = Column(String(20), default="PENDING") # PENDING, SUCCESS, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)
