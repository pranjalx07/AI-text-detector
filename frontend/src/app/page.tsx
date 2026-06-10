"use client";

import { useMemo, useState } from "react";
import {
  detectText,
  submitFeedback,
  type DetectResult,
} from "@/lib/api";

const CIRCLE_CIRCUMFERENCE = 377;
const MIN_WORDS = 80;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DetectResult | null>(null);
  const [error, setError] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [text]);

  const aiPct = result ? Math.round(result.ai_prob * 100) : 0;
  const humanPct = result ? Math.round(result.human_prob * 100) : 0;
  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const uncertaintyPct = result ? Math.round((1 - result.confidence) * 100) : 0;
  const predictedIsAI = result?.label === "AI-Generated";
  const shownPct = result ? (predictedIsAI ? aiPct : humanPct) : progress;
  const shownLabel = result ? (predictedIsAI ? "AI Probability" : "Human Probability") : "Analyzing";
  const shownColor = result ? (predictedIsAI ? "var(--ai)" : "var(--human)") : "var(--teal)";
  const circleOffset = CIRCLE_CIRCUMFERENCE - (CIRCLE_CIRCUMFERENCE * shownPct) / 100;

  async function handleAnalyze() {
    setError("");
    setResult(null);
    setFeedbackGiven(false);
    setShowComment(false);
    setComment("");

    if (wordCount < MIN_WORDS) {
      setError(`Text too short. Minimum ${MIN_WORDS} words required for this model.`);
      return;
    }

    setLoading(true);
    setProgress(1);

    let detected: DetectResult | null = null;
    let detectionError = "";

    const detectionPromise = detectText(text, true)
      .then((res) => {
        detected = res;
      })
      .catch((e: unknown) => {
        detectionError = e instanceof Error ? e.message : "Server error";
      });

    for (let value = 1; value <= 100; value += 1) {
      setProgress(value);
      await sleep(20);
    }

    await detectionPromise;
    setLoading(false);

    if (detectionError) {
      setError(detectionError);
      return;
    }

    if (detected) {
      setResult(detected);
      return;
    }

    setError("Server error");
  }

  async function handleFeedback(correct: boolean) {
    if (!result || feedbackSubmitting) return;

    setFeedbackSubmitting(true);
    try {
      await submitFeedback(result.id, correct, correct ? undefined : comment);
      setFeedbackGiven(true);
      if (!correct) setShowComment(true);
    } catch {
      // silent
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  return (
    <div style={{ background: "var(--bg-primary)" }}>
      <section style={{ minHeight: "100vh", paddingTop: 92, paddingBottom: 80 }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 mb-8 px-4 py-2 text-sm font-semibold"
                style={{
                  background: "rgba(20,184,166,0.10)",
                  border: "1px solid rgba(20,184,166,0.30)",
                  borderRadius: 50,
                  color: "var(--teal)",
                  fontFamily: "var(--font-body)",
                }}
              >
                BERT - Fine-tuned on 63,464 samples
              </div>

              <h1
                className="font-extrabold leading-tight tracking-tight"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--text-primary)",
                  fontSize: "clamp(2.8rem,5vw,4rem)",
                  marginBottom: 24,
                  letterSpacing: "-1px",
                }}
              >
                Detect <span style={{ color: "var(--teal)" }}>AI-Generated</span> Text Instantly
              </h1>

              <p
                className="text-base leading-relaxed"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-secondary)",
                  maxWidth: 560,
                  marginBottom: 28,
                  lineHeight: 1.7,
                }}
              >
                Paste your text and our model will analyze its structure, phrasing,
                and linguistic patterns to produce a confidence-based verdict.
              </p>

              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "var(--bg-surface)",
                }}
              >
                <div className="flex items-center px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
                  </div>
                  <span
                    className="ml-auto text-xs font-semibold"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}
                  >
                    INPUT.TXT
                  </span>
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Paste text here. Minimum ${MIN_WORDS} words required.`}
                  className="w-full h-64 p-4 resize-none focus:outline-none"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "14px",
                    lineHeight: "1.7",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>
                  {wordCount} word{wordCount !== 1 ? "s" : ""}
                </span>
                {wordCount > 0 && wordCount < MIN_WORDS && (
                  <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--ai)" }}>
                    Minimum {MIN_WORDS} words required
                  </span>
                )}
              </div>

              {error && (
                <p className="mt-3 text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--ai)" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full mt-4 py-3 text-sm font-semibold"
                style={{
                  fontFamily: "var(--font-body)",
                  background: loading ? "var(--teal-dark)" : "var(--teal)",
                  color: "#fff",
                  borderRadius: 16,
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.01em",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Analyzing..." : "Analyze Text"}
              </button>
            </div>

            <div className="flex justify-center items-center mt-8 lg:mt-0">
              <div
                style={{
                  width: 300,
                  height: 620,
                  background: "var(--bg-surface)",
                  borderRadius: 50,
                  padding: 12,
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 50px 100px rgba(0,0,0,0.5)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 120,
                    height: 28,
                    background: "#0f172a",
                    borderRadius: "0 0 18px 18px",
                    zIndex: 10,
                  }}
                />

                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "var(--bg-dark)",
                    borderRadius: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      width: "100%",
                      height: "100%",
                      overflowY: "auto",
                      paddingTop: 18,
                    }}
                  >
                    <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
                      <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: "rotate(-90deg)" }}>
                        <circle
                          cx="75"
                          cy="75"
                          r="60"
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="75"
                          cy="75"
                          r="60"
                          fill="none"
                          stroke={shownColor}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={CIRCLE_CIRCUMFERENCE}
                          strokeDashoffset={circleOffset}
                          style={{ transition: "stroke-dashoffset 0.2s linear" }}
                        />
                      </svg>
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%,-50%)",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "2rem",
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-heading)",
                            lineHeight: 1,
                          }}
                        >
                          {shownPct}%
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.72rem",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                            marginTop: 6,
                            fontWeight: 600,
                          }}
                        >
                          {shownLabel}
                        </span>
                      </div>
                    </div>

                    {!result && !loading && (
                      <p
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          fontFamily: "var(--font-body)",
                          marginBottom: 16,
                        }}
                      >
                        Submit text to see the live detection result here.
                      </p>
                    )}

                    {loading && (
                      <p
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          fontFamily: "var(--font-body)",
                          marginBottom: 16,
                        }}
                      >
                        Running model inference and confidence scoring...
                      </p>
                    )}

                    {result && (
                      <>
                        <h4
                          style={{
                            fontSize: "1rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-heading)",
                            color: "var(--text-primary)",
                            marginBottom: 6,
                          }}
                        >
                          {result.label}
                        </h4>

                        <div
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            padding: 12,
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            marginBottom: 16,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span
                              style={{
                                fontSize: "0.74rem",
                                color: "var(--text-secondary)",
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              Perplexity
                            </span>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--text-primary)",
                                fontWeight: 700,
                                fontFamily: "var(--font-heading)",
                              }}
                            >
                              {result.perplexity.toFixed(2)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span
                              style={{
                                fontSize: "0.74rem",
                                color: "var(--text-secondary)",
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              Words
                            </span>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-primary)",
                                fontWeight: 700,
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              {result.word_count}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            padding: 12,
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-secondary)",
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              Human
                            </span>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--human)",
                                fontWeight: 700,
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              {humanPct}%
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-secondary)",
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              AI
                            </span>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--ai)",
                                fontWeight: 700,
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              {aiPct}%
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-secondary)",
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              Confidence
                            </span>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-primary)",
                                fontWeight: 700,
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              {confidencePct}%
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-secondary)",
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              Uncertainty
                            </span>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-muted)",
                                fontWeight: 700,
                                fontFamily: "var(--font-body)",
                              }}
                            >
                              {uncertaintyPct}%
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: "left",
                            background: "rgba(255,255,255,0.04)",
                            padding: 10,
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            marginTop: 12,
                          }}
                        >
                          {!feedbackGiven ? (
                            <>
                              <p
                                style={{
                                  fontSize: "0.74rem",
                                  color: "var(--text-secondary)",
                                  fontFamily: "var(--font-body)",
                                  marginBottom: 8,
                                }}
                              >
                                Was this result correct?
                              </p>

                              <div style={{ display: "flex", gap: 8, marginBottom: showComment ? 8 : 0 }}>
                                <button
                                  onClick={() => handleFeedback(true)}
                                  disabled={feedbackSubmitting}
                                  style={{
                                    flex: 1,
                                    border: "1px solid rgba(16,185,129,0.30)",
                                    background: "rgba(16,185,129,0.12)",
                                    color: "var(--human)",
                                    borderRadius: 8,
                                    padding: "6px 8px",
                                    fontSize: "0.72rem",
                                    fontFamily: "var(--font-body)",
                                    cursor: feedbackSubmitting ? "not-allowed" : "pointer",
                                    opacity: feedbackSubmitting ? 0.7 : 1,
                                  }}
                                >
                                  Correct
                                </button>
                                <button
                                  onClick={() => setShowComment(true)}
                                  disabled={feedbackSubmitting}
                                  style={{
                                    flex: 1,
                                    border: "1px solid rgba(239,68,68,0.30)",
                                    background: "rgba(239,68,68,0.12)",
                                    color: "var(--ai)",
                                    borderRadius: 8,
                                    padding: "6px 8px",
                                    fontSize: "0.72rem",
                                    fontFamily: "var(--font-body)",
                                    cursor: feedbackSubmitting ? "not-allowed" : "pointer",
                                    opacity: feedbackSubmitting ? 0.7 : 1,
                                  }}
                                >
                                  Incorrect
                                </button>
                              </div>

                              {showComment && (
                                <>
                                  <input
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Optional comment"
                                    style={{
                                      width: "100%",
                                      border: "1px solid var(--border)",
                                      background: "var(--bg-primary)",
                                      color: "var(--text-primary)",
                                      borderRadius: 8,
                                      padding: "6px 8px",
                                      fontSize: "0.72rem",
                                      fontFamily: "var(--font-body)",
                                      marginBottom: 8,
                                    }}
                                  />
                                  <button
                                    onClick={() => handleFeedback(false)}
                                    disabled={feedbackSubmitting}
                                    style={{
                                      width: "100%",
                                      border: "none",
                                      background: "var(--teal)",
                                      color: "#fff",
                                      borderRadius: 8,
                                      padding: "7px 8px",
                                      fontSize: "0.72rem",
                                      fontFamily: "var(--font-body)",
                                      cursor: feedbackSubmitting ? "not-allowed" : "pointer",
                                      opacity: feedbackSubmitting ? 0.75 : 1,
                                    }}
                                  >
                                    {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <p
                              style={{
                                fontSize: "0.74rem",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-body)",
                                marginBottom: 0,
                              }}
                            >
                              Thank you for your feedback.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
