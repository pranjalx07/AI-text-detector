"use client";

import { useState, useEffect, useCallback } from "react";
import { getStats, getHistory, getAdminFeedback, deleteSubmission, StatsData, HistoryItem } from "@/lib/api";

type Tab = "dashboard" | "submissions" | "feedback" | "models" | "settings";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [submissions, setSubmissions] = useState<HistoryItem[]>([]);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [feedback, setFeedback] = useState<Record<string, unknown>[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await getStats();
      setStats(s);
    } catch { /* ignore */ }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await getHistory({ page: subPage, per_page: 15, sort: "latest" });
      setSubmissions(data.items);
      setSubTotalPages(data.total_pages);
    } catch { /* ignore */ }
  }, [subPage]);

  const fetchFeedback = useCallback(async () => {
    try {
      const data = await getAdminFeedback();
      setFeedback(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (tab === "submissions") fetchSubmissions();
    if (tab === "feedback") fetchFeedback();
  }, [tab, fetchSubmissions, fetchFeedback]);

  const handleDelete = async (id: string) => {
    await deleteSubmission(id);
    fetchSubmissions();
    fetchStats();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "submissions", label: "Submissions" },
    { key: "feedback", label: "Feedback" },
    { key: "models", label: "Models" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex gap-8" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <div className="w-48 shrink-0">
        <h2
          className="text-lg mb-6"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Admin
        </h2>
        <nav className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="block w-full text-left px-3 py-2 text-sm border-l-2"
              style={{
                fontFamily: "var(--font-inter)",
                borderColor:
                  tab === t.key ? "var(--accent)" : "transparent",
                color:
                  tab === t.key
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                background:
                  tab === t.key ? "var(--bg-surface)" : "transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Dashboard */}
        {tab === "dashboard" && (
          <div>
            <h1
              className="text-2xl mb-8"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Dashboard
            </h1>

            {stats ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Total Submissions", value: stats.total },
                    { label: "AI-Generated", value: stats.ai_count },
                    { label: "Human-Written", value: stats.human_count },
                    {
                      label: "Avg Confidence",
                      value: stats.avg_confidence.toFixed(4),
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="border p-4"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-surface)",
                      }}
                    >
                      <div
                        className="text-xs uppercase tracking-[0.15em] mb-1"
                        style={{
                          fontFamily: "var(--font-inter)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        className="text-2xl font-bold"
                        style={{
                          fontFamily: "var(--font-inter)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI vs Human bar */}
                <div
                  className="border p-4 mb-8"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-surface)",
                  }}
                >
                  <h3
                    className="text-xs uppercase tracking-[0.15em] mb-3"
                    style={{
                      fontFamily: "var(--font-inter)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Classification Distribution
                  </h3>
                  <div
                    className="flex h-8 border overflow-hidden"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {stats.total > 0 && (
                      <>
                        <div
                          className="flex items-center justify-center text-xs font-bold"
                          style={{
                            width: `${(stats.human_count / stats.total) * 100}%`,
                            background: "var(--human-bg)",
                            color: "var(--human)",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          Human: {stats.human_count}
                        </div>
                        <div
                          className="flex items-center justify-center text-xs font-bold"
                          style={{
                            width: `${(stats.ai_count / stats.total) * 100}%`,
                            background: "var(--ai-bg)",
                            color: "var(--ai)",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          AI: {stats.ai_count}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Daily submissions */}
                {stats.daily.length > 0 && (
                  <div
                    className="border p-4"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg-surface)",
                    }}
                  >
                    <h3
                      className="text-xs uppercase tracking-[0.15em] mb-3"
                      style={{
                        fontFamily: "var(--font-inter)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Daily Submissions (Last 14 Days)
                    </h3>
                    <div className="flex items-end gap-2 h-32">
                      {stats.daily
                        .slice()
                        .reverse()
                        .map((d) => {
                          const maxCount = Math.max(
                            ...stats.daily.map((x) => x.count)
                          );
                          const height =
                            maxCount > 0
                              ? (d.count / maxCount) * 100
                              : 0;
                          return (
                            <div
                              key={d.date}
                              className="flex-1 flex flex-col items-center gap-1"
                            >
                              <span
                                className="text-xs"
                                style={{
                                  fontFamily: "var(--font-inter)",
                                  color: "var(--text-muted)",
                                  fontSize: "10px",
                                }}
                              >
                                {d.count}
                              </span>
                              <div
                                style={{
                                  height: `${Math.max(height, 4)}%`,
                                  background: "var(--bg-dark)",
                                  width: "100%",
                                }}
                              />
                              <span
                                className="text-xs"
                                style={{
                                  fontFamily: "var(--font-inter)",
                                  color: "var(--text-muted)",
                                  fontSize: "9px",
                                }}
                              >
                                {d.date.slice(5)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p
                className="text-sm"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--text-muted)",
                }}
              >
                Loading stats...
              </p>
            )}
          </div>
        )}

        {/* Submissions */}
        {tab === "submissions" && (
          <div>
            <h1
              className="text-2xl mb-6"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              All Submissions
            </h1>
            <div
              className="border"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-surface)",
              }}
            >
              <div
                className="grid grid-cols-[1fr_120px_90px_80px_60px] text-xs uppercase tracking-[0.15em] px-4 py-3 border-b"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--text-muted)",
                  borderColor: "var(--border)",
                }}
              >
                <span>Text</span>
                <span>Label</span>
                <span>Confidence</span>
                <span>Feedback</span>
                <span></span>
              </div>
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[1fr_120px_90px_80px_60px] px-4 py-3 border-b items-center"
                  style={{
                    borderColor: "var(--border)",
                    fontFamily: "var(--font-inter)",
                    fontSize: "12px",
                  }}
                >
                  <span className="truncate pr-2">
                    {s.raw_text.slice(0, 60)}...
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{
                      color:
                        s.label === "AI-Generated"
                          ? "var(--ai)"
                          : "var(--human)",
                    }}
                  >
                    {s.label}
                  </span>
                  <span>{s.confidence.toFixed(4)}</span>
                  <span>
                    {s.feedback_correct === null
                      ? "—"
                      : s.feedback_correct
                      ? "✓"
                      : "✗"}
                  </span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-xs px-2 py-1 border"
                    style={{
                      borderColor: "var(--accent)",
                      color: "var(--accent)",
                    }}
                  >
                    Del
                  </button>
                </div>
              ))}
            </div>
            {subTotalPages > 1 && (
              <div
                className="flex items-center justify-center gap-4 mt-4 text-sm"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                <button
                  onClick={() => setSubPage(Math.max(1, subPage - 1))}
                  disabled={subPage === 1}
                  className="px-3 py-1 border"
                  style={{ borderColor: "var(--border)" }}
                >
                  &lt; Prev
                </button>
                <span style={{ color: "var(--text-muted)" }}>
                  Page {subPage} of {subTotalPages}
                </span>
                <button
                  onClick={() =>
                    setSubPage(Math.min(subTotalPages, subPage + 1))
                  }
                  disabled={subPage === subTotalPages}
                  className="px-3 py-1 border"
                  style={{ borderColor: "var(--border)" }}
                >
                  Next &gt;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        {tab === "feedback" && (
          <div>
            <h1
              className="text-2xl mb-6"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              User Feedback
            </h1>
            {feedback.length === 0 ? (
              <p
                className="text-sm"
                style={{
                  fontFamily: "var(--font-inter)",
                  color: "var(--text-muted)",
                }}
              >
                No feedback received yet.
              </p>
            ) : (
              <div
                className="border"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-surface)",
                }}
              >
                <div
                  className="grid grid-cols-[1fr_120px_80px_1fr] text-xs uppercase tracking-[0.15em] px-4 py-3 border-b"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "var(--text-muted)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span>Text Preview</span>
                  <span>Prediction</span>
                  <span>User Said</span>
                  <span>Comment</span>
                </div>
                {feedback.map((f, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_120px_80px_1fr] px-4 py-3 border-b"
                    style={{
                      borderColor: "var(--border)",
                      fontFamily: "var(--font-inter)",
                      fontSize: "12px",
                    }}
                  >
                    <span className="truncate pr-2">
                      {String(f.raw_text || "").slice(0, 60)}
                    </span>
                    <span>{String(f.label || "")}</span>
                    <span>{f.feedback_correct ? "✓ Correct" : "✗ Wrong"}</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {String(f.feedback_comment || "—")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Models */}
        {tab === "models" && (
          <div>
            <h1
              className="text-2xl mb-6"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Model Information
            </h1>
            <div
              className="border p-6"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-surface)",
              }}
            >
              <div className="space-y-4" style={{ fontFamily: "var(--font-inter)" }}>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Current Model</span>
                  <span>roberta-base-openai-detector</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Version</span>
                  <span>v1.0 (March 2026)</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Framework</span>
                  <span>PyTorch + Transformers</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Status</span>
                  <span style={{ color: "var(--human)" }}>Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {tab === "settings" && (
          <div>
            <h1
              className="text-2xl mb-6"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Settings
            </h1>
            <div
              className="border p-6 space-y-6"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-surface)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    Public Submissions
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{
                      fontFamily: "var(--font-inter)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Allow unauthenticated users to submit text for detection
                  </p>
                </div>
                <span
                  className="px-3 py-1 border text-xs"
                  style={{
                    fontFamily: "var(--font-inter)",
                    borderColor: "var(--human)",
                    color: "var(--human)",
                  }}
                >
                  Enabled
                </span>
              </div>

              <div
                className="border-t pt-4"
                style={{ borderColor: "var(--border)" }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Text Length Limits
                </p>
                <div
                  className="flex gap-4 mt-2"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  <div>
                    <label
                      className="text-xs block mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Min Words
                    </label>
                    <input
                      type="number"
                      defaultValue={20}
                      className="w-20 px-2 py-1 text-sm border"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-xs block mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      defaultValue={512}
                      className="w-20 px-2 py-1 text-sm border"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-primary)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
