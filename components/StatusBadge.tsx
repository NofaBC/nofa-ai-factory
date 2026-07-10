"use client";

import { ProductStatus, STATUS_META } from "@/types/product";

interface Props {
  status: ProductStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: Props) {
  const meta = STATUS_META[status];
  const text = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${text} ${meta.color}`}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
