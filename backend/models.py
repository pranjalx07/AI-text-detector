import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime
from database import Base


class Detection(Base):
    __tablename__ = "detections"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    raw_text = Column(Text, nullable=False)
    preprocessed_text = Column(Text, nullable=True)
    label = Column(String, nullable=False)
    ai_prob = Column(Float, nullable=False)
    human_prob = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    perplexity = Column(Float, nullable=True)
    inference_time_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    feedback_correct = Column(Boolean, nullable=True)
    feedback_comment = Column(String, nullable=True)
