import json
import os
import shutil
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Report
from app.schemas.report_models import ReportResponse
from app.services.corruption_service import analyze_report, extract_file_content

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def to_json_text(value):
    return json.dumps(value or [], ensure_ascii=False)


def from_json_text(value):
    if not value:
        return []

    try:
        data = json.loads(value)

        if isinstance(data, list):
            return [
                item if isinstance(item, str)
                else json.dumps(item, ensure_ascii=False)
                for item in data
            ]

        return [str(data)]

    except json.JSONDecodeError:
        return []


def build_report_number(report_id: int) -> str:
    return f"BYN-2026-{report_id:04d}"


def safe_get(data: dict, key: str, default=None):
    return data.get(key, default)


@router.post("", response_model=ReportResponse)
async def create_report(
    full_name: Optional[str] = Form(None),
    national_id: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    is_anonymous: bool = Form(False),

    title: str = Form(...),
    description: str = Form(...),
    user_selected_category: Optional[str] = Form(None),

    government_entity: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    incident_date: Optional[str] = Form(None),

    attachment: Optional[UploadFile] = File(None),

    db: Session = Depends(get_db)
):
    attachment_path = None
    file_content = "لم يتم إرفاق أي مستند داعم مع هذا البلاغ."

    if attachment:
        safe_filename = attachment.filename.replace(" ", "_")
        attachment_path = os.path.join(UPLOAD_DIR, safe_filename)

        with open(attachment_path, "wb") as buffer:
            shutil.copyfileobj(attachment.file, buffer)

        file_content = extract_file_content(attachment_path)

    report_text_for_ai = f"""
عنوان البلاغ:
{title}

نوع الشبهة المختار من المستخدم:
{user_selected_category}

الجهة الحكومية:
{government_entity}

المدينة:
{city}

تاريخ الواقعة:
{incident_date}

وصف البلاغ:
{description}
"""

    ai_result = analyze_report(
        report_text=report_text_for_ai,
        file_content=file_content
    )

    report = Report(
        full_name=full_name,
        national_id=national_id,
        phone=phone,
        email=email,
        is_anonymous=is_anonymous,

        title=title,
        description=description,
        user_selected_category=user_selected_category,

        government_entity=government_entity,
        city=city,
        incident_date=incident_date,

        attachment_path=attachment_path,

        ai_category=safe_get(ai_result, "suspicion_type", "غير واضح"),
        readiness_score=safe_get(ai_result, "readiness_score", 0),
        priority=safe_get(ai_result, "priority", "منخفضة"),
        status=safe_get(ai_result, "system_recommendation", "معالجة روتينية"),

        analysis_summary=safe_get(ai_result, "analysis_summary", ""),
        readiness_reasoning=safe_get(ai_result, "readiness_reasoning", ""),
        system_recommendation=safe_get(ai_result, "system_recommendation", ""),

        legal_basis=safe_get(ai_result, "legal_basis", ""),
        document_assessment=safe_get(ai_result, "document_assessment", ""),

        extracted_evidence=to_json_text(safe_get(ai_result, "extracted_evidence", [])),
        mentioned_entities=to_json_text(safe_get(ai_result, "mentioned_entities", [])),
        mentioned_people=to_json_text(safe_get(ai_result, "mentioned_people", [])),
        important_dates=to_json_text(safe_get(ai_result, "important_dates", [])),
        financial_amounts=to_json_text(safe_get(ai_result, "financial_amounts", [])),
        contract_numbers=to_json_text(safe_get(ai_result, "contract_numbers", [])),
        priority_reasons=to_json_text(safe_get(ai_result, "priority_reasons", [])),
        missing_info=to_json_text(safe_get(ai_result, "missing_info", [])),
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return format_report_response(report)


@router.get("", response_model=list[ReportResponse])
def get_reports(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Report)

    if category:
        query = query.filter(Report.ai_category == category)

    reports = query.order_by(
        Report.readiness_score.desc(),
        Report.created_at.desc()
    ).all()

    return [format_report_response(report) for report in reports]


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return format_report_response(report)


def format_report_response(report: Report):
    return {
        "id": report.id,
        "report_number": build_report_number(report.id),

        "title": report.title,
        "description": report.description,

        "full_name": report.full_name,
        "national_id": report.national_id,
        "phone": report.phone,
        "email": report.email,
        "is_anonymous": report.is_anonymous,

        "user_selected_category": report.user_selected_category,
        "ai_category": report.ai_category,

        "government_entity": report.government_entity,
        "city": report.city,
        "incident_date": report.incident_date,

        "attachment_path": report.attachment_path,

        "readiness_score": report.readiness_score,
        "priority": report.priority,
        "status": report.status,

        "analysis_summary": report.analysis_summary,
        "readiness_reasoning": report.readiness_reasoning,
        "system_recommendation": report.system_recommendation,

        "legal_basis": report.legal_basis,
        "document_assessment": report.document_assessment,

        "extracted_evidence": from_json_text(report.extracted_evidence),
        "mentioned_entities": from_json_text(report.mentioned_entities),
        "mentioned_people": from_json_text(report.mentioned_people),
        "important_dates": from_json_text(report.important_dates),
        "financial_amounts": from_json_text(report.financial_amounts),
        "contract_numbers": from_json_text(report.contract_numbers),
        "priority_reasons": from_json_text(report.priority_reasons),
        "missing_info": from_json_text(report.missing_info),

        "created_at": report.created_at,
    }