import uuid
import time
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc

from database import engine, get_db, Base
from models import Detection
from model import predict_text, explain_text, compute_perplexity
from preprocessing import preprocess_text

# Create tables
Base.metadata.create_all(bind=engine)

MIN_WORDS = int(os.getenv("MIN_WORDS", "80"))

DEFAULT_CORS_ORIGINS = (
    "http://localhost:3000,"
    "http://127.0.0.1:3000,"
    "http://localhost:3001,"
    "http://127.0.0.1:3001"
)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]
# Allow localhost and loopback on any port during development.
CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX", r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")

app = FastAPI(title="VeritAI API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────────────

class DetectRequest(BaseModel):
    text: str
    apply_preprocessing: bool = True


class FeedbackRequest(BaseModel):
    detection_id: str
    correct: bool
    comment: Optional[str] = None


class DetectResponse(BaseModel):
    id: str
    label: str
    confidence: float
    human_prob: float
    ai_prob: float
    perplexity: float
    word_count: int
    inference_time_ms: int
    timestamp: str
    preprocessed_text: Optional[str] = None


class ExplainRequest(BaseModel):
    text: str
    apply_preprocessing: bool = True
    num_features: int = Field(10, ge=1, le=30)
    num_samples: int = Field(200, ge=50, le=1000)


class LimeFeature(BaseModel):
    word: str
    weight: float


class ExplainResponse(BaseModel):
    features: list[LimeFeature]


class HistoryItem(BaseModel):
    id: str
    raw_text: str
    label: str
    confidence: float
    ai_prob: float
    human_prob: float
    inference_time_ms: int
    created_at: str
    feedback_correct: Optional[bool] = None
    feedback_comment: Optional[str] = None
    preprocessed_text: Optional[str] = None


def _to_utc_z(dt: Optional[datetime]) -> str:
    if not dt:
        return ""
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/api/detect", response_model=DetectResponse)
def detect(req: DetectRequest, db: Session = Depends(get_db)):
    word_count = len(req.text.split())
    if word_count < MIN_WORDS:
        raise HTTPException(
            status_code=400,
            detail=f"Text too short. Minimum {MIN_WORDS} words required for this model.",
        )

    preprocessed = None
    text_to_analyze = req.text
    if req.apply_preprocessing:
        preprocessed = preprocess_text(req.text)
        text_to_analyze = preprocessed

    start = time.time()
    result = predict_text(text_to_analyze)
    perplexity = compute_perplexity(text_to_analyze)
    elapsed_ms = int((time.time() - start) * 1000)

    label = result["label"]
    human_prob = result["human_prob"]
    ai_prob = result["ai_prob"]
    confidence = result["confidence"]
    now = datetime.now(timezone.utc)

    detection = Detection(
        id=str(uuid.uuid4()),
        raw_text=req.text,
        preprocessed_text=preprocessed,
        label=label,
        ai_prob=ai_prob,
        human_prob=human_prob,
        confidence=confidence,
        perplexity=perplexity,
        inference_time_ms=elapsed_ms,
        created_at=now,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)

    return DetectResponse(
        id=detection.id,
        label=label,
        confidence=confidence,
        human_prob=human_prob,
        ai_prob=ai_prob,
        perplexity=perplexity,
        word_count=word_count,
        inference_time_ms=elapsed_ms,
        timestamp=_to_utc_z(now),
        preprocessed_text=preprocessed,
    )


@app.post("/api/explain", response_model=ExplainResponse)
def explain(req: ExplainRequest):
    word_count = len(req.text.split())
    if word_count < MIN_WORDS:
        raise HTTPException(
            status_code=400,
            detail=f"Text too short. Minimum {MIN_WORDS} words required for this model.",
        )

    text_to_analyze = req.text
    if req.apply_preprocessing:
        text_to_analyze = preprocess_text(req.text)

    features = explain_text(text_to_analyze, num_features=req.num_features, num_samples=req.num_samples)
    return ExplainResponse(features=[LimeFeature(**f) for f in features])


@app.get("/api/history")
def get_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    label: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = Query("latest", pattern="^(latest|oldest)$"),
    db: Session = Depends(get_db),
):
    query = db.query(Detection)

    if label and label != "All":
        query = query.filter(Detection.label == label)
    if search:
        query = query.filter(Detection.raw_text.contains(search))

    total = query.count()

    if sort == "latest":
        query = query.order_by(desc(Detection.created_at))
    else:
        query = query.order_by(asc(Detection.created_at))

    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [
            {
                "id": d.id,
                "raw_text": d.raw_text,
                "label": d.label,
                "confidence": d.confidence,
                "ai_prob": d.ai_prob,
                "human_prob": d.human_prob,
                "inference_time_ms": d.inference_time_ms,
                "created_at": _to_utc_z(d.created_at),
                "feedback_correct": d.feedback_correct,
                "feedback_comment": d.feedback_comment,
                "preprocessed_text": d.preprocessed_text,
            }
            for d in items
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


@app.get("/api/history/{detection_id}")
def get_detection(detection_id: str, db: Session = Depends(get_db)):
    d = db.query(Detection).filter(Detection.id == detection_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Detection not found")
    return {
        "id": d.id,
        "raw_text": d.raw_text,
        "label": d.label,
        "confidence": d.confidence,
        "ai_prob": d.ai_prob,
        "human_prob": d.human_prob,
        "inference_time_ms": d.inference_time_ms,
        "created_at": _to_utc_z(d.created_at),
        "feedback_correct": d.feedback_correct,
        "feedback_comment": d.feedback_comment,
        "preprocessed_text": d.preprocessed_text,
    }


@app.post("/api/feedback")
def submit_feedback(req: FeedbackRequest, db: Session = Depends(get_db)):
    d = db.query(Detection).filter(Detection.id == req.detection_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Detection not found")
    d.feedback_correct = req.correct
    d.feedback_comment = req.comment
    db.commit()
    return {"status": "ok"}


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Detection.id)).scalar() or 0
    ai_count = db.query(func.count(Detection.id)).filter(Detection.label == "AI-Generated").scalar() or 0
    human_count = db.query(func.count(Detection.id)).filter(Detection.label == "Human-Written").scalar() or 0
    avg_confidence = db.query(func.avg(Detection.confidence)).scalar() or 0

    # Submissions per day (last 14 days)
    recent = (
        db.query(
            func.date(Detection.created_at).label("date"),
            func.count(Detection.id).label("count"),
        )
        .group_by(func.date(Detection.created_at))
        .order_by(desc(func.date(Detection.created_at)))
        .limit(14)
        .all()
    )

    return {
        "total": total,
        "ai_count": ai_count,
        "human_count": human_count,
        "avg_confidence": round(float(avg_confidence), 4),
        "daily": [{"date": str(r.date), "count": r.count} for r in recent],
    }


@app.delete("/api/admin/submissions/{detection_id}")
def delete_submission(detection_id: str, db: Session = Depends(get_db)):
    d = db.query(Detection).filter(Detection.id == detection_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Detection not found")
    db.delete(d)
    db.commit()
    return {"status": "deleted"}


@app.get("/api/admin/feedback")
def admin_feedback(db: Session = Depends(get_db)):
    items = db.query(Detection).filter(Detection.feedback_correct.isnot(None)).order_by(desc(Detection.created_at)).all()
    return [
        {
            "id": d.id,
            "raw_text": d.raw_text[:200],
            "label": d.label,
            "feedback_correct": d.feedback_correct,
            "feedback_comment": d.feedback_comment,
            "created_at": _to_utc_z(d.created_at),
        }
        for d in items
    ]