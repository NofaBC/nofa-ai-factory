import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import app from "./firebase";

export const storage = getStorage(app);

/**
 * Upload a product image to Firebase Storage.
 * Path: products/{slug}/{timestamp}-{sanitized-filename}
 */
export async function uploadProductImage(
  file: File,
  slug: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `products/${slug}/${timestamp}-${safeName}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    task.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(pct));
      },
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

/**
 * Extract the storage path from a Firebase Storage download URL and delete the file.
 * Only attempts deletion for URLs hosted on firebasestorage.googleapis.com.
 * Silently ignores errors (file may already be gone).
 */
export async function deleteProductImage(url: string): Promise<void> {
  if (!url || !url.includes("firebasestorage.googleapis.com")) return;
  try {
    const match = url.match(/\/o\/(.+?)(?:\?|$)/);
    if (!match) return;
    const path = decodeURIComponent(match[1]);
    await deleteObject(ref(storage, path));
  } catch {
    // Best-effort — don't throw if already deleted or missing
  }
}
