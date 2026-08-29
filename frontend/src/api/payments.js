import axios from "axios";

/**
 * API client for the `payments` app (payment receipts).
 *
 * Backend contract (per Business Marketplace backend progress report):
 * - A receipt belongs to a user and a seller_subscription.
 * - Fields: file, review_status, reviewer, reviewed_at, rejection_reason,
 *   seller_subscription, created_at.
 * - review_status: "PENDING" | "APPROVED" | "REJECTED"
 * - Approving a receipt (admin-only) flips the linked seller_subscription
 *   to ACTIVE and stamps start/expiry dates.
 * - Auth: JWT via `Authorization: Bearer <token>` header.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const client = axios.create({
  baseURL: BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Upload a payment receipt for a given seller subscription.
 * @param {string} sellerSubscriptionId - UUID of the seller_subscription
 * @param {File} file - the receipt file (JPG, PNG or PDF, max 5MB)
 * @param {(percent: number) => void} [onProgress] - optional upload progress callback
 * @returns {Promise<object>} the created receipt
 */
export async function uploadPaymentReceipt(sellerSubscriptionId, file, onProgress) {
  const formData = new FormData();
  formData.append("seller_subscription", sellerSubscriptionId);
  formData.append("file", file);

  const { data } = await client.post("/payments/receipts/", formData, {
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
 * most recent first.
 * @param {string} sellerSubscriptionId
 * @returns {Promise<object[]>}
 */
export async function getReceiptsForSubscription(sellerSubscriptionId) {
  const { data } = await client.get("/payments/receipts/", {
    params: { seller_subscription: sellerSubscriptionId },
  });
  return data;
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

/**
 * Fetch a single receipt by id.
 * @param {string} receiptId
 * @returns {Promise<object>}
 */
export async function getReceiptById(receiptId) {
  const { data } = await client.get(`/payments/receipts/${receiptId}/`);
  return data;
}

export default client;