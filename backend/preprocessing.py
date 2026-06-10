import re
import string
from functools import lru_cache

from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

try:
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    _HAS_NLTK = True
except Exception:
    _HAS_NLTK = False


FALLBACK_STOPWORDS = set(ENGLISH_STOP_WORDS)


@lru_cache(maxsize=1)
def _get_stopwords() -> set[str]:
    if _HAS_NLTK:
        try:
            return set(stopwords.words("english"))
        except LookupError:
            pass
    return FALLBACK_STOPWORDS


def _tokenize(text: str) -> list[str]:
    if _HAS_NLTK:
        try:
            return word_tokenize(text)
        except LookupError:
            pass
    return re.findall(r"[a-z]+", text)


def preprocess_text(text: str) -> str:
    """Apply training-aligned preprocessing to match the fine-tuned model."""
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'\d+', '', text)
    text = text.strip()

    stop_words = _get_stopwords()
    tokens = _tokenize(text)
    filtered_tokens = [word for word in tokens if word not in stop_words]

    cleaned = " ".join(filtered_tokens)
    return re.sub(r'\s+', ' ', cleaned).strip()
