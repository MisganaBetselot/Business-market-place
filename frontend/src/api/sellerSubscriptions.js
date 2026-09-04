// Owner: muni

import axiosClient from "./axiosClient";

// Confirmed real path: GET /seller-subscriptions/ — backend filters to
// the logged-in user automatically. There is NO /mine/ suffix.
export const getMySubscriptions = async () => {
  const response = await axiosClient.get("/seller-subscriptions/");
  return response.data;
};

// Alias for pages that use the longer name
export const getMySellerSubscriptions = getMySubscriptions;

export const createSellerSubscription = async (planId) => {
  const response = await axiosClient.post("/seller-subscriptions/", {
    plan: planId,
  });

  return response.data;
};

// NO renew endpoint exists on the backend yet (confirmed against the real
// seller_subscriptions/urls.py — only "" and "<int:pk>/" are registered).
// Throwing here on purpose instead of silently 404ing, so any caller finds
// out immediately rather than chasing another mystery network error.
// Replace this once/if the backend adds a real renew route.
export const renewSubscription = async () => {
  throw new Error(
    "renewSubscription() is not implemented — no /renew/ endpoint exists on the backend yet."
  );
};