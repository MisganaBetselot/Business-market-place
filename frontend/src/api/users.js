import api from "./client";

/** Current logged-in user (drives AuthContext + Profile page). */
export function getMe() {
  return api.get("/users/me/").then((r) => r.data);
}

/** Partial update — full_name, bio, phone_contact, whatsapp_contact, etc. */
export function updateMe(payload) {
  return api.patch("/users/me/", payload).then((r) => r.data);
}
