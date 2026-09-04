import axios from "axios";

/**
 * API client for the `payments` app (payment receipts).
 *
 * CONFIRMED against Business_Marketplace_Integration_Report.md (live curl
 * testing, Sept 2 2026) — do not "fix" these back to /payments/receipts/:
 * - Create/list:  POST/GET /payments/   (NOT /payments/receipts/)
 * - Filter param: ?subscription=<id>    (NOT ?seller_subscription=<id>)
 * - No detail route exists (GET /payments/{id}/ is a 404) — don't add one
 *   back until the backend actually has it.
 *
 * Backend contract (per backend progress report):
 * - Fields: file, review_status, reviewer, reviewed_at, rejection_reason,
 *   subscription, created_at.
 * - review_status: "PENDING" | "APPROVED" | "REJECTED"
 * - Approving a receipt (admin-only) flips the linked subscription to
 *   ACTIVE and stamps start/expiry dates.
 * - Auth: JWT via `Authorization: Bearer <token>` header.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const client = axios.create({
  baseURL: BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("bm_access_token");
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
  return config;
});

/**
 * Upload a payment receipt for a given seller subscription.
 * @param {string} sellerSubscriptionId - id of the subscription
 * @param {File} file - the receipt file (JPG, PNG or PDF, max 5MB)
 * @param {(percent: number) => void} [onProgress] - optional upload progress callback
 * @returns {Promise<object>} the created receipt
 */
export async function uploadPaymentReceipt(sellerSubscriptionId, file, onProgress) {
  const formData = new FormData();
  formData.append("subscription", sellerSubscriptionId);
 formData.append("receipt_file", file);

  const { data } = await client.post("/payments/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });

  return data;
}

/**
 * Fetch all receipts submitted for a given seller subscription,
 * most recent first. Handles both plain-array and paginated
 * ({ results: [...] }) responses.
 * @param {string} sellerSubscriptionId
 * @returns {Promise<object[]>}
 */
export async function getReceiptsForSubscription(sellerSubscriptionId) {
  const { data } = await client.get("/payments/", {
    params: { subscription: sellerSubscriptionId },
  });
  return Array.isArray(data) ? data : data.results ?? [];
}

/**
 * Convenience helper: fetch just the latest receipt for a seller
 * subscription, or null if none exists yet.
 * @param {string} sellerSubscriptionId
 * @returns {Promise<object|null>}
 */
export async function getLatestReceipt(sellerSubscriptionId) {
  const receipts = await getReceiptsForSubscription(sellerSubscriptionId);
  if (!receipts || receipts.length === 0) return null;

  return [...receipts].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )[0];
}

// NOTE: there is deliberately no getReceiptById() here — the report
// confirmed GET /payments/{id}/ doesn't exist on the backend. Use
// getLatestReceipt()/getReceiptsForSubscription() instead, or ask
// backend to add a detail route if you need one.

export default client;