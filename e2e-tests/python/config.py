import os
import json
import base64
import time
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# Tự động nạp file .env từ thư mục tests/e2e dù chạy pytest từ bất kỳ thư mục nào
ENV_FILE = BASE_DIR / ".env"
if ENV_FILE.exists():
    load_dotenv(ENV_FILE, override=True)
else:
    load_dotenv()

# ==============================================================================
# E2E TEST CONFIGURATION - DOCUMENT SERVICE INTEGRATION
# ==============================================================================

# Frontend application URL
BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:5173").strip()

# Document Service Backend URL
API_BASE_URL = os.getenv("E2E_API_URL", "http://localhost:8082").strip()

# JWT Access Token for authenticating requests
ACCESS_TOKEN = os.getenv("E2E_ACCESS_TOKEN", "").strip()

# Helper giải mã JWT payload an toàn
def decode_jwt_payload(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1]
            payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
            return json.loads(base64.urlsafe_b64decode(payload_b64.decode("utf-8") if isinstance(payload_b64, bytes) else payload_b64).decode("utf-8"))
    except Exception:
        pass
    return {}

token_data = decode_jwt_payload(ACCESS_TOKEN) if ACCESS_TOKEN else {}

# Current User profile payload stored in localStorage['currentUser']
DEFAULT_USER = {
    "id": os.getenv("E2E_USER_ID", token_data.get("userId", "u_test_user_001")),
    "email": os.getenv("E2E_USER_EMAIL", token_data.get("email", "test.user@academic.edu.vn")),
    "username": os.getenv("E2E_USERNAME", token_data.get("sub", "testuser")),
    "fullName": os.getenv("E2E_USER_FULLNAME", token_data.get("fullName", token_data.get("sub", "Người dùng thử nghiệm"))),
    "role": os.getenv("E2E_USER_ROLE", token_data.get("role", "USER")),
    "avatarUrl": "",
    "avatarText": (token_data.get("sub", "ND")[:2]).upper(),
    "major": "Khoa học Máy tính",
    "uploadPointsBalance": 50,
    "reputationPoints": 100,
    "isVerified": True
}

CURRENT_USER_JSON = os.getenv("E2E_CURRENT_USER_JSON", json.dumps(DEFAULT_USER))

# Browser Options
HEADLESS = os.getenv("E2E_HEADLESS", "false").lower() in ("true", "1", "yes")
DEFAULT_TIMEOUT = int(os.getenv("E2E_TIMEOUT", "15"))

# Paths
TEST_DATA_DIR = BASE_DIR / "test_data"
SCREENSHOTS_DIR = BASE_DIR / "screenshots"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

if __name__ == "__main__":
    print("=" * 70)
    print("KIỂM TRA CẤU HÌNH .ENV CHO BỘ TEST E2E")
    print("=" * 70)
    print(f"File .env tồn tại    : {'CÓ' if ENV_FILE.exists() else 'KHÔNG'} ({ENV_FILE})")
    print(f"E2E_BASE_URL         : {BASE_URL}")
    print(f"E2E_API_URL          : {API_BASE_URL}")
    print(f"Chế độ Headless      : {HEADLESS}")

    if ACCESS_TOKEN:
        print(f"Access Token         : ĐÃ NẠP THÀNH CÔNG ({ACCESS_TOKEN[:15]}...{ACCESS_TOKEN[-10:]})")
        if token_data:
            exp_time = token_data.get("exp", 0)
            now = time.time()
            is_expired = now > exp_time if exp_time else False
            exp_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(exp_time)) if exp_time else "Không có"
            print(f" - UserId            : {token_data.get('userId')}")
            print(f" - Email             : {token_data.get('email')}")
            print(f" - Username (sub)    : {token_data.get('sub')}")
            print(f" - Quyền hạn (role)  : {token_data.get('role')}")
            print(f" - Thời hạn (exp)    : {exp_str} ({'HẾT HẠN' if is_expired else 'CÒN HIỆU LỰC'})")
    else:
        print("Access Token         : CHƯA CÓ (Hãy điền vào E2E_ACCESS_TOKEN)")
    print("=" * 70)
