export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-primary)",
        padding: "26px 0",
      }}
    >
      <div className="max-w-7xl mx-auto px-8 text-center">
        <p
          className="text-sm"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}
        >
          ©AI Text Detector 2026
        </p>
      </div>
    </footer>
  );
}
