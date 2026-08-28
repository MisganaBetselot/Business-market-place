import api from "./client";

/**
 * Listings API. All requests hit the real Django endpoints under /api/listings/.
 */

export function getListings() {
  return api.get("/listings/").then((r) => r.data);
}

export function getListing(id) {
  return api.get(`/listings/${id}/`).then((r) => r.data);
}

export function createListing(payload) {
  return api.post("/listings/", payload).then((r) => r.data);
}
