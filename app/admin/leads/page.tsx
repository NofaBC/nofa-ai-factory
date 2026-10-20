"use client";

import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { CustomizeLead, LeadStatus, LEAD_STATUSES } from "@/types/customize";
import AdminNav from "@/components/AdminNav";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return getIdToken(user);
}

const STATUS_COLOR: Record<LeadStatus, string> = {
  New: "bg-blue-900/50 text-blue-300 border-blue-800",
  Contacted: "bg-amber-900/50 text-amber-300 border-amber-800",
  "Consultation Scheduled": "bg-violet-900/50 text-violet-300 border-violet-800",
  "Proposal Sent": "bg-teal-900/50 text-teal-300 border-teal-800",
  Won: "bg-green-900/50 text-green-300 border-green-800",
  Lost: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<CustomizeLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProduct, setFilterProduct] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "">("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchLeads() {
    setLoading(true);
    try {
      const token = await getToken();
      const params = filterProduct ? `?productSlug=${encodeURIComponent(filterProduct)}` : "";
      const res = await fetch(`/api/admin/customize/leads${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchLeads(); }, [filterProduct]); // eslint-disable-line

  async function handleStatusChange(id: string, status: LeadStatus) {
    setUpdatingId(id);
    try {
      const token = await getToken();
      await fetch("/api/admin/customize/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    } catch { /* silent */ }
    finally { setUpdatingId(null); }
  }

  const filtered = filterStatus
    ? leads.filter((l) => l.status === filterStatus)
    : leads;

  // Unique product slugs for filter dropdown
  const products = [...new Set(leads.map((l) => l.productSlug))].sort();

  return (
    <div>
      <AdminNav />
      <div className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Customization Leads</h1>
              <p className="text-zinc-500 text-sm mt-1">
                {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
                {filterStatus ? ` · ${filterStatus}` : ""}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="rounded-lg border border-white/[0.08] bg-[#111827] px-3 py-2 text-sm text-zinc-300 focus:outline-none"
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as LeadStatus | "")}
                className="rounded-lg border border-white/[0.08] bg-[#111827] px-3 py-2 text-sm text-zinc-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-20 text-center">
              <p className="text-zinc-600">No leads yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-xl border border-white/[0.06] bg-[#111827] overflow-hidden"
                >
                  {/* Summary row */}
                  <div className="flex items-center gap-4 px-4 py-3">
                    <button
                      onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-medium text-white text-sm">{lead.fullName}</span>
                        <span className="text-xs text-zinc-500">{lead.businessEmail}</span>
                        <span className="text-xs text-zinc-600">·</span>
                        <span className="text-xs text-blue-400">{lead.productName}</span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {new Date(lead.submittedAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                        {lead.company ? ` · ${lead.company}` : ""}
                        {!lead.emailSent && (
                          <span className="ml-2 text-amber-500">⚠ Email not sent</span>
                        )}
                      </p>
                    </button>

                    {/* Status selector */}
                    <select
                      value={lead.status}
                      disabled={updatingId === lead.id}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className={`rounded-full text-xs px-3 py-1 border font-medium focus:outline-none disabled:opacity-50 bg-transparent ${STATUS_COLOR[lead.status]}`}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-[#111827] text-zinc-300">{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Expanded detail */}
                  {expanded === lead.id && (
                    <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 flex flex-col gap-3 text-sm">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        <span className="text-zinc-500">Product</span>
                        <a
                          href={lead.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {lead.productName}
                        </a>
                        {lead.industry && <><span className="text-zinc-500">Industry</span><span className="text-zinc-300">{lead.industry}</span></>}
                        {lead.timeline && <><span className="text-zinc-500">Timeline</span><span className="text-zinc-300">{lead.timeline}</span></>}
                        {lead.utmSource && <><span className="text-zinc-500">Source</span><span className="text-zinc-300">{lead.utmSource}</span></>}
                      </div>
                      <div className="rounded-lg bg-white/5 p-3">
                        <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Requirements</p>
                        <p className="text-zinc-300 text-xs whitespace-pre-wrap">{lead.requirements}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
