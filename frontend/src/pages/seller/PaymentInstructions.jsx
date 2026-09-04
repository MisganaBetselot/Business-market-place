
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMySubscriptions } from "../../api/sellerSubscriptions";

// Temporary payment information.
// Replace with real business payment details when real payment
// information is available.
const DEMO_PAYMENT_INFO = {
  bankName: "Commercial Bank of Ethiopia (Demo)",
  accountName: "Business Marketplace PLC (Demo)",
  accountNumber: "1000 2345 6789 01",
};

function formatDuration(days) {
  if (!days) return "";

  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} Month${months > 1 ? "s" : ""}`;
  }

  return `${days} Days`;
}

function CopyIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M4.5 12.5H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h7A1.5 1.5 0 0 1 12.5 4v.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function InfoIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle
        cx="10"
        cy="10"
        r="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M10 9v4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <circle cx="10" cy="6.7" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ArrowLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M12.5 15 7 10l5.5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PaymentInstructions() {
  const navigate = useNavigate();
  const location = useLocation();

  const [copied, setCopied] = useState(false);

  // Data passed from BusinessInformation.jsx
  const selectedPlan = location.state?.selectedPlan;
  const listing = location.state?.listing;
  const listingId = location.state?.listingId || listing?.id;
  const subscriptionId = location.state?.subscriptionId;

  // Get the seller's subscriptions from the backend.
  // This is also useful if the page is refreshed and
  // React Router navigation state disappears.
  const {
    data: subscriptionsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["mySubscriptions"],
    queryFn: getMySubscriptions,
    retry: false,
  });

  // Handle both:
  // 1. Normal array response
  // 2. Paginated { results: [...] } response
  const subscriptions = Array.isArray(subscriptionsData)
    ? subscriptionsData
    : subscriptionsData?.results ?? [];

  /*
    Prefer the exact subscription passed from BusinessInformation.

    If the page was refreshed and subscriptionId is unavailable,
    fall back to the seller's latest PENDING subscription.
  */
  const selectedSubscription =
    subscriptions.find((item) => item.id === subscriptionId) ||
    subscriptions.find((item) => item.status === "PENDING");

  const fallbackPlan = selectedSubscription?.plan;

  // Prefer the plan selected on the previous page.
  const displayPlan = selectedPlan || fallbackPlan;

  // Keep the exact subscription ID whenever possible.
  const currentSubscriptionId =
    subscriptionId || selectedSubscription?.id;

  const durationLabel = displayPlan
    ? displayPlan.duration_label ??
      formatDuration(
        displayPlan.duration ?? displayPlan.duration_days
      )
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        DEMO_PAYMENT_INFO.accountNumber.replace(/\s/g, "")
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-3xl">

        {/* Page heading */}
        <h1 className="font-serif text-4xl font-bold text-charcoal">
          Payment Instructions
        </h1>

        <p className="mt-2 font-sans text-charcoal/70">
          Review your selected plan and complete the transfer using the
          account details below.
        </p>

        {/* Loading state */}
        {isLoading && !selectedPlan && (
          <p className="mt-10 font-sans text-charcoal/60">
            Loading your subscription...
          </p>
        )}

        {/* Error state */}
        {isError && !selectedPlan && (
          <p className="mt-10 font-sans text-sm text-red-700">
            Couldn't load your subscription. Please try again.
          </p>
        )}

        {/* No subscription found */}
        {!isLoading &&
          !isError &&
          !selectedPlan &&
          !selectedSubscription && (
            <div className="mt-8 rounded-xl bg-white p-6 text-center">
              <p className="font-sans text-sm text-charcoal/70">
                There's no pending subscription to pay for right now.
              </p>

              <button
                type="button"
                onClick={() => navigate("/sell/plans")}
                className="mt-3 font-sans text-sm font-medium text-primary underline underline-offset-2 hover:text-primary-dark"
              >
                Choose a plan
              </button>
            </div>
          )}

        {/* Plan and payment information */}
        {displayPlan && (
          <>
            {/* Selected plan */}
            <div className="mt-8 rounded-xl bg-white p-6">

              <p className="font-sans text-xs font-medium uppercase tracking-wide text-charcoal/50">
                Selected Plan
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                {/* Media type */}
                <div>
                  <p className="font-sans text-sm text-charcoal/50">
                    Media type
                  </p>

                  <p className="mt-1 font-serif text-lg font-semibold text-charcoal">
                    {displayPlan.media_type === "VIDEO"
                      ? "Video"
                      : "Photo"}
                  </p>
                </div>

                {/* Duration */}
                <div>
                  <p className="font-sans text-sm text-charcoal/50">
                    Duration
                  </p>

                  <p className="mt-1 font-serif text-lg font-semibold text-charcoal">
                    {durationLabel}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <p className="font-sans text-sm text-charcoal/50">
                    Price
                  </p>

                  <p className="mt-1 font-serif text-lg font-semibold text-primary-dark">
                    ETB {Number(displayPlan.price).toLocaleString()}
                  </p>
                </div>

              </div>
            </div>

            {/* Payment details */}
            <div className="mt-6 rounded-xl bg-white p-6">

              <h2 className="font-serif text-xl font-bold text-charcoal">
                How payment works
              </h2>

              <p className="mt-2 font-sans text-charcoal/70">
                Payment is completed outside the platform. Complete the
                payment using the provided account details, then upload your
                receipt for administrator verification.
              </p>

              {/* Payment information */}
              <div className="mt-6 rounded-lg bg-cream p-6">

                <p className="font-sans text-xs font-semibold uppercase tracking-wide text-primary-dark">
                  Payment Information
                </p>

                {/* Bank name */}
                <div className="mt-4">
                  <p className="font-sans text-sm text-charcoal/50">
                    Bank name
                  </p>

                  <p className="mt-0.5 font-sans text-base font-semibold text-charcoal">
                    {DEMO_PAYMENT_INFO.bankName}
                  </p>
                </div>

                {/* Account name */}
                <div className="mt-4">
                  <p className="font-sans text-sm text-charcoal/50">
                    Account name
                  </p>

                  <p className="mt-0.5 font-sans text-base font-semibold text-charcoal">
                    {DEMO_PAYMENT_INFO.accountName}
                  </p>
                </div>

                {/* Account number */}
                <div className="mt-4 flex items-end justify-between gap-4">

                  <div>
                    <p className="font-sans text-sm text-charcoal/50">
                      Account number
                    </p>

                    <p className="mt-0.5 font-mono text-base font-semibold text-charcoal">
                      {DEMO_PAYMENT_INFO.accountNumber}
                    </p>
                  </div>

                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex shrink-0 items-center gap-2 rounded-full bg-primary-light/15 px-4 py-2 font-sans text-sm font-medium text-primary-dark transition hover:bg-primary-light/25"
                  >
                    <CopyIcon className="h-4 w-4" />

                    {copied
                      ? "Copied"
                      : "Copy account number"}
                  </button>

                </div>
              </div>

              {/* Important notice */}
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/10 p-4">

                <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />

                <div>
                  <p className="font-sans text-sm font-semibold text-primary-dark">
                    Important
                  </p>

                  <p className="mt-1 font-sans text-sm text-charcoal/70">
                    Complete the payment and keep your receipt. Your
                    subscription becomes active only after an administrator
                    approves the uploaded receipt.
                  </p>
                </div>

              </div>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">

                {/* Back */}
                <button
                  type="button"
                  onClick={() => navigate("/sell/plans")}
                  className="flex items-center gap-2 rounded-full border border-primary-light/50 px-5 py-2.5 font-sans text-sm font-semibold text-primary-dark transition hover:bg-primary-light/10"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back
                </button>

                {/* Upload receipt */}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/sell/receipt", {
                      state: {
                        selectedPlan: displayPlan,
                        listingId,
                        subscriptionId: currentSubscriptionId,
                      },
                    })
                  }
                  className="rounded-full bg-primary px-6 py-2.5 font-sans text-sm font-semibold text-cream transition hover:bg-primary-dark"
                >
                  I Have Paid — Upload Receipt
                </button>

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}



