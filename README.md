# 💳 Coratech Global — AfriVisa Virtual Card Platform

> **Production-grade Virtual Visa Card issuance and cross-border payment platform with direct African Mobile Money (MoMo) rails, powered by Neon Serverless PostgreSQL and FastAPI.**

---

## 🌟 Overview

**AfriVisa** empowers consumers, developers, and businesses in Africa to instantly generate secure, 3DS-ready virtual Visa cards denominated in USD. Users can top up their card balances directly from their Mobile Money accounts (**MTN MoMo**, **Telecel Cash**, **AT Money**) with transparent real-time FX rates, in-app security controls (instant freeze, spending limits, channel controls), and low fees.

---

## 🚀 Key Features

- **Instant Virtual Visa Card Issuance**: Generates 16-digit Luhn-compliant Visa cards with dynamic expiry, CVV, and PIN.
- **Flagship Cyber Neon 3D Card Experience**: Interactive 3D card tilt, 180° front/back flipping (chip, magnetic stripe, CVV, security hologram), 1-click PAN copy, and details reveal.
- **Direct Mobile Money Top-Up**: Integrated with **Paystack Ghana** (MTN MoMo, Telecel Cash, AT Money) with real-time GHS-to-USD conversion and HMAC-SHA512 webhook signature verification.
- **Card-as-a-Service (BaaS) Ready**: Pluggable adapter architecture ready for **Bridgecard** or **Flutterwave Card Issuing API**.
- **Bank of Ghana Compliance / KYC**: Built-in Ghana Card (`GHA-XXXXXXXXX-X`) verification before issuing payment cards.
- **Card Controls & Security Center**: 1-click card freeze/unfreeze, daily and per-transaction limits, e-commerce and international channel toggles.
- **Audit & Transaction Ledger**: Searchable real-time transaction ledger with receipt generation.
- **Cloud Database**: Native integration with **Neon Serverless PostgreSQL** (`neon.tech`) with auto-reconnect and pooling.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Canvas Confetti.
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy ORM, Pydantic v2, Uvicorn ASGI.
- **Database**: Neon Serverless PostgreSQL (`neon.tech`) / SQLite (local fallback).
- **Security**: JWT tokens, Bcrypt password hashing, HMAC-SHA512 webhook signatures.
- **Payments**: Paystack Ghana Mobile Money.

---

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Open `backend/.env` and configure your **Neon Database URL**:
```env
DATABASE_URL=postgresql://coratech_owner:your_password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Start the backend server:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

Run backend integration tests:
```bash
cd backend
pytest -v test_backend.py
```

---

## 📄 License
© 2026 Coratech Global. All Rights Reserved.
