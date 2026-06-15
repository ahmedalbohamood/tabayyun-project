import os
import shutil
from typing import Optional
from fastapi import APIRouter, Form, UploadFile, File

from app.services.corruption_service import analyze_report, extract_file_content

router = APIRouter(
    prefix="/api",
    tags=["Corruption"]
)


@router.post("/analyze-report")
async def analyze(
    report_text: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    if file:
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        file_content = extract_file_content(temp_path)
        os.remove(temp_path)
    else:
        file_content = "لم يتم إرفاق أي مستند داعم مع هذا البلاغ."

    result = analyze_report(report_text, file_content)
    return result
