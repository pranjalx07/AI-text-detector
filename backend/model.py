import os
import math
import numpy as np
import torch
from transformers import pipeline, GPT2LMHeadModel, GPT2TokenizerFast
from lime.lime_text import LimeTextExplainer

MODEL_PATH = os.getenv("MODEL_PATH", "./bert-base-uncased_80_20_0.05wd_2lr_3epoch")
MODEL_MAX_LENGTH = int(os.getenv("MODEL_MAX_LENGTH", "350"))


def _read_calibration_temperature() -> float:
    raw_value = os.getenv("CALIBRATION_TEMPERATURE", "1.6")
    try:
        parsed = float(raw_value)
    except ValueError:
        return 1.6
    return parsed if parsed > 0 else 1.0


CALIBRATION_TEMPERATURE = _read_calibration_temperature()

# Load from local saved_model/ directory if it exists, otherwise fall back to HuggingFace
classifier = pipeline("text-classification", model=MODEL_PATH, tokenizer=MODEL_PATH)

# GPT-2 for perplexity calculation
_ppl_model_id = "gpt2"
_ppl_tokenizer = GPT2TokenizerFast.from_pretrained(_ppl_model_id)
_ppl_model = GPT2LMHeadModel.from_pretrained(_ppl_model_id)
_ppl_model.eval()

# LIME explainer (class 0 = Human, class 1 = AI)
explainer = LimeTextExplainer(class_names=["Human-Written", "AI-Generated"])


def _label_to_id_map() -> dict[str, int]:
    mapping = getattr(classifier.model.config, "label2id", None) or {}
    normalized: dict[str, int] = {}
    for label, index in mapping.items():
        try:
            normalized[str(label)] = int(index)
        except (TypeError, ValueError):
            continue
    return normalized


LABEL_TO_ID = _label_to_id_map()


def _temperature_scale_binary_probs(human_prob: float, ai_prob: float) -> tuple[float, float]:
    if abs(CALIBRATION_TEMPERATURE - 1.0) < 1e-9:
        return human_prob, ai_prob

    eps = 1e-12
    probs = np.clip(np.array([human_prob, ai_prob], dtype=np.float64), eps, 1.0 - eps)
    scaled_logits = np.log(probs) / CALIBRATION_TEMPERATURE
    scaled_logits -= np.max(scaled_logits)
    scaled_probs = np.exp(scaled_logits)
    scaled_probs /= np.sum(scaled_probs)

    return float(scaled_probs[0]), float(scaled_probs[1])


def _scores_to_probs(scores: list[dict]) -> tuple[float, float]:
    human_prob = None
    ai_prob = None

    for item in scores:
        label = str(item["label"])
        score = float(item["score"])
        label_upper = label.upper()

        if label_upper in {"REAL", "HUMAN", "HUMAN-WRITTEN", "LABEL_0"}:
            human_prob = score
            continue
        if label_upper in {"FAKE", "AI", "AI-GENERATED", "LABEL_1"}:
            ai_prob = score
            continue

        mapped_index = LABEL_TO_ID.get(label)
        if mapped_index == 0:
            human_prob = score
        elif mapped_index == 1:
            ai_prob = score

    if human_prob is None or ai_prob is None:
        raise ValueError("Unable to map model output labels to human/AI probabilities.")

    human_prob, ai_prob = _temperature_scale_binary_probs(human_prob, ai_prob)
    return human_prob, ai_prob


def _predict_proba(texts: list[str]) -> np.ndarray:
    """Return (n_samples, 2) array of [human_prob, ai_prob] for LIME."""
    results = classifier(list(texts), top_k=None, truncation=True, max_length=MODEL_MAX_LENGTH)
    if results and isinstance(results, list) and results and isinstance(results[0], dict):
        results = [results]

    probs = []
    for scores in results:
        human, ai = _scores_to_probs(scores)
        probs.append([human, ai])
    return np.array(probs)


def predict_text(text: str) -> dict:
    raw_scores = classifier(text, top_k=None, truncation=True, max_length=MODEL_MAX_LENGTH)
    if isinstance(raw_scores, list) and raw_scores and isinstance(raw_scores[0], list):
        scores = raw_scores[0]
    else:
        scores = raw_scores

    human_prob, ai_prob = _scores_to_probs(scores)
    confidence = max(human_prob, ai_prob)
    label = "Human-Written" if human_prob >= ai_prob else "AI-Generated"
    return {
        "label": label,
        "confidence": round(confidence, 6),
        "human_prob": round(human_prob, 6),
        "ai_prob": round(ai_prob, 6),
    }


def compute_perplexity(text: str) -> float:
    """Compute perplexity of text using GPT-2. Lower = more predictable (likely AI)."""
    encodings = _ppl_tokenizer(text, return_tensors="pt", truncation=True, max_length=1024)
    input_ids = encodings.input_ids
    with torch.no_grad():
        outputs = _ppl_model(input_ids, labels=input_ids)
        neg_log_likelihood = outputs.loss
    return round(math.exp(neg_log_likelihood.item()), 2)


def explain_text(text: str, num_features: int = 10, num_samples: int = 200) -> list[dict]:
    """Run LIME explanation and return top feature words with weights."""
    exp = explainer.explain_instance(
        text,
        _predict_proba,
        num_features=num_features,
        num_samples=num_samples,
    )
    # exp.as_list() returns [(word, weight), ...] where positive = class 1 (AI)
    return [{"word": word, "weight": round(weight, 6)} for word, weight in exp.as_list()]