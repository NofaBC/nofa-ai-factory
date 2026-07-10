"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadProductImage, deleteProductImage } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

interface Props {
  /** Currently saved download URL (from Firestore). Empty string if none. */
  currentUrl: string;
  /** Slug used for the storage path — auto-filled from the form. */
  slug: string;
  /** Called with the new download URL once upload completes. */
  onUploadComplete: (url: string) => void;
  /** Called when an upload starts — parent should disable save. */
  onUploadStart: () => void;
  /** Called when an upload finishes (success or error). */
  onUploadEnd: () => void;
}

export default function ImageUpload({
  currentUrl,
  slug,
  onUploadComplete,
  onUploadStart,
  onUploadEnd,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const displayed = localPreview || currentUrl || null;

  async function handleFile(file: File) {
    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported format — please use JPG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File too large — maximum is ${MAX_MB} MB.`);
      return;
    }

    // Show local preview immediately
    const objUrl = URL.createObjectURL(file);
    setLocalPreview(objUrl);
    setProgress(0);
    setUploading(true);
    onUploadStart();

    try {
      // Delete the old Storage file if it came from our bucket
      if (currentUrl) await deleteProductImage(currentUrl);

      const slugForPath = slug.trim() || `product-${Date.now()}`;
      const downloadUrl = await uploadProductImage(file, slugForPath, setProgress);
      onUploadComplete(downloadUrl);
    } catch {
      setError("Upload failed — please try again.");
      setLocalPreview(null);
    } finally {
      setUploading(false);
      onUploadEnd();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Preview */}
      {displayed ? (
        <div className="group relative h-44 w-full rounded-xl overflow-hidden border border-white/[0.08]">
          <Image
            src={displayed}
            alt="Product image preview"
            fill
            className="object-cover"
            unoptimized={!!localPreview} // blob URL — skip Next.js optimization
          />
          {/* Hover overlay with replace button */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-sm px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition disabled:opacity-50"
            >
              🔄 Replace image
            </button>
          </div>
        </div>
      ) : (
        /* Empty drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-36 w-full rounded-xl border-2 border-dashed border-white/[0.10] hover:border-blue-500/50 text-zinc-600 hover:text-zinc-400 text-sm transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-40"
        >
          <span className="text-3xl">🖼</span>
          <span className="font-medium">Click to choose image</span>
          <span className="text-xs text-zinc-700">JPG · PNG · WebP · max {MAX_MB} MB</span>
        </button>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 w-10 shrink-0 text-right">
            {progress}%
          </span>
        </div>
      )}

      {/* Status messages */}
      {uploading && (
        <p className="text-xs text-blue-400">Uploading… please wait before saving.</p>
      )}
      {!uploading && localPreview && (
        <p className="text-xs text-green-400">✓ Image uploaded successfully.</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
    </div>
  );
}
