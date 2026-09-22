"use client";

import { useEffect, useState } from "react";
import styles from "./NewsTicker.module.css";

const LINK = "https://nofa-ai-news-flash.vercel.app/";

const HEADLINES: { text: string; highlight: string }[] = [
  { text: "Breaking: New AI model surpasses human benchmarks on reasoning tasks", highlight: "Breaking:" },
  { text: "OpenAI announces next-generation multimodal architecture", highlight: "OpenAI" },
  { text: "EU AI Act enforcement enters next phase — full compliance required by 2026", highlight: "EU AI Act" },
  { text: "Google DeepMind unveils breakthrough in protein folding prediction", highlight: "DeepMind" },
  { text: "AI-powered coding assistants now used by 78% of professional developers", highlight: "78%" },
  { text: "New study reveals AI can detect early-stage cancer with 99.2% accuracy", highlight: "99.2%" },
  { text: "NVIDIA stock surges as AI chip demand hits record high", highlight: "NVIDIA" },
  { text: "Anthropic releases Claude with extended memory and tool use capabilities", highlight: "Anthropic" },
  { text: "AI ethics board calls for mandatory transparency in training data", highlight: "AI ethics" },
  { text: "Stay informed — visit NOFA AI News Flash for real-time updates", highlight: "NOFA AI News Flash" },
];

function Highlighted({ text, highlight }: { text: string; highlight: string }) {
  const idx = text.indexOf(highlight);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className={styles.highlight}>{highlight}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

export default function NewsTicker() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "short",
        } as Intl.DateTimeFormatOptions)
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const items = HEADLINES.map((h, i) => (
    <a key={i} className={styles.tickerItem} href={LINK} target="_blank" rel="noopener noreferrer">
      <span className={styles.bullet}>▸</span>
      <span>
        <Highlighted text={h.text} highlight={h.highlight} />
      </span>
    </a>
  ));

  return (
    <div>
      {/* Top headline bar */}
      <div className={styles.topBar}>
        <div className={styles.logo}>NOFA</div>
        <div className={styles.headline}>
          AI News Flash — Your Source for the Latest in Artificial Intelligence
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
          {/* Items doubled so the seamless loop works */}
          <div className={styles.tickerScroll}>
            {items}
            {items}
          </div>
        </div>
      </div>

      <div className={styles.bottomLine} />
    </div>
  );
}
