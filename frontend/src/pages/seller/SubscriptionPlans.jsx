import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getSubscriptionPlans } from "../../api/subscriptions";
import {
  getMySubscriptions,
  createSellerSubscription,
} from "../../api/sellerSubscriptions";

const STATUS_COPY = {
  PENDING: {
    label: "Payment under review",
    body: "We're checking your receipt. This usually takes less than a day.",
  },
  ACTIVE: {
    label: "Your plan is active",
    body: "You're all set — head to media upload to add photos or videos.",
  },
  EXPIRED: {
    label: "Your plan has expired",
    body: "Renew a plan below to keep uploading and showing media.",
  },
  REJECTED: {
    label: "Your last payment was rejected",
    body: "Pick a plan below and submit a new receipt to try again.",
  },
  CANCELLED: {
    label: "Your plan was cancelled",
    body: "Choose a plan below whenever you're ready to reactivate.",
  },
};
const MOCK_PLANS = [
  {
    id: "mock-photo-1",
    media_type: "PHOTO",
    duration_days: 30,
    duration_label: "1 Month",
    price: 500,
    description: "Upload photos to your business listing.",
    features: ["Photo uploads included"],
    is_popular: true,
  },
  {
    id: "mock-photo-2",
    media_type: "PHOTO",
    duration_days: 90,
    duration_label: "3 Months",
    price: 1200,
    description: "Keep your business photos active for longer.",
    features: ["Photo uploads included"],
    is_popular: false,
  },
  {
    id: "mock-video-1",
    media_type: "VIDEO",
    duration_days: 30,
    duration_label: "1 Month",
    price: 800,
    description: "Upload videos to your business listing.",
    features: ["Video uploads included"],
    is_popular: true,
  },
  {
    id: "mock-video-2",
    media_type: "VIDEO",
    duration_days: 90,
    duration_label: "3 Months",
    price: 2000,
    description: "Keep your business videos active for longer.",
    features: ["Video uploads included"],
    is_popular: false,
  },
  {
  id: "mock-photo-3",
  media_type: "PHOTO",
  duration_days: 180,
  duration_label: "6 Months",
  price: 2200,
  description: "Long-term photo coverage for your business listing.",
  features: ["Photo uploads included"],
  is_popular: false,
},
{
  id: "mock-video-3",
  media_type: "VIDEO",
  duration_days: 180,
  duration_label: "6 Months",
  price: 3800,
  description: "Long-term video coverage for your business listing.",
  features: ["Video uploads included"],
  is_popular: false,
},
];

function formatDuration(days) {
  if (!days) return "";

  if (days % 30 === 0) {
    const months = days / 30;

    return `${months} Month${months > 1 ? "s" : ""}`;
  }

  return `${days} Days`;
}

function CameraIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 8a2 2 0 0 1 2-2h1.2a1 1 0 0 0 .86-.5l.68-1.14A1 1 0 0 1 9.6 4h4.8a1 1 0 0 1 .86.36l.68 1.14a1 1 0 0 0 .86.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="12"
        cy="13"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function VideoIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="3"
        y="6"
        width="13"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m16 10.5 4.2-2.6a.8.8 0 0 1 1.2.68v6.84a.8.8 0 0 1-1.2.68L16 13.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="m4 10 4 4 8-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlanCard({ plan, selected, onSelect }) {
  const durationLabel =
    plan.duration_label ??
    formatDuration(plan.duration ?? plan.duration_days);

  const Icon =
    plan.media_type === "VIDEO"
      ? VideoIcon
      : CameraIcon;

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-white p-6 transition ${
        selected
          ? "border-primary shadow-md ring-1 ring-primary"
          : "border-primary-light/30 hover:border-primary-light"
      }`}
    >
      {plan.is_popular && (
        <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-cream shadow-sm">
          Most Chosen
        </span>
      )}

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light/15 text-primary-dark">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-charcoal/50">
            {plan.media_type === "VIDEO"
              ? "Video Plan"
              : "Photo Plan"}
          </p>

          <p className="font-serif text-xl font-semibold text-charcoal">
            {durationLabel}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <span className="font-sans text-2xl font-bold text-primary-dark">
          ETB {Number(plan.price).toLocaleString()}
        </span>

        <p className="mt-0.5 font-sans text-xs text-charcoal/50">
          Billed once for {durationLabel}
        </p>
      </div>

      {plan.description && (
        <p className="mt-3 font-sans text-sm text-charcoal/70">
          {plan.description}
        </p>
      )}

      {Array.isArray(plan.features) &&
        plan.features.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-full bg-cream px-4 py-2">
            <CheckIcon className="h-4 w-4 shrink-0 text-primary-dark" />

            <span className="font-sans text-sm text-charcoal/80">
              {plan.features[0]}
            </span>
          </div>
        )}

      <button
        type="button"
        onClick={() => onSelect(plan)}
        className={`mt-6 w-full rounded-full py-2.5 font-sans text-sm font-semibold transition ${
          selected
            ? "bg-primary text-cream"
            : "border border-primary-light/50 text-primary-dark hover:bg-primary-light/10"
        }`}
      >
        {selected ? "Selected ✓" : "Select Plan"}
      </button>
    </div>
  );
}

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mediaTab, setMediaTab] = useState("PHOTO");
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Get available subscription plans
  const {
  data: plansData,
  isLoading: plansLoading,
  isError: plansError,
} = useQuery({
  queryKey: ["subscriptionPlans"],
  queryFn: async () => {
    try {
      return await getSubscriptionPlans();
    } catch {
      return MOCK_PLANS;
    }
  },
});

  // Get user's existing subscriptions
  const {
    data: subscriptionsData,
    isLoading: subLoading,
  } = useQuery({
    queryKey: ["mySubscriptions"],
    queryFn: getMySubscriptions,
    retry: false,
  });

  // Handle different possible API response formats
  const plans = Array.isArray(plansData)
    ? plansData
    : plansData?.results ?? [];

  const subscriptions = Array.isArray(subscriptionsData)
    ? subscriptionsData
    : subscriptionsData?.results ?? [];

  // Find subscription for the currently selected media type
 // Find subscription for the currently selected media type
const currentSubscription = subscriptions.find((subscription) => {
  const subscriptionMediaType =
    subscription.media_type ??
    subscription.plan?.media_type;

  return subscriptionMediaType === mediaTab;
});

  const status = currentSubscription?.status;

  const blockingStatus =
    status === "PENDING" ||
    status === "ACTIVE";

  // Create subscription when seller clicks Continue to Payment
  const {
    mutate: confirmPlan,
    isPending: subscribing,
    isError: subscriptionError,
  } = useMutation({
    mutationFn: (planId) =>
      createSellerSubscription(planId),

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["mySubscriptions"],
      });

      /*
        Pass selected plan + created subscription
        to Payment Instructions page.
      */
      navigate("/sell/payment-instructions", {
        state: {
          selectedPlan,
          subscription: data,
        },
      });
    },
  });

  const visiblePlans = useMemo(() => {
    return plans.filter(
      (plan) => plan.media_type === mediaTab
    );
  }, [plans, mediaTab]);

  const handleSelectTab = (tab) => {
    setMediaTab(tab);
    setSelectedPlan(null);
  };

 const handleContinueToPayment = () => {
  if (!selectedPlan) return;

  const isMockPlan =
    typeof selectedPlan.id === "string" &&
    selectedPlan.id.startsWith("mock-");

  if (isMockPlan) {
    navigate("/sell/payment-instructions", {
      state: {
        selectedPlan,
      },
    });
    return;
  }

  confirmPlan(selectedPlan.id);
};

  return (
    <div className="min-h-screen bg-cream pb-28">
      <div className="mx-auto max-w-5xl px-6 py-12">

        <h1 className="font-serif text-4xl font-bold text-charcoal">
          Choose a Media Plan
        </h1>

        <p className="mt-3 max-w-2xl font-sans text-charcoal/70">
          Select a plan to activate photo or video uploads
          for your business listing. Photo and video
          subscriptions are purchased separately and can
          expire on different dates.
        </p>

        {!subLoading &&
          status &&
          STATUS_COPY[status] && (
            <div className="mt-6 max-w-xl rounded-lg border border-primary-light/40 bg-white/70 p-5">

              <p className="font-sans text-sm font-semibold text-primary-dark">
                {STATUS_COPY[status].label}
              </p>

              <p className="mt-1 font-sans text-sm text-charcoal/70">
                {STATUS_COPY[status].body}
              </p>

              {blockingStatus && (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/sell/subscription-status")
                  }
                  className="mt-3 font-sans text-sm font-medium text-primary underline underline-offset-2 hover:text-primary-dark"
                >
                  View subscription status
                </button>
              )}

            </div>
          )}

        {/* PHOTO / VIDEO TABS */}

        <div className="mt-8 inline-flex rounded-full border border-primary-light/40 bg-white p-1">

          <button
            type="button"
            onClick={() =>
              handleSelectTab("PHOTO")
            }
            className={`flex items-center gap-2 rounded-full px-5 py-2 font-sans text-sm font-semibold transition ${
              mediaTab === "PHOTO"
                ? "bg-primary text-cream"
                : "text-primary-dark hover:bg-primary-light/10"
            }`}
          >
            <CameraIcon className="h-4 w-4" />
            Photo Plans
          </button>

          <button
            type="button"
            onClick={() =>
              handleSelectTab("VIDEO")
            }
            className={`flex items-center gap-2 rounded-full px-5 py-2 font-sans text-sm font-semibold transition ${
              mediaTab === "VIDEO"
                ? "bg-primary text-cream"
                : "text-primary-dark hover:bg-primary-light/10"
            }`}
          >
            <VideoIcon className="h-4 w-4" />
            Video Plans
          </button>

        </div>

        {plansLoading && (
          <p className="mt-10 font-sans text-charcoal/60">
            Loading plans...
          </p>
        )}

        {plansError && (
          <p className="mt-10 font-sans text-sm text-red-700">
            Couldn't load subscription plans.
            Please refresh the page.
          </p>
        )}

        {!plansLoading &&
          !plansError && (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {visiblePlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={
                    selectedPlan?.id === plan.id
                  }
                  onSelect={setSelectedPlan}
                />
              ))}

              {visiblePlans.length === 0 && (
                <p className="font-sans text-sm text-charcoal/50">
                  No{" "}
                  {mediaTab === "VIDEO"
                    ? "video"
                    : "photo"}{" "}
                  plans available right now.
                </p>
              )}

            </div>
          )}

        {subscriptionError && (
          <p className="mt-6 font-sans text-sm text-red-700">
            Something went wrong while creating your
            subscription. Please try again.
          </p>
        )}

      </div>

      {/* BOTTOM SELECTED PLAN BAR */}

      {selectedPlan && (
        <div className="fixed inset-x-0 bottom-0 border-t border-primary-light/30 bg-white/95 px-6 py-4 backdrop-blur">

          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">

            <div>
              <p className="font-sans text-sm font-medium text-charcoal">

                Selected:{" "}

                {selectedPlan.media_type === "VIDEO"
                  ? "Video"
                  : "Photo"}{" "}

                plan ·{" "}

                {selectedPlan.duration_label ??
                  formatDuration(
                    selectedPlan.duration ??
                    selectedPlan.duration_days
                  )}{" "}

                · ETB{" "}

                {Number(
                  selectedPlan.price
                ).toLocaleString()}

              </p>

              <p className="font-sans text-xs text-charcoal/50">
                Payment is completed outside the platform.
              </p>
            </div>

            <button
              type="button"
              onClick={handleContinueToPayment}
              disabled={
                subscribing ||
                blockingStatus
              }
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-sans text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {subscribing
                ? "Processing..."
                : "Continue to Payment"}

              <span aria-hidden="true">
                →
              </span>
            </button>

          </div>

        </div>
      )}
    </div>
  );
}