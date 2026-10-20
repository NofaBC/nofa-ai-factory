"use client";

import { useState, useRef, useEffect } from "react";

const TIMELINES = [
  "As soon as possible",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "Flexible / Exploring",
];

interface Props {
  product: { id: string; name: string; slug: string };
  introMessage: string;
  onClose: () => void;
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as { gtag: (...a: unknown[]) => void }).gtag(...args);
  }
}

export default function CustomizeModal({ product, introMessage, onClose }: Props) {
  const [step, setStep] = useState<"form" | "success" | "dupe">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [calendlyUrl, setCalendlyUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // GA4: form start
  useEffect(() => {
    gtag("event", "customize_form_start", {
      product_id: product.id,
      product_name: product.name,
    });
  }, []); // eslint-disable-line

  // Trap focus inside modal
  useEffect(() => {
    const el = document.getElementById("customize-modal-title");
    el?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      productSlug: product.slug,
      fullName: fd.get("fullName"),
      businessEmail: fd.get("businessEmail"),
      company: fd.get("company"),
      industry: fd.get("industry"),
      requirements: fd.get("requirements"),
      timeline: fd.get("timeline"),
      _hp: fd.get("_hp"), // honeypot
      utmSource: new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
      utmMedium: new URLSearchParams(window.location.search).get("utm_medium") ?? undefined,
      utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") ?? undefined,
    };

    try {
      const res = await fetch("/api/customize/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (data.duplicate) {
        setStep("dupe");
        return;
      }

      // GA4: lead generated
      gtag("event", "generate_lead", {
        product_id: product.id,
        product_name: product.name,
      });

      setCalendlyUrl(data.calendlyUrl ?? null);
      setStep("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCalendlyClick() {
    gtag("event", "calendly_click", {
      product_id: product.id,
      product_name: product.name,
    });
    if (calendlyUrl) window.open(calendlyUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customize-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0d1117] shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2
                id="customize-modal-title"
                tabIndex={-1}
                className="text-lg font-bold text-white focus:outline-none"
              >
                🔧 Customize This for My Business
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">{product.name}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-zinc-500 hover:text-white text-xl leading-none transition-colors"
            >
              ✕
            </button>
          </div>

          {step === "form" && (
            <>
              {introMessage && (
                <p className="text-sm text-zinc-400 mb-5 leading-relaxed">{introMessage}</p>
              )}
              <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Honeypot — hidden from real users, filled by bots */}
                <input
                  type="text"
                  name="_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", opacity: 0 }}
                />

                <Field label="Full Name *">
                  <input name="fullName" required maxLength={200} className={inp} />
                </Field>
                <Field label="Business Email *">
                  <input name="businessEmail" type="email" required maxLength={254} className={inp} />
                </Field>
                <Field label="Company Name">
                  <input name="company" maxLength={200} className={inp} />
                </Field>
                <Field label="Industry">
                  <input name="industry" maxLength={200} className={inp} />
                </Field>
                <Field label="What would you like customized? *">
                  <textarea
                    name="requirements"
                    required
                    rows={4}
                    maxLength={2000}
                    placeholder="Describe your use case, workflows, or requirements…"
                    className={inp}
                  />
                </Field>
                <Field label="Expected Implementation Timeframe">
                  <select name="timeline" className={inp}>
                    <option value="">Select…</option>
                    {TIMELINES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors mt-1"
                >
                  {submitting ? "Submitting…" : "Submit Inquiry"}
                </button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-6 flex flex-col gap-4">
              <div className="text-4xl">✅</div>
              <h3 className="text-lg font-semibold text-white">Inquiry Received!</h3>
              <p className="text-zinc-400 text-sm">
                We&apos;ve saved your inquiry and a notification has been sent to our team.
                We&apos;ll be in touch soon.
              </p>
              {calendlyUrl && (
                <button
                  onClick={handleCalendlyClick}
                  className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                >
                  📅 Schedule a Consultation Now
                </button>
              )}
              <button
                onClick={onClose}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {step === "dupe" && (
            <div className="text-center py-6 flex flex-col gap-4">
              <div className="text-4xl">💬</div>
              <h3 className="text-lg font-semibold text-white">Already Received!</h3>
              <p className="text-zinc-400 text-sm">
                We already have your inquiry for this product. We&apos;ll be in touch soon.
              </p>
              <button
                onClick={onClose}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
