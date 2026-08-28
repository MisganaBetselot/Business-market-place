import api from "./client";

/**
 * Categories API. Public read-only endpoint under /api/categories/.
 */

export function getCategories() {
  return api.get("/categories/").then((r) => r.data);
}
