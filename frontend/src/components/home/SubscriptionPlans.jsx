import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSubscriptionPlans } from "../../api/subscriptions";

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
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M8 7.2v4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="8" cy="5.2" r="0.8" fill="currentColor" />
    </svg>
  );
}

function PlanCard({ plan, onChoose }) {
  const [showAbout, setShowAbout] = useState(false);

  const durationLabel =
    plan.duration_label ??
    formatDuration(plan.duration ?? plan.duration_days);

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-surface p-6 transition ${
        plan.is_premium
          ? "border-brand-500 shadow-md"
          : "border-border"
      }`}
    >
      {plan.is_premium && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
          Best Value
        </span>
      )}

      <p className="font-sans text-xs font-medium uppercase tracking-wide text-ink-soft">
        Listing Plan
      </p>

      <p className="mt-1 font-display text-2xl font-semibold text-ink">
        {durationLabel}
      </p>

      <p className="mt-4 font-sans text-3xl font-bold text-brand-600">
        ETB {Number(plan.price).toLocaleString()}
      </p>

      <p className="mt-0.5 font-sans text-xs text-ink-soft">
        Billed once for {durationLabel}
      </p>

      {plan.description && (
        <p className="mt-4 font-sans text-sm text-ink-soft">
          {plan.description}
        </p>
      )}

      {Array.isArray(plan.features) && plan.features.length > 0 && (
        <ul className="mt-4 space-y-2">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 font-sans text-sm text-ink"
            >
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setShowAbout((value) => !value)}
        className="mt-4 flex items-center gap-1.5 font-sans text-sm text-ink-soft hover:text-ink"
      >
        <InfoIcon className="h-3.5 w-3.5" />
        About this plan
      </button>

      {showAbout && (
        <p className="mt-2 rounded-lg bg-surface-sunken p-3 font-sans text-xs text-ink-soft">
          {plan.about ??
            `A ${durationLabel.toLowerCase()} listing plan. Your listing remains active for the selected duration and goes through the required approval process.`}
        </p>
      )}

      <button
        type="button"
        onClick={() => onChoose(plan)}
        className={`mt-6 w-full rounded-full py-2.5 font-sans text-sm font-semibold transition ${
          plan.is_premium
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "border border-border text-brand-600 hover:bg-brand-50"
        }`}
      >
        Choose Plan
      </button>
    </div>
  );
}

export default function SubscriptionPlans() {
  const navigate = useNavigate();

  const {
    data: plansData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: getSubscriptionPlans,
  });

  const plans = Array.isArray(plansData)
    ? plansData
    : plansData?.results ?? [];

 const handleChoose = (plan) => {
  navigate("/sell/business-information", {
    state: {
      selectedPlan: plan,
    },
  });
};

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div>
          <h2 className="font-display text-4xl font-bold text-ink">
            Ready to Put Your Business in Front of Buyers?
          </h2>

          <p className="mt-3 max-w-2xl font-sans text-ink-soft">
            Choose how long your listing stays active and get your business
            in front of potential buyers.
          </p>
        </div>

        {isLoading && (
          <p className="mt-10 font-sans text-sm text-ink-soft">
            Loading plans...
          </p>
        )}

        {isError && (
          <p className="mt-10 font-sans text-sm text-danger">
            Unable to load subscription plans. Please try again.
          </p>
        )}

        {!isLoading && !isError && plans.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {plans.slice(0, 3).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onChoose={handleChoose}
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && plans.length === 0 && (
          <p className="mt-10 font-sans text-sm text-ink-soft">
            No subscription plans are currently available.
          </p>
        )}
      </div>
    </section>
  );
}