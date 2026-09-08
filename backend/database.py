import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# Load environment variables from .env file
load_dotenv()

# Neon PostgreSQL connection string or SQLite fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./virtual_cards.db")

# SQLAlchemy requires 'postgresql://' instead of legacy 'postgres://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = "sqlite" in DATABASE_URL

engine_kwargs = {}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Neon Serverless Postgres settings: auto-recycle connections & pre-ping
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
