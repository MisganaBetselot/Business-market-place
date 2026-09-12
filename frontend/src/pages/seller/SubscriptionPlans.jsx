import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSubscriptionPlans } from "../../api/subscriptions";

const STEPS = ["Business Details", "Payment", "Review", "Media", "Published"];

function formatDuration(days) {
  if (!days) return "";
  if (days === 30) return "1 Month";
  return `${days} Days`;
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

function InfoIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="5.2" r="0.8" fill="currentColor" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M3 7.5A1.5 1.5 0 0 1 4.5 6h1.6l.7-1.2A1.5 1.5 0 0 1 8.1 4h3.8a1.5 1.5 0 0 1 1.3.8l.7 1.2h1.6A1.5 1.5 0 0 1 17 7.5v6A1.5 1.5 0 0 1 15.5 15h-11A1.5 1.5 0 0 1 3 13.5v-6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function VideoIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="5.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12 8.3 16.5 6v8l-4.5-2.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepTracker({ currentStep }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3 rounded-2xl border border-border bg-surface px-6 py-5">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isCurrent = stepNumber === currentStep;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  isCurrent ? "bg-brand-600 text-white" : "bg-surface-sunken text-ink-soft"
                }`}
              >
                {stepNumber}
              </span>
              <span className={`text-sm ${isCurrent ? "font-semibold text-ink" : "text-ink-soft"}`}>
                {label}
              </span>
            </div>
            {stepNumber < STEPS.length && (
              <span className="h-px w-8 bg-border sm:w-12" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Same card as the landing-page section (SubscriptionPlans.jsx) —
// deliberately unchanged/duplicated here rather than imported, since that
// component renders its own <section> wrapper meant to sit inside the
// landing page's own background/spacing. This page needs a different
// outer shell (full-page, matches BusinessInformation/PaymentInstructions/
// MediaUpload), so the card is copied rather than nested awkwardly inside
// another wrapper. Keep both in sync if the card design changes.
//
// Style notes: feature icons, the checkmarks, and the "About this plan"
// link now use the gold accent color instead of brand green, to match
// the reference. The "Choose Plan" button is unified across all plans
// (premium or not) — white background, green border/text, flipping to
// solid green with white text on hover/active.
function PlanCard({ plan, onChoose }) {
  const [showAbout, setShowAbout] = useState(false);

  const durationLabel =
    plan.duration_label ?? formatDuration(plan.duration ?? plan.duration_days);

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-surface p-8 transition ${
        plan.is_premium ? "border-gold-400 shadow-md" : "border-border"
      }`}
    >
      {plan.is_premium && (
        <span className="absolute -top-3 left-8 rounded-full bg-gold-500 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
          Best Value
        </span>
      )}

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <ClockIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-sans text-xs font-medium uppercase tracking-wide text-ink-soft">
            Listing Plan
          </p>
          <p className="font-display text-2xl font-semibold text-ink">{durationLabel}</p>
        </div>
      </div>

      <p className="mt-5 font-sans text-3xl font-bold text-brand-600">
        ETB {Number(plan.price).toLocaleString()}
      </p>

      <p className="mt-0.5 font-sans text-xs text-ink-soft">Billed once for {durationLabel}</p>

      {plan.description && (
        <p className="mt-4 font-sans text-sm leading-6 text-ink-soft">{plan.description}</p>
      )}

      <div className="mt-5 space-y-2 border-t border-border pt-5">
        {plan.media_limit != null && (
          <p className="flex items-center gap-2 font-sans text-sm text-ink">
            <CameraIcon className="h-4 w-4 shrink-0 text-gold-500" />
            Up to {plan.media_limit} photos
          </p>
        )}
        <p className="flex items-center gap-2 font-sans text-sm text-ink">
          <VideoIcon className="h-4 w-4 shrink-0 text-gold-500" />
          Video or social media link included
        </p>
        <p className="flex items-center gap-2 font-sans text-sm text-ink">
          <ClockIcon className="h-4 w-4 shrink-0 text-gold-500" />
          Listing active for {durationLabel.toLowerCase()}
        </p>
      </div>

      {Array.isArray(plan.features) && plan.features.length > 0 && (
        <>
          <p className="mt-5 font-sans text-xs font-semibold uppercase tracking-wide text-ink-soft">
            What&rsquo;s included
          </p>
          <ul className="mt-2 space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 font-sans text-sm text-ink">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                {feature}
              </li>
            ))}
          </ul>
        </>
      )}

      <button
        type="button"
        onClick={() => setShowAbout((value) => !value)}
        className="mt-5 flex items-center gap-1.5 font-sans text-sm text-gold-500 hover:text-gold-600"
      >
        <InfoIcon className="h-3.5 w-3.5" />
        About this plan
      </button>

      {showAbout && (
        <p className="mt-2 rounded-lg bg-surface-sunken p-3 font-sans text-xs leading-5 text-ink-soft">
          {plan.about ??
            `A ${durationLabel.toLowerCase()} listing plan. Your listing remains active for the selected duration and goes through the required approval process before it appears in search.`}
        </p>
      )}

      <button
        type="button"
        onClick={() => onChoose(plan)}
        className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition duration-200 hover:opacity-90 hover:blur-[1.5px] active:opacity-100 active:blur-0"
      >
        Choose Plan
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

export default function PlansPage() {
  const navigate = useNavigate();

  const {
    data: plansData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: getSubscriptionPlans,
  });

  const plans = Array.isArray(plansData) ? plansData : plansData?.results ?? [];

  const handleChoose = (plan) => {
    navigate("/sell/business-information", {
      state: { selectedPlan: plan },
    });
  };

  return (
    <div className="min-h-screen bg-surface-sunken px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl border-b border-border pb-8">
          <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Choose a Listing Plan
          </h1>
          <p className="mt-4 text-base text-ink-soft">
            Plans are based on how long your listing stays active. Each
            subscription belongs to one business listing — list another
            business and it gets its own plan.
          </p>
        </div>

        <StepTracker currentStep={1} />

        {isLoading && (
          <p className="mt-10 font-sans text-sm text-ink-soft">Loading plans...</p>
        )}

        {isError && (
          <p className="mt-10 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 font-sans text-sm text-danger">
            Unable to load subscription plans. Please try again.
          </p>
        )}

        {!isLoading && !isError && plans.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
            {plans.slice(0, 3).map((plan) => (
              <PlanCard key={plan.id} plan={plan} onChoose={handleChoose} />
            ))}
          </div>
        )}

        {!isLoading && !isError && plans.length === 0 && (
          <p className="mt-10 font-sans text-sm text-ink-soft">
            No subscription plans are currently available.
          </p>
        )}
      </div>
    </div>
  );
}