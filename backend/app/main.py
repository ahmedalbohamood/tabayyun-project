from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers.health import router as health_router
from app.routers.reports import router as reports_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tabayyun API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(reports_router)


@app.get("/")
def root():
    return {
        "message": "Tabayyun API Running"
    }