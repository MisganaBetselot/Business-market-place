import axios from "axios";

/**
 * API client for the `listings` app (business listings + saved/favorites).
 *
 * ASSUMPTION (confirm/adjust field names to match your actual backend):
 * - A listing has: id, business_name, category, location, asking_price,
 *   cover_image_url, badge ("VERIFIED" | "HOT" | "NEW" | null).
 * - Saved/favorite listings are per-user, via a "saved listings" endpoint.
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
 * Fetch listings the current user has saved/favorited.
 * @returns {Promise<object[]>}
 */
export async function getSavedListings() {
  const { data } = await client.get("/listings/saved/");
  const list = Array.isArray(data) ? data : data.results || [];
  return list.map(normalizeListing);
}

/**
 * Save (favorite) a listing for the current user.
 * @param {string} listingId
 * @returns {Promise<void>}
 */
export async function saveListing(listingId) {
  await client.post(`/listings/${listingId}/save/`);
}

/**
 * Remove a listing from the current user's saved list.
 * @param {string} listingId
 * @returns {Promise<void>}
 */
export async function unsaveListing(listingId) {
  await client.delete(`/listings/${listingId}/save/`);
}

/**
 * Fetch a single listing by id (e.g. for a details page).
 * @param {string} listingId
 * @returns {Promise<object>}
 */
export async function getListingById(listingId) {
  const { data } = await client.get(`/listings/${listingId}/`);
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

export default client;