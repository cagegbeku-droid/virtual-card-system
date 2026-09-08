import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine
from card_utils import calculate_luhn_checksum

client = TestClient(app)

def setup_function():
    # Fresh database for clean tests
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def test_luhn_checksum_valid():
    pan_prefix = "424242424242424"
    check = calculate_luhn_checksum(pan_prefix)
    assert 0 <= check <= 9

def test_user_registration_and_login():
    # 1. Register User
    reg_resp = client.post("/api/auth/register", json={
        "phone_number": "0244112233",
        "password": "StrongPassword123!",
        "full_name": "Kwame Mensah",
        "email": "kwame@coratechglobal.com",
    })
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["phone_number"] == "0244112233"
    assert data["user"]["kyc_status"] == "UNVERIFIED"

    # 2. Login
    login_resp = client.post("/api/auth/login", json={
        "phone_number": "0244112233",
        "password": "StrongPassword123!",
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

def test_kyc_verification_flow():
    # Register
    reg_resp = client.post("/api/auth/register", json={
        "phone_number": "0244998877",
        "password": "Password123!",
        "full_name": "Ama Osei",
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit KYC (Ghana Card)
    kyc_resp = client.post("/api/kyc/submit", json={
        "ghana_card_number": "GHA-723489123-4",
        "full_name": "Ama Osei",
        "dob": "1994-08-14"
    }, headers=headers)
    assert kyc_resp.status_code == 200
    assert kyc_resp.json()["kyc_status"] == "VERIFIED"

    # Verify profile
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.json()["kyc_status"] == "VERIFIED"
    assert me_resp.json()["ghana_card_number"] == "GHA-723489123-4"

def test_authenticated_card_issuance_and_topup():
    # 1. Register & Auth
    reg = client.post("/api/auth/register", json={
        "phone_number": "0201234567",
        "password": "Password123!",
        "full_name": "Kofi Mensah",
    }).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    # 2. Issue card
    card_resp = client.post("/api/cards", json={
        "cardholder_name": "Kofi Mensah",
        "color_theme": "cyber_neon",
        "daily_limit": 600.0,
    }, headers=headers)
    assert card_resp.status_code == 201
    card_id = card_resp.json()["id"]
    assert card_resp.json()["balance"] == 0.0

    # 3. Top up with MoMo
    topup_resp = client.post("/api/wallet/topup", json={
        "card_id": card_id,
        "network": "MTN",
        "phone_number": "0201234567",
        "ghs_amount": 500.0,
    }, headers=headers)
    assert topup_resp.status_code == 200
    assert topup_resp.json()["status"] == "SUCCESS"
    assert topup_resp.json()["usd_credited"] > 31.0

    # 4. Reveal Details
    reveal = client.get(f"/api/cards/{card_id}/reveal", headers=headers).json()
    assert len(reveal["cvv"]) == 3
    assert len(reveal["card_number"].replace(" ", "")) == 16
