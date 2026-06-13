from fastapi import FastAPI

from routers.ai import router as ai_router
from routers.health import router as health_router

app = FastAPI(
    title="Hackathon API"
)

app.include_router(health_router)
app.include_router(ai_router)


@app.get("/")
def root():
    return {
        "message": "Hackathon API Running"
    }