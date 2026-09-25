"use client";

import { useEffect, useState } from "react";
import styles from "./NewsTicker.module.css";

const LINK = "https://nofa-ai-news-flash.vercel.app/";
const API_URL = "https://nofa-ai-news-flash.vercel.app/api/public/dashboard";
const REFRESH_MS = 60_000; // match the News Flash site's 60-second poll

// Fallback shown while loading or if the API is unreachable
const FALLBACK_ITEMS = [
  "🔵 NOFA AI News Flash — Live AI provider status and developer alerts",
  "🟢 Visit nofa-ai-news-flash.vercel.app for real-time AI infrastructure updates",
  "📡 Monitoring OpenAI · Anthropic · Gemini · xAI · Kimi · Z.ai · Qwen",
];

export default function NewsTicker() {
  const [time, setTime] = useState("");
  const [tickerItems, setTickerItems] = useState<string[]>(FALLBACK_ITEMS);
  const [reportCount, setReportCount] = useState<number | null>(null);

  // Live clock
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "short",
        } as Intl.DateTimeFormatOptions)
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch live ticker from News Flash API, refresh every 60 s
  useEffect(() => {
    let cancelled = false;

    async function fetchTicker() {
      try {
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();

        if (cancelled) return;

        // `ticker` is a single string like "🟠 OpenAI: ... • 🟢 Anthropic: ..."
        const raw: string = data.ticker ?? "";
        const items = raw
          .split(" • ")
          .map((s: string) => s.trim())
          .filter(Boolean);

        if (items.length > 0) setTickerItems(items);
        if (typeof data.reportCount === "number") setReportCount(data.reportCount);
      } catch {
        // silently keep previous / fallback items
      }
    }

    fetchTicker();
    const id = setInterval(fetchTicker, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const renderedItems = tickerItems.map((text, i) => (
    <a key={i} className={styles.tickerItem} href={LINK} target="_blank" rel="noopener noreferrer">
      <span className={styles.bullet}>▸</span>
      <span>{text}</span>
    </a>
  ));

  return (
    <div>
      {/* Top headline bar */}
      <div className={styles.topBar}>
        <div className={styles.logo}>NOFA</div>
        <div className={styles.headline}>
          AI News Flash — Live AI provider status &amp; developer alerts
          {reportCount !== null && (
            <span className={styles.reportBadge}>{reportCount} reports</span>
          )}
        </div>
        <a className={styles.ctaBtn} href={LINK} target="_blank" rel="noopener noreferrer">
          Visit Site →
        </a>
        <div className={styles.time}>{time}</div>
      </div>

      {/* Scrolling ticker */}
      <div className={styles.tickerWrap}>
        <div className={styles.tickerBadge}>
          <span className={styles.liveDot} />
          LIVE
        </div>
        <div className={styles.tickerTrack}>
          <div className={styles.tickerScroll}>
            {renderedItems}
            {renderedItems}
          </div>
        </div>
      </div>

      <div className={styles.bottomLine} />
    </div>
  );
}
