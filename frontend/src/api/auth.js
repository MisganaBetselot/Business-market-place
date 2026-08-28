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
