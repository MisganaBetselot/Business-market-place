import api from "./client";

/**
 * Inquiries API. Authenticated endpoints under /api/inquiries/.
 * An inquiry is a buyer's message to a seller about a specific listing.
 */

export function getInquiries() {
  return api.get("/inquiries/").then((r) => r.data);
}

export function createInquiry(payload) {
  return api.post("/inquiries/", payload).then((r) => r.data);
}

export function markInquiryRead(id) {
  return api.post(`/inquiries/${id}/read/`).then((r) => r.data);
}
