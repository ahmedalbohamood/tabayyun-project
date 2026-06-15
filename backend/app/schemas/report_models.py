from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReportCreate(BaseModel):
    full_name: Optional[str] = None
    national_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_anonymous: bool = False

    title: str
    description: str
    user_selected_category: Optional[str] = None

    government_entity: Optional[str] = None
    city: Optional[str] = None
    incident_date: Optional[str] = None


class ReportResponse(BaseModel):
    id: int
    report_number: str

    title: str
    description: str

    full_name: Optional[str] = None
    national_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_anonymous: bool

    user_selected_category: Optional[str] = None
    ai_category: Optional[str] = None

    government_entity: Optional[str] = None
    city: Optional[str] = None
    incident_date: Optional[str] = None

    attachment_path: Optional[str] = None

    readiness_score: int
    priority: Optional[str] = None
    status: Optional[str] = None

    analysis_summary: Optional[str] = None
    readiness_reasoning: Optional[str] = None
    system_recommendation: Optional[str] = None

    # NEW
    legal_basis: Optional[str] = None
    document_assessment: Optional[str] = None

    extracted_evidence: list[str] = []
    mentioned_entities: list[str] = []
    mentioned_people: list[str] = []
    important_dates: list[str] = []
    financial_amounts: list[str] = []
    contract_numbers: list[str] = []
    priority_reasons: list[str] = []
    missing_info: list[str] = []

    created_at: datetime