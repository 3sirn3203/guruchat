"""Main application file for the Chat Session API using FastAPI"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from .routers import sessions, chat, characters


models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Chat Session API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(characters.router)


# GET /health
@app.get("/health")
def health_check():
    return {"status": "healthy"}