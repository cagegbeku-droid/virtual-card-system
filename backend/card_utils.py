import random
from datetime import datetime

def calculate_luhn_checksum(digits_without_check: str) -> int:
    """Calculates the Luhn check digit for a given sequence of digits."""
    digits = [int(d) for d in digits_without_check]
    total = 0
    # Double every second digit from the right
    reversed_digits = digits[::-1]
    for i, digit in enumerate(reversed_digits):
        if i % 2 == 0:
            doubled = digit * 2
            total += doubled if doubled < 10 else doubled - 9
        else:
            total += digit
    return (10 - (total % 10)) % 10

def generate_visa_card_number(bin_prefix: str = "424298") -> str:
    """Generates a valid 16-digit Visa card number adhering to Luhn algorithm."""
    # 6-digit BIN + 9 random digits = 15 digits
    middle_digits = "".join([str(random.randint(0, 9)) for _ in range(9)])
    first_15 = f"{bin_prefix}{middle_digits}"
    check_digit = calculate_luhn_checksum(first_15)
    return f"{first_15}{check_digit}"

def format_card_number(pan: str) -> str:
    """Formats 16 digits into '4242 9812 3456 7890'."""
    clean = pan.replace(" ", "")
    return " ".join([clean[i:i+4] for i in range(0, len(clean), 4)])

def mask_card_number(pan: str) -> str:
    """Masks card number into '4242 •••• •••• 7890'."""
    clean = pan.replace(" ", "")
    if len(clean) >= 16:
        return f"{clean[:4]} •••• •••• {clean[-4:]}"
    return pan

def generate_cvv() -> str:
    """Generates a 3-digit CVV."""
    return f"{random.randint(100, 999)}"

def generate_expiry(years_ahead: int = 3):
    """Generates expiration month and year."""
    now = datetime.utcnow()
    month = random.choice([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    year = (now.year + years_ahead) % 100
    return month, year
