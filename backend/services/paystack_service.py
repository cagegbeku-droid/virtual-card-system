import os
import hmac
import hashlib
import requests
from typing import Dict, Any, Optional

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "")
PAYSTACK_BASE_URL = "https://api.paystack.co"

def is_live_paystack() -> bool:
    return bool(PAYSTACK_SECRET_KEY and PAYSTACK_SECRET_KEY.startswith("sk_"))

def initialize_momo_charge(
    email: str,
    amount_ghs: float,
    phone_number: str,
    network: str,
    reference: str,
    callback_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Initializes a Paystack Mobile Money collection in Ghana.
    Amount is converted to pesewas (1 GHS = 100 pesewas).
    """
    if not is_live_paystack():
        # Clean local sandbox emulation when API keys are pending
        return {
            "status": True,
            "simulated": True,
            "data": {
                "authorization_url": f"https://checkout.paystack.com/{reference}",
                "access_code": f"acc_{reference[:8]}",
                "reference": reference,
            }
        }

    url = f"{PAYSTACK_BASE_URL}/transaction/initialize"
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "email": email or f"{phone_number}@coratechglobal.com",
        "amount": int(round(amount_ghs * 100)),  # in pesewas
        "currency": "GHS",
        "reference": reference,
        "callback_url": callback_url,
        "channels": ["mobile_money"],
        "metadata": {
            "phone_number": phone_number,
            "network": network.lower(),
            "purpose": "Coratech Virtual Card MoMo Top-Up",
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        return response.json()
    except Exception as e:
        return {"status": False, "message": str(e)}

def verify_paystack_webhook_signature(payload_bytes: bytes, signature_header: str) -> bool:
    """Verifies that incoming webhook requests are genuinely signed by Paystack."""
    if not PAYSTACK_SECRET_KEY:
        return True  # Development mode
    computed_signature = hmac.new(
        PAYSTACK_SECRET_KEY.encode("utf-8"),
        payload_bytes,
        hashlib.sha512
    ).hexdigest()
    return hmac.compare_digest(computed_signature, signature_header)

def verify_transaction(reference: str) -> Dict[str, Any]:
    """Queries Paystack directly to verify transaction status."""
    if not is_live_paystack():
        return {"status": True, "data": {"status": "success", "amount": 50000}}

    url = f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}"
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        return res.json()
    except Exception as e:
        return {"status": False, "message": str(e)}
