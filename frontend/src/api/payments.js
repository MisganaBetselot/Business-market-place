import api from "./client";

/**
 * Payments API. Authenticated endpoints under /api/payments/.
 */

export function getPayments() {
  return api.get("/payments/").then((r) => r.data);
}

export function createPayment(payload) {
  return api.post("/payments/", payload).then((r) => r.data);
}
