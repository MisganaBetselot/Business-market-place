import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

// Confirmed real key: "bm_access_token" (matches payments.js — see
// api/listings.js for a third, now-outdated variant that also needs
// updating to match).
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("bm_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;