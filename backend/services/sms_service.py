import os
import requests
from dotenv import load_dotenv
from typing import Dict, Any

load_dotenv()

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
    api_key = os.getenv("ARKESEL_API_KEY", "U3ZWUm5CdHB1SVFGVWJVUkh6YWQ")
    sender_id = os.getenv("ARKESEL_SENDER_ID", "Coratech")[:11]

    formatted_phone = format_ghana_phone(phone_number)
    message = f"Your Coratech AfriVisa verification code is: {otp_code}. Valid for 10 minutes. Do not share this with anyone."

    if not api_key:
        print(f"[SMS SANDBOX] Sending OTP {otp_code} to {formatted_phone}")
        return {"status": "success", "simulated": True, "code": otp_code}

    url = "https://sms.arkesel.com/api/v2/sms/send"
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "sender": sender_id,
        "message": message,
        "recipients": [formatted_phone],
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        data = response.json()
        print(f"[ARKESEL DISPATCH] Phone: {formatted_phone} | Status: {response.status_code} | Body: {data}")
        return {"status": "success", "data": data, "code": otp_code}
    except Exception as e:
        print(f"[ARKESEL ERROR] Failed to send SMS to {formatted_phone}:", e)
        return {"status": "error", "message": str(e), "code": otp_code}
