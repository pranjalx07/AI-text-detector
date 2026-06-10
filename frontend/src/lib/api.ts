const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface DetectResult {
  id: string;
  label: "AI-Generated" | "Human-Written";
  confidence: number;
  human_prob: number;
  ai_prob: number;
  perplexity: number;
  word_count: number;
  inference_time_ms: number;
  timestamp: string;
  preprocessed_text?: string;
}

export interface LimeFeature {
  word: string;
  weight: number;
}

export interface ExplainResult {
  features: LimeFeature[];
}

export interface HistoryItem {
  id: string;
  raw_text: string;
  label: string;
  confidence: number;
  ai_prob: number;
  human_prob: number;
  inference_time_ms: number;
  created_at: string;
  feedback_correct: boolean | null;
  feedback_comment: string | null;
  preprocessed_text: string | null;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface StatsData {
  total: number;
  ai_count: number;
  human_count: number;
  avg_confidence: number;
  daily: { date: string; count: number }[];
}

export async function detectText(
  text: string,
  applyPreprocessing: boolean
): Promise<DetectResult> {
  const res = await fetch(`${API_URL}/api/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, apply_preprocessing: applyPreprocessing }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Server error" }));
    throw new Error(err.detail || "Server error");
  }
  return res.json();
}

export async function getHistory(params: {
  page?: number;
  per_page?: number;
  label?: string;
  search?: string;
  sort?: string;
}): Promise<HistoryResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.label) qs.set("label", params.label);
  if (params.search) qs.set("search", params.search);
  if (params.sort) qs.set("sort", params.sort);
  const res = await fetch(`${API_URL}/api/history?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function submitFeedback(
  detectionId: string,
  correct: boolean,
  comment?: string
) {
  const res = await fetch(`${API_URL}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      detection_id: detectionId,
      correct,
      comment: comment || null,
    }),
  });
  if (!res.ok) throw new Error("Failed to submit feedback");
  return res.json();
}

export async function getStats(): Promise<StatsData> {
  const res = await fetch(`${API_URL}/api/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function getAdminFeedback() {
  const res = await fetch(`${API_URL}/api/admin/feedback`);
  if (!res.ok) throw new Error("Failed to fetch feedback");
  return res.json();
}

export async function deleteSubmission(id: string) {
  const res = await fetch(`${API_URL}/api/admin/submissions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}

export async function explainText(
  text: string,
  applyPreprocessing: boolean
): Promise<ExplainResult> {
  const res = await fetch(`${API_URL}/api/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, apply_preprocessing: applyPreprocessing }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Server error" }));
    throw new Error(err.detail || "Server error");
  }
  return res.json();
}
