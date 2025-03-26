import uvicorn
from app.config import settings
from app.report.report import *

if __name__ == "__main__":
    print(f"Starting server at http://{settings.HOST}:{settings.PORT}")
    report_test1()
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)