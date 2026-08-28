import api from "./client";

/**
 * Auth endpoints. Paths below are best guesses based on standard
 * SimpleJWT conventions — confirm exact paths/payload shapes with
 * the backend dev before relying on these, especially reset-password
 * (not yet documented in the backend progress report).
 */

export function login({ email, password }) {
  return api.post("/auth/login/", { email, password }).then((r) => r.data);
}

export function register(payload) {
  // payload: { full_name, email, phone, password }
  return api.post("/auth/register/", payload).then((r) => r.data);
}

export function refreshToken(refresh) {
  return api.post("/auth/token/refresh/", { refresh }).then((r) => r.data);
}

export function requestPasswordReset(email) {
  return api.post("/auth/password-reset/", { email }).then((r) => r.data);
}

export function confirmPasswordReset({ uid, token, password }) {
  return api
    .post("/auth/password-reset/confirm/", { uid, token, password })
    .then((r) => r.data);
}
