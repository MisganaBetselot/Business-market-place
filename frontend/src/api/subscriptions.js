import api from "./client";

/**
 * Subscription plans API. Public read-only endpoint under /api/subscriptions/.
 */

export function getPlans() {
  return api.get("/subscriptions/").then((r) => r.data);
}
