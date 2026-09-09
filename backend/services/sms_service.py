import os
import requests
from typing import Dict, Any

ARKESEL_API_KEY = os.getenv("ARKESEL_API_KEY", "")
ARKESEL_SENDER_ID = os.getenv("ARKESEL_SENDER_ID", "Coratech")

def format_ghana_phone(phone: str) -> str:
    """Formats phone number into international 233 format."""
    clean = phone.strip().replace("+", "").replace(" ", "").replace("-", "")
    if clean.startswith("0") and len(clean) == 10:
        return f"233{clean[1:]}"
    if clean.startswith("233"):
        return clean
    return clean

def send_sms_otp(phone_number: str, otp_code: str) -> Dict[str, Any]:
    """Dispatches a single-segment GSM SMS OTP via Arkesel Ghana."""
    formatted_phone = format_ghana_phone(phone_number)
    message = f"Your Coratech AfriVisa verification code is: {otp_code}. Valid for 10 minutes. Do not share this with anyone."

    if not ARKESEL_API_KEY:
        print(f"[SMS SANDBOX] Sending OTP {otp_code} to {formatted_phone}")
        return {"status": "success", "simulated": True, "code": otp_code}

    url = "https://sms.arkesel.com/api/v2/sms/send"
    headers = {
        "api-key": ARKESEL_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "sender": ARKESEL_SENDER_ID[:11],
        "message": message,
        "recipients": [formatted_phone],
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        data = response.json()
        return {"status": "success", "data": data}
    except Exception as e:
        print("Arkesel SMS Error:", e)
        return {"status": "error", "message": str(e)}
