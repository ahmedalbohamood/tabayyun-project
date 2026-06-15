from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    # Citizen Information
    full_name = Column(String, nullable=True)
    national_id = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    is_anonymous = Column(Boolean, default=False)

    # Report Information
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    user_selected_category = Column(String, nullable=True)

    # Incident Information
    government_entity = Column(String, nullable=True)
    city = Column(String, nullable=True)
    incident_date = Column(String, nullable=True)

    # Attachment
    attachment_path = Column(String, nullable=True)

    # AI Results
    ai_category = Column(String, nullable=True)
    readiness_score = Column(Integer, default=0)
    priority = Column(String, nullable=True)
    status = Column(String, nullable=True)

    analysis_summary = Column(Text, nullable=True)
    readiness_reasoning = Column(Text, nullable=True)
    system_recommendation = Column(Text, nullable=True)

    # NEW FIELDS
    legal_basis = Column(Text, nullable=True)
    document_assessment = Column(Text, nullable=True)

    # Extracted Data
    extracted_evidence = Column(Text, nullable=True)
    mentioned_entities = Column(Text, nullable=True)
    mentioned_people = Column(Text, nullable=True)
    important_dates = Column(Text, nullable=True)
    financial_amounts = Column(Text, nullable=True)
    contract_numbers = Column(Text, nullable=True)
    priority_reasons = Column(Text, nullable=True)
    missing_info = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)