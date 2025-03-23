from fastapi import FastAPI
from app.config import settings

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Server is running"}
