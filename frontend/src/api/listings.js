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

/**
 * Fetch listings the current user has saved/favorited.
 * @returns {Promise<object[]>}
 */
export async function getSavedListings() {
  const data = await api.get("/listings/saved/").then((r) => r.data);
  const list = Array.isArray(data) ? data : data.results || [];
  return list.map(normalizeListing);
}

/**
 * Save (favorite) a listing for the current user.
 * @param {string} listingId
 */
export function saveListing(listingId) {
  return api.post(`/listings/${listingId}/save/`).then((r) => r.data);
}

/**
 * Remove a listing from the current user's saved list.
 * @param {string} listingId
 */
export function unsaveListing(listingId) {
  return api.delete(`/listings/${listingId}/save/`).then((r) => r.data);
}

/**
 * Fetch a single listing by id, normalized (e.g. for a details page).
 * @param {string} listingId
 */
export async function getListingById(listingId) {
  const data = await api.get(`/listings/${listingId}/`).then((r) => r.data);
  return normalizeListing(data);
}

// Keep shape-normalization in one place so the rest of the app can rely
// on a consistent object regardless of small backend response differences.
function normalizeListing(raw) {
  return {
    id: raw.id,
    name: raw.business_name || raw.name,
    category: raw.category,
    location: raw.location,
    askingPrice: raw.asking_price_display || raw.asking_price,
    coverImageUrl: raw.cover_image_url || raw.image || null,
    badge: raw.badge || null,
  };
}