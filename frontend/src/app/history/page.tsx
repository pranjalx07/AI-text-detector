"use client";

import { useState, useEffect, useCallback } from "react";
import { getHistory, HistoryItem } from "@/lib/api";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [label, setLabel] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHistory({ page, label, search, sort, per_page: 10 });
      setItems(data.items);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, label, search, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filters = ["All", "AI-Generated", "Human-Written"];

  return (
    <div
      className="max-w-7xl mx-auto px-6 py-10"
      style={{ background: "var(--bg-primary)" }}
    >
      <h1
        className="text-3xl font-bold mb-8 tracking-tight"
        style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
      >
        Detection Log
      </h1>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search text..."
          className="px-3 py-2 text-sm rounded-md flex-1 min-w-[200px] focus:outline-none"
            style={{
              fontFamily: "var(--font-body)",
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          />
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => {
                setLabel(f);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-md"
              style={{
                fontFamily: "var(--font-body)",
                border: "1px solid var(--border)",
                background: label === f ? "var(--bg-dark)" : "var(--bg-surface)",
                color: label === f ? "#fff" : "var(--text-secondary)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-md"
            style={{
              fontFamily: "var(--font-body)",
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
          >
            <option value="latest">Latest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p
          className="text-sm py-10 text-center"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
        >
          Loading...
        </p>
      ) : items.length === 0 ? (
        <p
          className="text-sm py-10 text-center"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
        >
          No detection history yet. Run your first analysis.
        </p>
      ) : (
        <div
          className="border rounded-xl overflow-hidden"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          {/* Header */}
          <div
            className="grid grid-cols-[40px_1fr_140px_100px_160px_90px] text-xs uppercase tracking-[0.15em] px-4 py-3 border-b"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-muted)",
              borderColor: "var(--border)",
            }}
          >
            <span>#</span>
            <span>Text Preview</span>
            <span>Label</span>
            <span>Confidence</span>
            <span>Date</span>
            <span>Feedback</span>
          </div>

          {items.map((item, i) => (
            <div key={item.id}>
              <div
                className="grid grid-cols-[40px_1fr_140px_100px_160px_90px] px-4 py-3 border-b cursor-pointer transition-colors"
                style={{
                  borderColor: "var(--border)",
                fontFamily: "var(--font-body)",
                  fontSize: "13px",
                }}
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-surface2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span style={{ color: "var(--text-muted)" }}>
                  {(page - 1) * 10 + i + 1}
                </span>
                <span className="truncate pr-4">
                  {item.raw_text.slice(0, 80)}...
                </span>
                <span>
                  <span
                    className="inline-block px-2 py-0.5 text-xs font-bold uppercase border"
                    style={{
                      background:
                        item.label === "AI-Generated"
                          ? "var(--ai-bg)"
                          : "var(--human-bg)",
                      color:
                        item.label === "AI-Generated"
                          ? "var(--ai)"
                          : "var(--human)",
                      borderColor:
                        item.label === "AI-Generated"
                          ? "rgba(220,38,38,0.3)"
                          : "rgba(22,163,74,0.3)",
                      borderRadius: 4,
                    }}
                  >
                    {item.label === "AI-Generated" ? "AI" : "Human"}
                  </span>
                </span>
                <span>{item.confidence.toFixed(4)}</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {item.created_at.replace("T", " ").slice(0, 19)}
                </span>
                <span>
                  {item.feedback_correct === null
                    ? "—"
                    : item.feedback_correct
                    ? "✓"
                    : "✗"}
                </span>
              </div>

              {/* Expanded row */}
              {expandedId === item.id && (
                <div
                  className="px-6 py-4 border-b"
                  style={{
                    borderColor: "var(--border)",
                  background: "var(--bg-surface)",
                  fontFamily: "var(--font-body)",
                    fontSize: "12px",
                  }}
                >
                  <p
                    className="mb-3 whitespace-pre-wrap"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.raw_text}
                  </p>
                  <div
                    className="flex gap-6 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span>Human: {item.human_prob.toFixed(6)}</span>
                    <span>AI: {item.ai_prob.toFixed(6)}</span>
                    <span>Inference: {item.inference_time_ms}ms</span>
                    {item.feedback_comment && (
                      <span>Comment: {item.feedback_comment}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-center gap-4 mt-6 text-sm"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border"
            style={{
              borderColor: "var(--border)",
              opacity: page === 1 ? 0.4 : 1,
            }}
          >
            &lt; Prev
          </button>
          <span style={{ color: "var(--text-muted)" }}>
            Page {page} of {totalPages} ({total} total)
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border"
            style={{
              borderColor: "var(--border)",
              opacity: page === totalPages ? 0.4 : 1,
            }}
          >
            Next &gt;
          </button>
        </div>
      )}
    </div>
  );
}
