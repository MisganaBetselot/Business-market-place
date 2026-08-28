import api from "./client";

/**
 * Media API. Authenticated endpoints under /api/media/.
 */

export function getMedia() {
  return api.get("/media/").then((r) => r.data);
}

export function createMedia(payload) {
  return api.post("/media/", payload).then((r) => r.data);
}
