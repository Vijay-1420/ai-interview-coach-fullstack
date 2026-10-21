import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from database.db import engine
from database.models import Base
from routes.chat import router as chat_router
from routes.interview import router

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Interview Coach API",
    description="Backend for AI-powered interview practice platform",
    version="2.0.0"
)

# CORS — allow Vite dev server and localhost
default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", ",".join(default_origins)).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include interview router
app.include_router(router, prefix="/api")
app.include_router(chat_router, prefix="/api")


@app.get("/")
def home():
    return {"message": "AI Interview Coach Backend Running 🚀", "version": "2.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
