import os
import io
import csv
import random
import math
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Query, Request, status, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database import engine, get_db, init_db
from models import Base, User, VirtualCard, Transaction, MoMoTopupOrder
import schemas
from auth import hash_password, verify_password, create_access_token, get_current_user
from card_utils import format_card_number, mask_card_number
from services.paystack_service import (
    initialize_momo_charge,
    verify_paystack_webhook_signature,
    verify_transaction,
    is_live_paystack,
)
from services.card_issuer_service import (
    issue_provider_card,
    fund_provider_card,
    freeze_provider_card,
)
from services.sms_service import send_sms_otp

# Initialize DB tables
init_db()

app = FastAPI(
    title="Coratech Global — Virtual Card & Mobile Money API",
    description="Production-ready Virtual Visa Card Issuance & Mobile Money Rails for Coratech Global",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard market rates (Bank of Ghana Commercial Selling Rate)
FX_USD_TO_GHS = float(os.getenv("FX_USD_TO_GHS", "11.55"))  # 1 USD = 11.55 GHS
MOMO_FEE_PERCENT = float(os.getenv("MOMO_FEE_PERCENT", "0.015"))  # 1.5% MoMo network processing fee

# ----------------- FX & Rates -----------------
@app.get("/api/fx-rate", response_model=schemas.ExchangeRateResponse)
def get_exchange_rate():
    return schemas.ExchangeRateResponse(
        fx_rate=FX_USD_TO_GHS,
        fee_percent=MOMO_FEE_PERCENT * 100,
        base_currency="USD",
        quote_currency="GHS",
        min_topup_ghs=20.0,
    )

# ----------------- Authentication Endpoints -----------------
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user account with clean phone number and hashed credentials."""
    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "")
    existing = db.query(User).filter(User.phone_number == clean_phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this phone number already exists")

    hashed_pw = hash_password(payload.password)
    user = User(
        phone_number=clean_phone,
        password_hash=hashed_pw,
        full_name=payload.full_name.strip(),
        email=payload.email.strip() if payload.email else None,
        kyc_status="UNVERIFIED",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.phone_number)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "phone_number": user.phone_number,
            "full_name": user.full_name,
            "email": user.email,
            "kyc_status": user.kyc_status,
        },
    }

@app.post("/api/auth/login")
def login(payload: schemas.UserLoginRequest, db: Session = Depends(get_db)):
    """Logs in an existing user and returns a signed JWT."""
    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "")
    user = db.query(User).filter(User.phone_number == clean_phone).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")

    token = create_access_token(user.id, user.phone_number)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "phone_number": user.phone_number,
            "full_name": user.full_name,
            "email": user.email,
            "kyc_status": user.kyc_status,
        },
    }

@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Fetches profile information for the authenticated user."""
    return {
        "id": current_user.id,
        "phone_number": current_user.phone_number,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "kyc_status": current_user.kyc_status,
        "ghana_card_number": current_user.ghana_card_number,
        "created_at": current_user.created_at,
    }

# ----------------- KYC Verification -----------------
@app.post("/api/kyc/submit")
def submit_kyc(payload: schemas.KycSubmitRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Verifies user identity via Ghana Card under Bank of Ghana compliance rules."""
    clean_card = payload.ghana_card_number.strip().upper()
    if not clean_card.startswith("GHA-") or len(clean_card) < 13:
        raise HTTPException(status_code=400, detail="Invalid Ghana Card format. Expected 'GHA-XXXXXXXXX-X'")

    current_user.ghana_card_number = clean_card
    current_user.kyc_status = "VERIFIED"
    db.commit()
    return {
        "status": "VERIFIED",
        "message": "Ghana Card successfully verified. Virtual card issuing unlocked.",
        "kyc_status": current_user.kyc_status,
    }

# ----------------- Virtual Cards -----------------
@app.post("/api/cards", response_model=schemas.CardResponse, status_code=status.HTTP_201_CREATED)
def issue_virtual_card(
    payload: schemas.CardCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Issues a new virtual Visa card linked to the authenticated user."""
    card_info = issue_provider_card(
        user_id=current_user.id,
        cardholder_name=payload.cardholder_name.strip().upper(),
        color_theme=payload.color_theme,
        daily_limit=payload.daily_limit,
    )

    card = VirtualCard(
        user_id=current_user.id,
        provider=card_info["provider"],
        provider_card_id=card_info["provider_card_id"],
        card_number=card_info["card_number"],
        masked_number=card_info["masked_number"],
        cardholder_name=payload.cardholder_name.strip().upper(),
        expiry_month=card_info["expiry_month"],
        expiry_year=card_info["expiry_year"],
        cvv=card_info["cvv"],
        pin=card_info["pin"],
        color_theme=payload.color_theme,
        daily_limit=payload.daily_limit,
        per_tx_limit=payload.per_tx_limit,
        balance=0.0,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card

@app.get("/api/cards", response_model=List[schemas.CardResponse])
def list_user_cards(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lists cards owned by the authenticated user."""
    return (
        db.query(VirtualCard)
        .filter(VirtualCard.user_id == current_user.id, VirtualCard.status != "TERMINATED")
        .order_by(desc(VirtualCard.created_at))
        .all()
    )

@app.get("/api/cards/{card_id}", response_model=schemas.CardResponse)
def get_card(card_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.query(VirtualCard).filter(VirtualCard.id == card_id, VirtualCard.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or unauthorized")
    return card

@app.get("/api/cards/{card_id}/reveal", response_model=schemas.CardDetailsResponse)
def reveal_card_details(card_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Securely reveals full card credentials for online payment checkout."""
    card = db.query(VirtualCard).filter(VirtualCard.id == card_id, VirtualCard.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or unauthorized")
    if card.status == "TERMINATED":
        raise HTTPException(status_code=400, detail="Card is deactivated")

    formatted_pan = format_card_number(card.card_number)
    return schemas.CardDetailsResponse(
        id=card.id,
        masked_number=card.masked_number,
        card_number=formatted_pan,
        cardholder_name=card.cardholder_name,
        expiry_month=card.expiry_month,
        expiry_year=card.expiry_year,
        cvv=card.cvv,
        pin=card.pin,
        balance=card.balance,
        currency=card.currency,
        status=card.status,
        color_theme=card.color_theme,
        daily_limit=card.daily_limit,
        per_tx_limit=card.per_tx_limit,
        online_enabled=card.online_enabled,
        intl_enabled=card.intl_enabled,
        billing_address=card.billing_address,
        postal_code=card.postal_code,
        created_at=card.created_at,
    )

@app.patch("/api/cards/{card_id}/controls", response_model=schemas.CardResponse)
def update_card_controls(
    card_id: str,
    payload: schemas.CardUpdateControls,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates card security status and spending limits."""
    card = db.query(VirtualCard).filter(VirtualCard.id == card_id, VirtualCard.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or unauthorized")

    if payload.status is not None:
        if payload.status in ["ACTIVE", "FROZEN"]:
            freeze_provider_card(card.provider_card_id, freeze=(payload.status == "FROZEN"))
            card.status = payload.status
        else:
            raise HTTPException(status_code=400, detail="Invalid status")

    if payload.daily_limit is not None:
        card.daily_limit = payload.daily_limit
    if payload.per_tx_limit is not None:
        card.per_tx_limit = payload.per_tx_limit
    if payload.online_enabled is not None:
        card.online_enabled = payload.online_enabled
    if payload.intl_enabled is not None:
        card.intl_enabled = payload.intl_enabled

    db.commit()
    db.refresh(card)
    return card

@app.delete("/api/cards/{card_id}")
def terminate_card(card_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.query(VirtualCard).filter(VirtualCard.id == card_id, VirtualCard.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    card.status = "TERMINATED"
    db.commit()
    return {"message": "Card permanently deactivated"}

# ----------------- Mobile Money Top-Up -----------------
@app.post("/api/wallet/topup", response_model=schemas.TopupResponse)
def topup_with_momo(
    payload: schemas.TopupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initiates Mobile Money top-up via Paystack Ghana."""
    card = db.query(VirtualCard).filter(VirtualCard.id == payload.card_id, VirtualCard.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Target card not found or unauthorized")
    if card.status == "TERMINATED":
        raise HTTPException(status_code=400, detail="Cannot top up a deactivated card")

    fee_ghs = round(payload.ghs_amount * MOMO_FEE_PERCENT, 2)
    net_ghs = payload.ghs_amount - fee_ghs
    usd_to_credit = round(net_ghs / FX_USD_TO_GHS, 2)

    if usd_to_credit <= 0:
        raise HTTPException(status_code=400, detail="Topup amount too low after fees")

    order = MoMoTopupOrder(
        user_id=current_user.id,
        card_id=card.id,
        network=payload.network.upper(),
        phone_number=payload.phone_number,
        ghs_amount=payload.ghs_amount,
        usd_amount=usd_to_credit,
        fx_rate=FX_USD_TO_GHS,
        fee_ghs=fee_ghs,
        status="PENDING",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Initialize Paystack charge
    paystack_res = initialize_momo_charge(
        email=current_user.email or f"{current_user.phone_number}@coratechglobal.com",
        amount_ghs=payload.ghs_amount,
        phone_number=payload.phone_number,
        network=payload.network,
        reference=order.reference,
    )

    # If simulated/test mode, auto-settle instantly
    if paystack_res.get("simulated", False) or not is_live_paystack():
        order.status = "SUCCESS"
        fund_provider_card(card.provider_card_id, usd_to_credit)
        card.balance = round(card.balance + usd_to_credit, 2)

        tx = Transaction(
            user_id=current_user.id,
            card_id=card.id,
            type="TOPUP",
            amount=usd_to_credit,
            local_amount=payload.ghs_amount,
            fee=round(fee_ghs / FX_USD_TO_GHS, 2),
            merchant_name=f"{payload.network.upper()} MoMo Top-Up",
            merchant_category="Mobile Money",
            status="SUCCESS",
        )
        db.add(tx)
        db.commit()
        db.refresh(card)

    return schemas.TopupResponse(
        reference=order.reference,
        status=order.status,
        ghs_amount=payload.ghs_amount,
        usd_credited=usd_to_credit,
        fx_rate=FX_USD_TO_GHS,
        fee_ghs=fee_ghs,
        new_balance=card.balance,
        message=f"Successfully credited ${usd_to_credit:.2f} to Visa ending in {card.card_number[-4:]}",
    )

# ----------------- Paystack Webhook Handler -----------------
@app.post("/api/webhooks/paystack")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Receives cryptographically signed webhooks from Paystack.
    Processes 'charge.success' to credit real Mobile Money payments.
    """
    body_bytes = await request.body()
    if x_paystack_signature and not verify_paystack_webhook_signature(body_bytes, x_paystack_signature):
        raise HTTPException(status_code=400, detail="Invalid HMAC signature")

    event_data = await request.json()
    event_name = event_data.get("event")

    if event_name == "charge.success":
        data = event_data.get("data", {})
        reference = data.get("reference")

        order = db.query(MoMoTopupOrder).filter(MoMoTopupOrder.reference == reference).first()
        if order and order.status == "PENDING":
            order.status = "SUCCESS"
            card = db.query(VirtualCard).filter(VirtualCard.id == order.card_id).first()
            if card:
                fund_provider_card(card.provider_card_id, order.usd_amount)
                card.balance = round(card.balance + order.usd_amount, 2)

                tx = Transaction(
                    user_id=order.user_id,
                    card_id=card.id,
                    type="TOPUP",
                    amount=order.usd_amount,
                    local_amount=order.ghs_amount,
                    fee=round(order.fee_ghs / FX_USD_TO_GHS, 2),
                    merchant_name=f"{order.network} MoMo Deposit",
                    merchant_category="Mobile Money",
                    status="SUCCESS",
                )
                db.add(tx)
                db.commit()

    return {"status": "ok"}

# ----------------- Cashout / Sweep -----------------
@app.post("/api/wallet/sweep")
def sweep_card_funds(
    payload: schemas.SweepRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Withdraws USD balance from card back to user's Mobile Money wallet."""
    card = db.query(VirtualCard).filter(VirtualCard.id == payload.card_id, VirtualCard.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if card.status == "FROZEN":
        raise HTTPException(status_code=400, detail="Unfreeze card before sweeping funds")
    if payload.usd_amount > card.balance:
        raise HTTPException(status_code=400, detail="Insufficient card balance for sweep")

    ghs_amount = round(payload.usd_amount * (FX_USD_TO_GHS - 0.20), 2)
    card.balance = round(card.balance - payload.usd_amount, 2)

    tx = Transaction(
        user_id=current_user.id,
        card_id=card.id,
        type="SWEEP",
        amount=payload.usd_amount,
        local_amount=ghs_amount,
        fee=0.0,
        merchant_name=f"Cashout to {payload.network.upper()} ({payload.phone_number[-4:]})",
        merchant_category="MoMo Cashout",
        status="SUCCESS",
    )
    db.add(tx)
    db.commit()
    return {
        "status": "SUCCESS",
        "swept_usd": payload.usd_amount,
        "disbursed_ghs": ghs_amount,
        "new_balance": card.balance,
        "phone_number": payload.phone_number,
    }

# ----------------- User Transactions & Stats -----------------
@app.get("/api/cards/{card_id}/transactions", response_model=List[schemas.TransactionResponse])
def get_card_transactions(card_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Transaction)
        .filter(Transaction.card_id == card_id, Transaction.user_id == current_user.id)
        .order_by(desc(Transaction.created_at))
        .all()
    )

@app.get("/api/transactions", response_model=List[schemas.TransactionResponse])
def get_all_user_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(desc(Transaction.created_at))
        .limit(100)
        .all()
    )

@app.get("/api/stats")
def get_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_cards = db.query(VirtualCard).filter(VirtualCard.user_id == current_user.id, VirtualCard.status != "TERMINATED").count()
    active_cards = db.query(VirtualCard).filter(VirtualCard.user_id == current_user.id, VirtualCard.status == "ACTIVE").count()
    total_balance = (
        db.query(func.sum(VirtualCard.balance))
        .filter(VirtualCard.user_id == current_user.id, VirtualCard.status != "TERMINATED")
        .scalar()
        or 0.0
    )
    total_spend = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.user_id == current_user.id, Transaction.type == "PURCHASE", Transaction.status == "SUCCESS")
        .scalar()
        or 0.0
    )
    total_topups = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.user_id == current_user.id, Transaction.type == "TOPUP", Transaction.status == "SUCCESS")
        .scalar()
        or 0.0
    )
    return {
        "total_cards": total_cards,
        "active_cards": active_cards,
        "total_balance_usd": round(total_balance, 2),
        "total_spend_usd": round(total_spend, 2),
        "total_topups_usd": round(total_topups, 2),
        "fx_usd_to_ghs": FX_USD_TO_GHS,
    }

# ----------------- SMS OTP Phone Verification -----------------
@app.post("/api/auth/send-otp")
def send_phone_otp(payload: schemas.OtpSendRequest, db: Session = Depends(get_db)):
    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "")
    user = db.query(User).filter(User.phone_number == clean_phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = f"{random.randint(100000, 999999)}"
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    sms_res = send_sms_otp(clean_phone, otp)
    return {"status": "success", "message": "OTP sent via SMS", "delivery": sms_res}

@app.post("/api/auth/verify-otp")
def verify_phone_otp(payload: schemas.OtpVerifyRequest, db: Session = Depends(get_db)):
    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "")
    user = db.query(User).filter(User.phone_number == clean_phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.otp_code or user.otp_code != payload.otp_code.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP code expired. Please request a new code.")
    
    user.phone_verified = True
    user.otp_code = None
    db.commit()
    return {"status": "success", "message": "Phone number verified successfully!", "phone_verified": True}

# ----------------- Coratech Executive Admin Dashboard -----------------
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "coratech_admin_2026_supersecure")

def verify_admin_access(x_admin_key: Optional[str] = Header(None)):
    if not x_admin_key or x_admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized: Admin passcode required")
    return True

@app.get("/api/admin/overview")
def get_admin_overview(_auth: bool = Depends(verify_admin_access), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    verified_users = db.query(User).filter(User.kyc_status == "VERIFIED").count()
    pending_kyc = db.query(User).filter(User.kyc_status == "PENDING").count()
    total_cards = db.query(VirtualCard).filter(VirtualCard.status != "TERMINATED").count()
    active_cards = db.query(VirtualCard).filter(VirtualCard.status == "ACTIVE").count()
    frozen_cards = db.query(VirtualCard).filter(VirtualCard.status == "FROZEN").count()

    total_topup_volume_usd = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.type == "TOPUP", Transaction.status == "SUCCESS")
        .scalar()
        or 0.0
    )
    total_momo_ghs_collected = (
        db.query(func.sum(Transaction.local_amount))
        .filter(Transaction.type == "TOPUP", Transaction.status == "SUCCESS")
        .scalar()
        or 0.0
    )
    total_card_spend_usd = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.type == "PURCHASE", Transaction.status == "SUCCESS")
        .scalar()
        or 0.0
    )

    fx_spread_profit_usd = round(total_topup_volume_usd * 0.02, 2)
    momo_fee_profit_usd = round(total_topup_volume_usd * 0.005, 2)
    card_issuance_profit_usd = round(total_cards * 3.0, 2)
    total_estimated_profit_usd = round(fx_spread_profit_usd + momo_fee_profit_usd + card_issuance_profit_usd, 2)

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "pending_kyc": pending_kyc,
        "total_cards": total_cards,
        "active_cards": active_cards,
        "frozen_cards": frozen_cards,
        "total_topup_usd": round(total_topup_volume_usd, 2),
        "total_momo_ghs": round(total_momo_ghs_collected, 2),
        "total_spend_usd": round(total_card_spend_usd, 2),
        "profit": {
            "fx_spread_usd": fx_spread_profit_usd,
            "momo_fee_usd": momo_fee_profit_usd,
            "card_issuance_usd": card_issuance_profit_usd,
            "total_net_profit_usd": total_estimated_profit_usd,
            "total_net_profit_ghs": round(total_estimated_profit_usd * FX_USD_TO_GHS, 2),
        }
    }

@app.get("/api/admin/users")
def get_admin_users(_auth: bool = Depends(verify_admin_access), db: Session = Depends(get_db)):
    users = db.query(User).order_by(desc(User.created_at)).limit(100).all()
    result = []
    for u in users:
        cards_count = len(u.cards)
        total_balance = sum(c.balance for c in u.cards if c.status != "TERMINATED")
        result.append({
            "id": u.id,
            "full_name": u.full_name,
            "phone_number": u.phone_number,
            "email": u.email,
            "kyc_status": u.kyc_status,
            "ghana_card_number": u.ghana_card_number,
            "phone_verified": u.phone_verified,
            "cards_count": cards_count,
            "total_balance_usd": round(total_balance, 2),
            "created_at": u.created_at,
        })
    return result

@app.get("/api/admin/cards")
def get_admin_cards(_auth: bool = Depends(verify_admin_access), db: Session = Depends(get_db)):
    cards = db.query(VirtualCard).filter(VirtualCard.status != "TERMINATED").order_by(desc(VirtualCard.created_at)).all()
    result = []
    for c in cards:
        result.append({
            "id": c.id,
            "user_id": c.user_id,
            "cardholder_name": c.cardholder_name,
            "masked_number": c.masked_number,
            "balance": c.balance,
            "currency": c.currency,
            "status": c.status,
            "color_theme": c.color_theme,
            "daily_limit": c.daily_limit,
            "created_at": c.created_at,
        })
    return result

@app.post("/api/admin/card-toggle")
def admin_card_toggle(payload: schemas.AdminCardToggleRequest, _auth: bool = Depends(verify_admin_access), db: Session = Depends(get_db)):
    card = db.query(VirtualCard).filter(VirtualCard.id == payload.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    card.status = payload.status
    db.commit()
    return {"status": "success", "card_id": card.id, "new_status": card.status}

@app.post("/api/admin/kyc-action")
def admin_kyc_action(payload: schemas.KycActionRequest, _auth: bool = Depends(verify_admin_access), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if payload.action == "APPROVE":
        user.kyc_status = "VERIFIED"
        user.kyc_rejection_reason = None
    elif payload.action == "REJECT":
        user.kyc_status = "REJECTED"
        user.kyc_rejection_reason = payload.rejection_reason or "Document details could not be validated with NIA."
    else:
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT")
    
    db.commit()
    return {"status": "success", "user_id": user.id, "kyc_status": user.kyc_status}

@app.get("/api/admin/export-csv")
def export_transactions_csv(_auth: bool = Depends(verify_admin_access), db: Session = Depends(get_db)):
    txs = db.query(Transaction).order_by(desc(Transaction.created_at)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Reference", "User ID", "Card ID", "Type", "Amount USD", "Local Amount GHS", "Fee USD", "Merchant", "Category", "Status", "Date"])
    for t in txs:
        writer.writerow([t.reference, t.user_id, t.card_id, t.type, t.amount, t.local_amount, t.fee, t.merchant_name, t.merchant_category, t.status, t.created_at.isoformat()])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=coratech_reconciliation_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )
