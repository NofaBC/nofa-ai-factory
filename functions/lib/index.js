"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.revalidateOnProductWrite = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
// Store the revalidation secret as a Firebase secret (not env var)
const revalidateSecret = (0, params_1.defineSecret)("REVALIDATE_SECRET");
/**
 * Fires whenever a product document is created, updated, or deleted.
 * Calls the NOFA AI Factory /api/revalidate endpoint to clear the
 * "products" cache tag so JudyVA gets fresh data on its next API call.
 */
exports.revalidateOnProductWrite = (0, firestore_1.onDocumentWritten)({
    document: "products/{productId}",
    secrets: [revalidateSecret],
}, async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    // Skip if nothing meaningful changed (avoid unnecessary revalidations)
    const beforePublished = before?.published ?? false;
    const afterPublished = after?.published ?? false;
    const wasDelete = !after;
    const wasCreate = !before;
    const statusChanged = before?.status !== after?.status;
    const contentChanged = before?.name !== after?.name ||
        before?.shortDescription !== after?.shortDescription ||
        before?.description !== after?.description;
    const shouldRevalidate = wasCreate ||
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
        }
        else {
            console.error(`Revalidation failed (${res.status}):`, body);
        }
    }
    catch (err) {
        console.error("Failed to call revalidate endpoint:", err);
    }
});
//# sourceMappingURL=index.js.map