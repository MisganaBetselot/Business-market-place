import api from "./client";

/**
 * Auth endpoints. These match the Django backend under /api/users/.
 */

export function login({ email, password }) {
  return api.post("/users/login/", { email, password }).then((r) => r.data);
}

export function register(payload) {
  // payload: { first_name, last_name, email, phone, password }
  return api.post("/users/register/", payload).then((r) => r.data);
}

export function refreshToken(refresh) {
  return api.post("/users/token/refresh/", { refresh }).then((r) => r.data);
}

export function requestPasswordReset(email) {
  return api.post("/users/password-reset/", { email }).then((r) => r.data);
}

export function confirmPasswordReset({ uid, token, password }) {
  return api
    .post("/users/password-reset/confirm/", { uid, token, password })
    .then((r) => r.data);
}

/**
 * NOT LIVE YET. There's no /users/google/ endpoint on the backend, and no
 * Google Cloud OAuth client configured for this app, so this call will
 * 404 until both of those exist. The shape here (send the Google ID
 * token, get back our own access/refresh pair) matches how the rest of
 * this file talks to the backend, so whoever adds the endpoint just
 * needs to verify the token server-side and return the same
 * { access, refresh } shape as login().
 */
export function loginWithGoogle(googleIdToken) {
  return api.post("/users/google/", { id_token: googleIdToken }).then((r) => r.data);
}
