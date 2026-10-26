# Re-export app for uvicorn running from root: uvicorn main:app --reload --port 8000
from app.main import app

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
