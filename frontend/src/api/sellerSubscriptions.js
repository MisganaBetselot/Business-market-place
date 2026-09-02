// Owner: muni

import axiosClient from "./axiosClient";

export const getMySubscriptions = async () => {
  const response = await axiosClient.get("/seller-subscriptions/mine/");
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

export const renewSubscription = async (subscriptionId) => {
  const response = await axiosClient.post(
    `/seller-subscriptions/${subscriptionId}/renew/`
  );

  return response.data;
};