"use client";

import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { CustomizeConfig, DEFAULT_CUSTOMIZE_CONFIG } from "@/types/customize";
import AdminNav from "@/components/AdminNav";

const inp = "w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return getIdToken(user);
}

export default function CustomizeSettingsPage() {
  const [config, setConfig] = useState<CustomizeConfig>(DEFAULT_CUSTOMIZE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/admin/customize/config", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setConfig(await res.json());
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/customize/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) setMsg({ ok: true, text: "Settings saved." });
      else setMsg({ ok: false, text: data.error ?? "Save failed." });
    } catch (err) {
      setMsg({ ok: false, text: String(err) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-7 w-7 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    </div>
  );

  return (
    <div>
      <AdminNav />
      <div className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">NOFA Customize™</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Control customization offers across the product showroom.
            </p>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-6">
            {/* Master switch */}
            <section className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 flex flex-col gap-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Global Control</h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Master Switch</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Turn off to hide all customization CTAs site-wide instantly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, masterEnabled: !c.masterEnabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    config.masterEnabled ? "bg-blue-600" : "bg-zinc-700"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    config.masterEnabled ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Enable for New Products by Default</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Newly published eligible products will show the CTA automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, newProductDefault: !c.newProductDefault }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    config.newProductDefault ? "bg-blue-600" : "bg-zinc-700"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    config.newProductDefault ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            </section>

            {/* Messaging */}
            <section className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Messaging</h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Button Text</label>
                <input value={config.buttonText} onChange={(e) => setConfig((c) => ({ ...c, buttonText: e.target.value }))} className={inp} maxLength={200} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Introductory Message (shown in inquiry form)</label>
                <textarea rows={3} value={config.introMessage} onChange={(e) => setConfig((c) => ({ ...c, introMessage: e.target.value }))} className={inp} maxLength={1000} />
              </div>
            </section>

            {/* Notifications + Calendly */}
            <section className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Notifications & Booking</h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Notification Email</label>
                <input type="email" value={config.notifyEmail} onChange={(e) => setConfig((c) => ({ ...c, notifyEmail: e.target.value }))} className={inp} />
                <p className="text-xs text-zinc-600">All inquiry notifications are sent to this address.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Calendly URL</label>
                <input type="url" value={config.calendlyUrl} placeholder="https://calendly.com/..." onChange={(e) => setConfig((c) => ({ ...c, calendlyUrl: e.target.value }))} className={inp} />
                <p className="text-xs text-zinc-600">Visitors are offered this link after submitting an inquiry. Leave blank to skip Calendly step.</p>
              </div>
            </section>

            {msg && (
              <p className={`text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
