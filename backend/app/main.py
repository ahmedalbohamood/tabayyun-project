from fastapi import FastAPI

from app.routers.ai import router as ai_router
from app.routers.health import router as health_router
from app.routers import chatbot

app = FastAPI(
    title="Hackathon API"
)

app.include_router(health_router)
app.include_router(ai_router)
app.include_router(chatbot.router)


@app.get("/")
def root():
    return {
        "message": "Hackathon API Running"
    }