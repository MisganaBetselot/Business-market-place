import { api } from "./client";

/**
 * API client for the `subscriptions` app (subscription plan catalog —
 * read-only list of plans, distinct from `seller_subscriptions`, which
 * is a specific user's subscription to one of these plans).
 *
 * Uses the shared `api` instance from client.js (the same one auth.js
 * uses) rather than creating its own separate axios client. This means
 * it automatically inherits:
 *   - the correct base URL (with a safe absolute fallback, unlike this
 *     file's old relative "/api" fallback, which silently resolved
 *     against the frontend's own port instead of the Django backend)
 *   - the Authorization header attached via request interceptor
 *   - the one-shot silent token refresh on 401 responses
 *
 * CONFIRMED against Business_Marketplace_Integration_Report.md (live curl
 * testing, Sept 2 2026):
 * - Correct path: GET /subscriptions/ (NOT /subscriptions/plans/)
 *
 * Returns the RAW backend shape, unmodified — PaymentInstructions.jsx and
 * ReceiptUpload.jsx already read raw plan fields directly (media_type,
 * duration / duration_days / duration_label, price). Don't normalize here.
 */

/**
 * Fetch the list of available subscription plans.
 * May come back as a plain array or a paginated { results: [...] }
 * object — handle both the way PaymentInstructions.jsx already does:
 * const list = Array.isArray(data) ? data : data.results ?? [];
 * @returns {Promise<object[] | { results: object[] }>}
 */
export async function getSubscriptionPlans() {
  const { data } = await api.get("/subscriptions/");
  return data;
}

/**
 * Fetch a single subscription plan by id, raw shape.
 * @param {string} planId
 * @returns {Promise<object>}
 */
export async function getSubscriptionPlanById(planId) {
  const { data } = await api.get(`/subscriptions/${planId}/`);
  return data;
}