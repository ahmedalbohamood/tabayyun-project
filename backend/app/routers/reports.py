import json
import os
import shutil
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Report
from app.schemas.report_models import ReportResponse

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def to_json_text(value):
    return json.dumps(value, ensure_ascii=False)


def from_json_text(value):
    if not value:
        return []
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return []


def build_report_number(report_id: int) -> str:
    return f"BYN-2026-{report_id:04d}"


def mock_ai_analysis(description: str, user_selected_category: Optional[str]):
    text = description.lower()

    score = 25
    reasons = []
    missing = []

    if any(word in text for word in ["تاريخ", "2026", "2025", "مايو", "مارس"]):
        score += 15
        reasons.append("يحتوي على تاريخ أو مؤشر زمني")

    if any(word in text for word in ["ريال", "مبلغ", "مليون", "ألف"]):
        score += 20
        reasons.append("يحتوي على مبلغ مالي")

    if any(word in text for word in ["عقد", "معاملة", "فاتورة", "إيصال"]):
        score += 20
        reasons.append("يحتوي على رقم أو مستند قابل للتحقق")

    if any(word in text for word in ["وزارة", "أمانة", "إدارة", "بلدية", "جامعة"]):
        score += 15
        reasons.append("يحتوي على جهة محددة")

    if not reasons:
        missing.extend(["لا توجد تفاصيل كافية", "لا توجد أدلة واضحة", "لا توجد جهة محددة"])

    score = min(score, 100)

    if score >= 70 and user_selected_category:
        priority = "عالية"
        status = "يتطلب إجراء عاجل"
    elif score >= 40:
        priority = "متوسطة"
        status = "قيد المراجعة"
    else:
        priority = "منخفضة"
        status = "معالجة روتينية"

    return {
        "ai_category": user_selected_category or "غير واضح",
        "readiness_score": score,
        "priority": priority,
        "status": status,
        "analysis_summary": "تم تحليل البلاغ واستخراج مؤشرات قابلة للتحقق بناءً على النص المدخل.",
        "readiness_reasoning": "، ".join(reasons) if reasons else "البلاغ عام ويحتاج إلى تفاصيل أكثر.",
        "system_recommendation": status,
        "extracted_evidence": reasons,
        "mentioned_entities": [],
        "mentioned_people": [],
        "important_dates": [],
        "financial_amounts": [],
        "contract_numbers": [],
        "priority_reasons": reasons,
        "missing_info": missing,
    }


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

    if attachment:
        safe_filename = attachment.filename.replace(" ", "_")
        attachment_path = os.path.join(UPLOAD_DIR, safe_filename)

        with open(attachment_path, "wb") as buffer:
            shutil.copyfileobj(attachment.file, buffer)

    ai_result = mock_ai_analysis(
        description=description,
        user_selected_category=user_selected_category
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

        ai_category=ai_result["ai_category"],
        readiness_score=ai_result["readiness_score"],
        priority=ai_result["priority"],
        status=ai_result["status"],
        analysis_summary=ai_result["analysis_summary"],
        readiness_reasoning=ai_result["readiness_reasoning"],
        system_recommendation=ai_result["system_recommendation"],

        extracted_evidence=to_json_text(ai_result["extracted_evidence"]),
        mentioned_entities=to_json_text(ai_result["mentioned_entities"]),
        mentioned_people=to_json_text(ai_result["mentioned_people"]),
        important_dates=to_json_text(ai_result["important_dates"]),
        financial_amounts=to_json_text(ai_result["financial_amounts"]),
        contract_numbers=to_json_text(ai_result["contract_numbers"]),
        priority_reasons=to_json_text(ai_result["priority_reasons"]),
        missing_info=to_json_text(ai_result["missing_info"]),
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