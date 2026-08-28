import api from "./client";

/**
 * Seller subscriptions API. Authenticated endpoints under /api/seller-subscriptions/.
 */

export function getSubscriptions() {
  return api.get("/seller-subscriptions/").then((r) => r.data);
}

export function createSubscription(payload) {
  return api.post("/seller-subscriptions/", payload).then((r) => r.data);
}

export function getSubscription(id) {
  return api.get(`/seller-subscriptions/${id}/`).then((r) => r.data);
}
