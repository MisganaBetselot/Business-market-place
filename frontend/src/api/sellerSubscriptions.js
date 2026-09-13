// Owner: muni

import api from "./client";

// Confirmed real path: GET /seller-subscriptions/ — backend filters to
// the logged-in user automatically. There is NO /mine/ suffix.
// (This has reverted to the wrong URL at least once before — if it
// breaks again, check whether another tool/session is editing this
// file independently.)
export const getMySubscriptions = async () => {
  const response = await api.get("/seller-subscriptions/");
  return response.data;
};

// Now requires a listingId too, since the backend's SellerSubscription
// model has a required "listing" FK as of today's migration.
export const createSellerSubscription = async (planId, listingId) => {
  const response = await api.post("/seller-subscriptions/", {
    plan: planId,
    listing: listingId,
  });

  return response.data;
};

// Switch a still-PENDING subscription over to a different plan. Backend
// rejects this once the subscription is no longer PENDING (see
// SellerSubscriptionDetailView.perform_update).
export const updateSellerSubscriptionPlan = async (subscriptionId, planId) => {
  const response = await api.patch(`/seller-subscriptions/${subscriptionId}/`, {
    plan: planId,
  });

  return response.data;
};

// NO renew endpoint exists on the backend yet (confirmed against the real
// seller_subscriptions/urls.py — only "" and "<int:pk>/" are registered).
// Throwing here on purpose instead of silently 404ing.
export const renewSubscription = async () => {
  throw new Error(
    "renewSubscription() is not implemented — no /renew/ endpoint exists on the backend yet."
  );
};

// Alias for SubscriptionStatus.jsx
export { getMySubscriptions as getMySellerSubscriptions };