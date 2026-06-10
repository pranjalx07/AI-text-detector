import Image from "next/image";

const teamMembers = [
  {
    name: "Aayush Baral",
    //role: "ML Engineer & Backend Developer",
    photo: "/team/aalyush-baral.jpg",
  },
    {
    name: "Akriti Adhikari",
    //role: "Team Lead & NLP Engineer",
    photo: "/team/akriti.jpg",
  },
  {
    name: "Pranjal Giri",
    //role: "Frontend Developer & UI/UX",
    photo: "/team/pranjal-giri.jpg",
  },
  {
    name: "Binisha Parajuli",
    //role: "Data Engineer & Researcher",
    photo: null,
    initials: "BS",
  },
];

const stats = [
  { value: "63,464", label: "Training Samples" },
  { value: "99%", label: "Validation Accuracy" },
  { value: "110M", label: "Model Parameters" },
  { value: "350", label: "Max Tokens" },
];

const gapCards = [
  {
    title: "Bias Against Non-Native Writers",
    desc: "Existing tools frequently misclassify non-native English writing as AI-generated, threatening academic fairness and inclusion.",
  },
  {
    title: "Evasion via Paraphrasing",
    desc: "Widely available paraphrasing tools can easily rewrite AI text to bypass most current detectors.",
  },
  {
    title: "Limited Explainability",
    desc: "Most detectors return only a verdict, with no rationale or word-level attribution.",
  },
];

const timelineSteps = [
  {
    step: "01",
    title: "Dataset Construction",
    desc: "Curated 63,464 balanced samples of human-written (Reddit, Wikipedia) and AI-generated (GPT-3.5, GPT-4,Grok-mini) texts with deduplication.",
  },
  {
    step: "02",
    title: "Preprocessing Pipeline",
    desc: "Implemented lowercasing, punctuation removal, and WordPiece tokenization with a max sequence length of 512 tokens.",
  },
  {
    step: "03",
    title: "Fine-Tuning BERT",
    desc: "Fine-tuned BERT-base-uncased via Hugging Face Trainer API with PyTorch for binary classification.",
  },
  {
    step: "04",
    title: "Evaluation & Deployment",
    desc: "Achieved 99% accuracy, then deployed via RESTAPI with feedback loop, and detection history.",
  },
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg-primary)" }}>
      {/* Hero */}
      <section
        style={{
          background: "var(--bg-dark)",
          padding: "100px 0 80px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-8 text-center">
          <div
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: "rgba(20,184,166,0.10)",
              border: "1px solid rgba(20,184,166,0.30)",
              borderRadius: 50,
              color: "var(--teal)",
              fontFamily: "var(--font-body)",
            }}
          >
            Sixth semester Project KhCE
          </div>
          <h1
            className="font-extrabold tracking-tight mb-6"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
              fontSize: "clamp(2.5rem,4.5vw,3.5rem)",
              letterSpacing: "-1px",
            }}
          >
            About the Project
          </h1>
          <p
            className="mx-auto text-base leading-relaxed"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-secondary)",
              maxWidth: 620,
              lineHeight: 1.7,
            }}
          >
            AI Text Detector is an AI-generated text detection system built using fine-tuned BERT to
            distinguish human writing from LLM-generated content with high accuracy.
          </p>
        </div>
      </section>

      {/* Project Overview */}
      <section style={{ padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ fontFamily: "var(--font-body)", color: "var(--teal)" }}
              >
                Project Overview
              </p>
              <h2
                className="text-2xl font-bold mb-6"
                style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
              >
                Fine-tuned BERT for AI text detection
              </h2>
              <p
                className="text-sm leading-relaxed mb-5"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.8,
                }}
              >
                As AI writing tools become difficult, distinguishing human-authored
                text from machine-generated content is increasingly critical. Our
                system fine-tunes BERT on a balanced, high-quality dataset of
                63,464 samples.
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.8,
                }}
              >
                The model processes text through transformer layers and outputs
                confidence-scored predictions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="p-6"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                  }}
                >
                  <div
                    className="text-3xl font-extrabold mb-2"
                    style={{ fontFamily: "var(--font-heading)", color: "var(--teal)" }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-sm"
                    style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Research Gap */}
      <section style={{ background: "var(--bg-dark)", padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-8">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-body)", color: "var(--teal)" }}
          >
            The Research Gap
          </p>
          <h2
            className="text-2xl font-bold mb-12"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
          >
            Why existing solutions fall short
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {gapCards.map((c) => (
              <div
                key={c.title}
                className="p-8"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                }}
              >
                <h3
                  className="text-base font-bold mb-4"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
                >
                  {c.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                  }}
                >
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Timeline */}
      <section style={{ padding: "80px 0" }}>
        <div className="max-w-5xl mx-auto px-8">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-body)", color: "var(--teal)" }}
          >
            Our Solution
          </p>
          <h2
            className="text-2xl font-bold mb-12"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
          >
            How we built it
          </h2>
          <div
            className="relative"
            style={{ borderLeft: "2px solid var(--border-teal)", paddingLeft: 40 }}
          >
            {timelineSteps.map((step, i) => (
              <div
                key={step.step}
                className={i < timelineSteps.length - 1 ? "mb-10" : ""}
                style={{ position: "relative" }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: -52,
                    top: 4,
                    width: 24,
                    height: 24,
                    background: "var(--teal)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#fff",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {step.step}
                  </span>
                </div>
                <div
                  className="p-6"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                  }}
                >
                  <h3
                    className="text-base font-bold mb-2"
                    style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "var(--text-secondary)",
                      lineHeight: 1.7,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ background: "var(--bg-dark)", padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-8">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3 text-center"
            style={{ fontFamily: "var(--font-body)", color: "var(--teal)" }}
          >
            The Team
          </p>
          <h2
            className="text-2xl font-bold mb-12 text-center"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
          >
            Meet the developers
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="text-center p-6"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                }}
              >
                <div
                  className="mx-auto mb-5"
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "3px solid var(--teal)",
                    flexShrink: 0,
                  }}
                >
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      width={96}
                      height={96}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "var(--bg-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          color: "var(--teal)",
                          fontFamily: "var(--font-heading)",
                        }}
                      >
                        {member.initials}
                      </span>
                    </div>
                  )}
                </div>
                <h3
                  className="font-bold text-base mb-1"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
                >
                  {member.name}
                </h3>
                <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--teal)" }}>
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}