from urllib.parse import quote, unquote
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings


def sanitize_database_url(raw_url: str) -> str:
    """
    Chuẩn hóa DATABASE_URL cho SQLAlchemy + psycopg3:
    1. Chuyển 'postgres://' hoặc 'postgresql://' sang 'postgresql+psycopg://'
    2. Tự động mã hóa URL (percent-encode) mật khẩu chứa ký tự đặc biệt như '@'
       (ví dụ 'postgresql://root:Pass@123@postgres-db:5432/ai_service_db' -> tách theo dấu '@' cuối cùng).
    """
    if not raw_url:
        return raw_url

    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]

    if "://" not in url:
        return url

    scheme, rest = url.split("://", 1)
    if "/" in rest:
        authority, path_part = rest.split("/", 1)
        suffix = "/" + path_part
    else:
        authority, suffix = rest, ""

    if "@" in authority:
        # Host:port không bao giờ chứa '@', nên dấu '@' cuối cùng luôn là ranh giới userinfo và hostport
        userinfo, hostport = authority.rsplit("@", 1)
        if ":" in userinfo:
            username, password = userinfo.split(":", 1)
            safe_user = quote(unquote(username), safe="")
            safe_pass = quote(unquote(password), safe="")
            return f"{scheme}://{safe_user}:{safe_pass}@{hostport}{suffix}"

    return url


DATABASE_URL = sanitize_database_url(settings.DATABASE_URL)

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
