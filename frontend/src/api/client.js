import axios from "axios";

// Point this at the Django backend. Set VITE_API_BASE_URL in a .env file
// (see .env.example) so each teammate can run against their own local API.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: BASE_URL,
});

const ACCESS_KEY = "bm_access_token";
const REFRESH_KEY = "bm_refresh_token";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, try exactly one silent refresh before giving up and logging out.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    const refresh = tokenStorage.getRefresh();
    if (!refresh) return Promise.reject(error);

    original._retry = true;
    try {
      refreshPromise =
        refreshPromise ||
        axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
      const { data } = await refreshPromise;
      refreshPromise = null;
      tokenStorage.set(data.access, refresh);
      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch (refreshError) {
      refreshPromise = null;
      tokenStorage.clear();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);

export default api;
