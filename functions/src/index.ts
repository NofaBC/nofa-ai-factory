import * as admin from "firebase-admin";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();

// Store the revalidation secret as a Firebase secret (not env var)
const revalidateSecret = defineSecret("REVALIDATE_SECRET");

/**
 * Fires whenever a product document is created, updated, or deleted.
 * Calls the NOFA AI Factory /api/revalidate endpoint to clear the
 * "products" cache tag so JudyVA gets fresh data on its next API call.
 */
export const revalidateOnProductWrite = onDocumentWritten(
  {
    document: "products/{productId}",
    secrets: [revalidateSecret],
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    // Skip if nothing meaningful changed (avoid unnecessary revalidations)
    const beforePublished = before?.published ?? false;
    const afterPublished = after?.published ?? false;
    const wasDelete = !after;
    const wasCreate = !before;
    const statusChanged = before?.status !== after?.status;
    const contentChanged =
      before?.name !== after?.name ||
      before?.shortDescription !== after?.shortDescription ||
      before?.description !== after?.description;

    const shouldRevalidate =
      wasCreate ||
      wasDelete ||
      beforePublished !== afterPublished ||
      statusChanged ||
      contentChanged;

    if (!shouldRevalidate) {
      console.log(`Product ${event.params.productId}: no meaningful change, skipping revalidate`);
      return;
    }

    const secret = revalidateSecret.value();
    const url = "https://nofaaifactory.com/api/revalidate";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": secret,
        },
      });

      const body = await res.json();
      if (res.ok) {
        console.log(`Revalidated products cache after write to ${event.params.productId}:`, body);
      } else {
        console.error(`Revalidation failed (${res.status}):`, body);
      }
    } catch (err) {
      console.error("Failed to call revalidate endpoint:", err);
    }
  }
);
