import uvicorn
from app.config import settings

if __name__ == "__main__":
    print(f"Starting server at http://{settings.HOST}:{settings.PORT} with 4 workers")
    uvicorn.run(
        "app.main:app", 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=False,
        workers=4,
        log_level="info"
    )