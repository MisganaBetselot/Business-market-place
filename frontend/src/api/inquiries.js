import api from "./client";

/**
 * Inquiries API. Authenticated endpoints under /api/inquiries/.
 * An inquiry is a buyer's message to a seller about a specific listing.
 */

export function getInquiries(role) {
  return api.get("/inquiries/", { params: role ? { role } : {} }).then((r) => r.data);
}

export function createInquiry(payload) {
  return api.post("/inquiries/", payload).then((r) => r.data);
}

export function markInquiryRead(id) {
  return api.post(`/inquiries/${id}/read/`).then((r) => r.data);
}

/** Full thread (opening message + every reply) for one inquiry. */
export function getInquiryThread(id) {
  return api.get(`/inquiries/${id}/messages/`).then((r) => r.data);
}

/** Send a reply in an existing inquiry thread (either buyer or seller). */
export function sendInquiryReply(id, message) {
  return api.post(`/inquiries/${id}/messages/`, { message }).then((r) => r.data);
}
