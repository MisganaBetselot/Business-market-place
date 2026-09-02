import axios from "axios";

/**
 * API client for the `subscriptions` app (subscription plan catalog —
 * read-only list of plans, distinct from `seller_subscriptions`, which
 * is a specific user's subscription to one of these plans).
 *
 * CONFIRMED against Business_Marketplace_Integration_Report.md (live curl
 * testing, Sept 2 2026):
 * - Correct path: GET /subscriptions/   (NOT /subscriptions/plans/)
 *
 * Returns the RAW backend shape, unmodified — PaymentInstructions.jsx and
 * ReceiptUpload.jsx already read raw plan fields directly (media_type,
 * duration / duration_days / duration_label, price). Don't normalize here.
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
 * Fetch the list of available subscription plans.
 * May come back as a plain array or a paginated { results: [...] }
 * object — handle both the way PaymentInstructions.jsx already does:
 *   const list = Array.isArray(data) ? data : data.results ?? [];
 * @returns {Promise<object[] | { results: object[] }>}
 */
export async function getSubscriptionPlans() {
  const { data } = await client.get("/subscriptions/");
  return data;
}

/**
 * Fetch a single subscription plan by id, raw shape.
 * @param {string} planId
 * @returns {Promise<object>}
 */
export async function getSubscriptionPlanById(planId) {
  const { data } = await client.get(`/subscriptions/${planId}/`);
  return data;
}

export default client;