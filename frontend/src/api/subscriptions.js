// Owner: muni

import axiosClient from "./axiosClient";

export const getSubscriptionPlans = async () => {
  const response = await axiosClient.get("/subscriptions/plans/");
  return response.data;
};