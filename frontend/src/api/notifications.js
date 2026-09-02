import api from "./client";

/**
 * Notifications API. Authenticated endpoints under /api/notifications/.
 */

export function getNotifications() {
  return api.get("/notifications/").then((r) => r.data);
}

export function markNotificationRead(id) {
  return api.post(`/notifications/${id}/read/`).then((r) => r.data);
}
