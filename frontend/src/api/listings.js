import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const client = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT access token to requests
client.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("bm_access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Get all business listings
 */
export async function getListings() {
  const { data } = await client.get("/listings/");

  return Array.isArray(data) ? data : data.results ?? [];
}

/**
 * Get a single business listing
 */
export async function getListing(id) {
  const { data } = await client.get(`/listings/${id}/`);

  return data;
}

/**
 * Alias for pages that use the longer name.
 */
export async function getListingById(id) {
  return getListing(id);
}

/**
 * Create a business listing
 */
export async function createListing(payload) {
  const { data } = await client.post("/listings/", payload);

  return data;
}

/**
 * Get the current user's saved/favorite listings.
 *
 * NOTE:
 * This endpoint depends on the backend favorites implementation.
 */
export async function getSavedListings() {
  const { data } = await client.get("/listings/saved/");

  return Array.isArray(data) ? data : data.results ?? [];
}

/**
 * Save/favorite a listing.
 */
export async function saveListing(listingId) {
  const { data } = await client.post(
    `/listings/${listingId}/save/`
  );

  return data;
}

/**
 * Remove a listing from favorites.
 */
export async function unsaveListing(listingId) {
  const { data } = await client.delete(
    `/listings/${listingId}/save/`
  );

  return data;
}

export default client;