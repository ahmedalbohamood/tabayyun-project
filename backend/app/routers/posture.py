import os
import shutil
from fastapi import APIRouter, UploadFile, File

from app.services.posture_service import check_posture

router = APIRouter(
    prefix="/api",
    tags=["Posture"]
)


@router.post("/check-posture")
async def check_posture_endpoint(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    posture, offset = check_posture(temp_path)
    os.remove(temp_path)
    return {"posture": posture, "offset": offset}
