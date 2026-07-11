"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductInput } from "@/lib/firestore";
import { ALL_STATUSES, STATUS_META, ProductStatus } from "@/types/product";
import ImageUpload from "./ImageUpload";

interface Props {
  initial?: Partial<ProductInput>;
  onSubmit: (data: ProductInput) => Promise<void>;
  submitLabel: string;
}

function tagsFromString(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function ProductForm({ initial = {}, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initial.name ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [shortDescription, setShortDescription] = useState(initial.shortDescription ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus] = useState<ProductStatus>(initial.status ?? "concept");
  const [categories, setCategories] = useState((initial.categories ?? []).join(", "));
  const [industry, setIndustry] = useState((initial.industry ?? []).join(", "));
  const [aiCategory, setAiCategory] = useState((initial.aiCategory ?? []).join(", "));
  const [businessProblem, setBusinessProblem] = useState((initial.businessProblem ?? []).join(", "));
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [prototypeUrl, setPrototypeUrl] = useState(initial.prototypeUrl ?? "");
  const [liveSaasUrl, setLiveSaasUrl] = useState(initial.liveSaasUrl ?? "");
  const [judyUrl, setJudyUrl] = useState(initial.judyUrl ?? "");
  const [learnMoreUrl, setLearnMoreUrl] = useState(initial.learnMoreUrl ?? "");
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "");
  const [published, setPublished] = useState(initial.published ?? false);
  const [featured, setFeatured] = useState(initial.featured ?? false);
  const [order, setOrder] = useState(initial.order ?? 0);

  // Auto-generate slug from name
  function handleNameChange(v: string) {
    setName(v);
    if (!initial.slug) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        name,
        slug,
        shortDescription,
        description,
        status,
        categories: tagsFromString(categories),
        industry: tagsFromString(industry),
        aiCategory: tagsFromString(aiCategory),
        businessProblem: tagsFromString(businessProblem),
        tags: tagsFromString(tags),
        prototypeUrl,
        liveSaasUrl,
        judyUrl,
        learnMoreUrl,
        imageUrl,
        published,
        featured,
        order,
      });
      router.push("/admin/products");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Basic Info */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Basic Info</h2>

        <Field label="Product Name *">
          <input required value={name} onChange={(e) => handleNameChange(e.target.value)} className={input} />
        </Field>
        <Field label="Slug *" hint="URL-safe identifier, auto-generated from name">
          <input required value={slug} onChange={(e) => setSlug(e.target.value)} className={input} />
        </Field>
        <Field label="Short Description *" hint="Shown on cards — keep under 160 chars">
          <textarea required rows={2} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className={input} />
        </Field>
        <Field label="Full Description" hint="Shown on the product detail page">
          <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
        </Field>
        <Field label="Status *">
          <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)} className={input}>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].emoji} {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      {/* Categorization */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Categorization</h2>
        <Field label="Categories" hint="Comma-separated, e.g. Automation, Workflow">
          <input value={categories} onChange={(e) => setCategories(e.target.value)} className={input} />
        </Field>
        <Field label="Industry" hint="e.g. Healthcare, Real Estate">
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={input} />
        </Field>
        <Field label="AI Category" hint="e.g. Agent, Voice AI, Vision">
          <input value={aiCategory} onChange={(e) => setAiCategory(e.target.value)} className={input} />
        </Field>
        <Field label="Business Problem" hint="e.g. Lead Gen, Customer Support">
          <input value={businessProblem} onChange={(e) => setBusinessProblem(e.target.value)} className={input} />
        </Field>
        <Field label="Tags" hint="Extra searchable keywords">
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={input} />
        </Field>
      </section>

      {/* Links */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Links</h2>
        <Field label="✅ Live SaaS URL">
          <input type="url" value={liveSaasUrl} onChange={(e) => setLiveSaasUrl(e.target.value)} placeholder="https://" className={input} />
        </Field>
        <Field label="🚀 Prototype URL">
          <input type="url" value={prototypeUrl} onChange={(e) => setPrototypeUrl(e.target.value)} placeholder="https://" className={input} />
        </Field>
        <Field label="💬 Judy URL">
          <input type="url" value={judyUrl} onChange={(e) => setJudyUrl(e.target.value)} placeholder="https://" className={input} />
        </Field>
        <Field label="📖 Learn More URL">
          <input type="url" value={learnMoreUrl} onChange={(e) => setLearnMoreUrl(e.target.value)} placeholder="https://" className={input} />
        </Field>
        <Field label="🖼 Product Image" hint="JPG · PNG · WebP · max 5 MB — hover the preview to replace">
          <ImageUpload
            currentUrl={imageUrl}
            slug={slug}
            onUploadStart={() => setImageUploading(true)}
            onUploadEnd={() => setImageUploading(false)}
            onUploadComplete={(url) => setImageUrl(url)}
          />
        </Field>
      </section>

      {/* Settings */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Settings</h2>
        <div className="flex flex-wrap gap-6">
          <Toggle label="Published" checked={published} onChange={setPublished} />
          <Toggle label="Featured on Homepage" checked={featured} onChange={setFeatured} />
        </div>
        <Field label="Sort Order" hint="Lower numbers appear first">
          <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className={`${input} w-32`} />
        </Field>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || imageUploading}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
        >
          {imageUploading ? "Waiting for image…" : saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="px-6 py-2.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const input = "w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {hint && <span className="text-xs text-zinc-600">{hint}</span>}
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-zinc-700"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`} />
      </button>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}
