from fastapi import FastAPI

from app.database import Base, engine
from app.routers.health import router as health_router
from app.routers.reports import router as reports_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Bayyinah API"
)

app.include_router(health_router)
app.include_router(reports_router)


@app.get("/")
def root():
    return {
        "message": "Bayyinah API Running"
    }