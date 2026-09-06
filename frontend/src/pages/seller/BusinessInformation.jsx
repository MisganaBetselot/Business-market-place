import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createListing } from "../../api/listings";
import { getCategories } from "../../api/categories";
import { createSellerSubscription, getMySubscriptions, updateSellerSubscriptionPlan } from "../../api/sellerSubscriptions";

export default function BusinessInformation() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedPlan = location.state?.selectedPlan;

  const [form, setForm] = useState({
    business_name: "",
    category: "",
    description: "",
    asking_price: "",
    region: "",
    city: "",
    area: "",
    address: "",
    phone: "",
    whatsapp: "",
    contact_email: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Set once createListing() succeeds, kept around so the "duplicate
  // subscription" recovery path below can still forward the listing we
  // already created instead of losing it.
  const [createdListing, setCreatedListing] = useState(null);
  const [duplicateSubscription, setDuplicateSubscription] = useState(null);
  const [switchingPlan, setSwitchingPlan] = useState(false);

  // Real categories from the backend — category is a foreign key, so a
  // free-text ID box was the likely reason submits were silently 400ing.
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.results ?? [];

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-surface-sunken px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-ink">
            No plan selected
          </h1>

          <p className="mt-3 text-ink-soft">
            Please choose a subscription plan before continuing.
          </p>

          <button
            type="button"
            onClick={() => navigate("/sell/plans")}
            className="mt-6 cursor-pointer rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:brightness-95"
          >
            Choose a Plan
          </button>
        </div>
      </div>
    );
  }

  const duration =
    selectedPlan.duration_label ||
    `${selectedPlan.duration ?? selectedPlan.duration_days} Days`;

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setDuplicateSubscription(null);

    // Explicit check before hitting the API — don't rely solely on the
    // <select required> here. A disabled placeholder option matching the
    // controlled value is a known browser edge case that can let an empty
    // string slip through native validation, which is exactly what was
    // hitting the backend as `category: ""` (DRF's "Incorrect type.
    // Expected pk value, received str." is its standard message for an
    // empty-string pk).
    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    let listing = createdListing;

    try {
      setSubmitting(true);

      if (!listing) {
        listing = await createListing({
          business_name: form.business_name,
          category: Number(form.category),
          description: form.description,
          asking_price: Number(form.asking_price),
          region: form.region,
          city: form.city,
          area: form.area || null,
          address: form.address || null,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          contact_email: form.contact_email || null,
        });
        setCreatedListing(listing);
      }

      // Now requires a listing id too — the backend's SellerSubscription
      // model added a required `listing` FK (confirmed live: POST without
      // it returns 400 {"listing": ["This field is required."]}). This
      // was the actual bug — createSellerSubscription was never being
      // called with a listing id at all until this fix.
      const subscription = await createSellerSubscription(selectedPlan.id, listing.id);

      navigate("/sell/payment-instructions", {
        state: {
          selectedPlan,
          listing,
          listingId: listing.id,
          subscription,
          subscriptionId: subscription.id,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Business information submit failed:", err.response?.status, err.response?.data || err);

      const status = err.response?.status;
      const backendError = err.response?.data;
      const detailMessage =
        typeof backendError?.detail === "string" ? backendError.detail : "";

      // The backend only allows one PENDING/ACTIVE subscription per
      // listing — this is expected, not a bug. Look up which one it is
      // right away so we can tell the seller whether it's the SAME plan
      // they just tried to pick again (no real choice to offer — just
      // resume it) or a DIFFERENT plan (worth surfacing both options).
      if (detailMessage.toLowerCase().includes("pending or active subscription")) {
        try {
          const data = await getMySubscriptions();
          const list = Array.isArray(data) ? data : data?.results ?? [];
          const existing = list.find(
            (item) =>
              item.listing === listing?.id &&
              (item.status === "PENDING" || item.status === "ACTIVE")
          );
          setDuplicateSubscription(existing || { unknown: true });
        } catch {
          setDuplicateSubscription({ unknown: true });
        }
        return;
      }

      if (typeof backendError === "string") {
        setError(backendError);
      } else if (backendError && typeof backendError === "object") {
        setError(
          Object.entries(backendError)
            .map(([field, msgs]) => `${field}: ${[].concat(msgs).join(", ")}`)
            .join(" | ")
        );
      } else if (status) {
        setError(`Request failed (${status}). Check the console for details.`);
      } else {
        setError(
          "Couldn't reach the server. Check your connection and that the backend is running (this can also be a CORS issue in dev)."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Resume the existing subscription we already looked up in handleSubmit's
  // catch block, carrying the listing we already created forward to
  // payment instructions.
  const handleContinueWithExisting = () => {
    if (!duplicateSubscription || duplicateSubscription.unknown) return;

    navigate("/sell/payment-instructions", {
      state: {
        selectedPlan,
        listing: createdListing,
        listingId: createdListing?.id,
        subscription: duplicateSubscription,
        subscriptionId: duplicateSubscription.id,
      },
    });
  };

  // Switch the existing PENDING subscription over to the new plan the
  // seller just picked, then continue to payment with THAT plan. Only
  // valid while the existing one is still PENDING — the backend rejects
  // this otherwise (see updateSellerSubscriptionPlan's note).
  const handleContinueWithNewPlan = async () => {
    if (!duplicateSubscription || duplicateSubscription.unknown) return;

    setSwitchingPlan(true);
    setError("");
    try {
      const updated = await updateSellerSubscriptionPlan(
        duplicateSubscription.id,
        selectedPlan.id
      );

      navigate("/sell/payment-instructions", {
        state: {
          selectedPlan,
          listing: createdListing,
          listingId: createdListing?.id,
          subscription: updated,
          subscriptionId: updated.id,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to switch subscription plan:", err.response?.data || err);
      setError(
        err.response?.data?.detail ||
          "Couldn't switch to the new plan. Please try again."
      );
    } finally {
      setSwitchingPlan(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-full border border-border bg-surface px-5 py-3 text-sm text-ink outline-none transition focus:border-brand-400";
  const textareaClass =
    "mt-1.5 w-full rounded-2xl border border-border bg-surface px-5 py-3 text-sm text-ink outline-none transition focus:border-brand-400";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wide text-ink-soft";

  const steps = ["Business Details", "Payment", "Review", "Media", "Published"];

  return (
    <div className="min-h-screen bg-surface-sunken pb-16">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-2xl border-b border-border pb-8">
          <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Create Your Business Listing
          </h1>

          <p className="mt-4 text-base text-ink-soft">
            Tell buyers about the business you're selling. Your listing is
            saved as a draft and only goes live after payment and media
            review.
          </p>
        </div>

        {/* Step tracker */}
        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3 rounded-2xl border border-border bg-surface px-6 py-5">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isCurrent = stepNumber === 1;
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      isCurrent
                        ? "bg-brand-600 text-white"
                        : "bg-surface-sunken text-ink-soft"
                    }`}
                  >
                    {stepNumber}
                  </span>
                  <span className={`text-sm ${isCurrent ? "font-semibold text-ink" : "text-ink-soft"}`}>
                    {label}
                  </span>
                </div>
                {stepNumber < steps.length && (
                  <span className="h-px w-8 bg-border sm:w-12" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Selected plan */}
          <aside className="h-fit rounded-2xl border border-border bg-surface p-7 lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Selected Plan
            </p>

            <h2 className="mt-2 font-display text-2xl font-bold text-ink">
              {duration}
            </h2>

            <p className="mt-3 font-display text-3xl font-bold text-brand-600">
              ETB {Number(selectedPlan.price).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              One-time payment for this listing
            </p>

            <div className="mt-5 space-y-3 border-t border-border pt-5">
              <p className="flex items-start gap-2.5 text-sm text-ink">
                <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600">
                  <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Listing stays active for {duration.toLowerCase()}
              </p>
              {selectedPlan.media_limit != null && (
                <p className="flex items-start gap-2.5 text-sm text-ink">
                  <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600">
                    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h1.6l.7-1.2A1.5 1.5 0 0 1 8.1 4h3.8a1.5 1.5 0 0 1 1.3.8l.7 1.2h1.6A1.5 1.5 0 0 1 17 7.5v6A1.5 1.5 0 0 1 15.5 15h-11A1.5 1.5 0 0 1 3 13.5v-6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                  Upload up to {selectedPlan.media_limit} photos
                </p>
              )}
              <p className="flex items-start gap-2.5 text-sm text-ink">
                <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600">
                  <path d="M8.5 11.5 11.5 8.5M7.5 12.5 5 15a2.5 2.5 0 1 1-3.5-3.5l2.5-2.5M12.5 7.5 15 5a2.5 2.5 0 1 1 3.5 3.5l-2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Add a video or social media URL — hosted externally, linked
                from your listing
              </p>
              {Array.isArray(selectedPlan.features) &&
                selectedPlan.features.map((feature) => (
                  <p key={feature} className="flex items-start gap-2.5 text-sm text-ink">
                    <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600">
                      <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {feature}
                  </p>
                ))}
            </div>

            <div className="mt-5 rounded-xl bg-surface-sunken p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-ink-soft">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <circle cx="8" cy="5.2" r="0.8" fill="currentColor" />
                </svg>
                About this plan
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {selectedPlan.about ?? selectedPlan.description ??
                  `A ${duration.toLowerCase()} listing plan. Your listing remains active for the selected duration and goes through the required approval process.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/sell/plans")}
              className="mt-5 w-full rounded-full border border-border py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              Change Plan
            </button>
          </aside>

          {/* Business information */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-surface p-7 sm:p-9"
          >
            <h3 className="font-display text-xl font-bold text-ink">
              Business Information
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              No payment details are collected on this page. Fields marked *
              are required.
            </p>

            <div className="mt-7 space-y-6">
              <div>
                <label className={labelClass}>Business Name *</label>
                <input
                  required
                  name="business_name"
                  value={form.business_name}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="e.g. Tomoca Corner Coffee House"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Region *</label>
                  <input
                    required
                    name="region"
                    value={form.region}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="e.g. Addis Ababa"
                  />
                </div>
                <div>
                  <label className={labelClass}>City *</label>
                  <input
                    required
                    name="city"
                    value={form.city}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="e.g. Bole"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Area</label>
                  <input
                    name="area"
                    value={form.area}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="e.g. Bole Medhanialem"
                  />
                </div>
                <div>
                  <label className={labelClass}>Address</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="Street address"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Asking Price (ETB) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    name="asking_price"
                    value={form.asking_price}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="e.g. 1,450,000"
                  />
                </div>
                <div>
                  <label className={labelClass}>Category *</label>
                  <select
                    required
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    disabled={categoriesLoading}
                    className={inputClass}
                  >
                    <option value="">
                      {categoriesLoading ? "Loading categories..." : "Select a category"}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Contact Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp</label>
                  <input
                    name="whatsapp"
                    value={form.whatsapp}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="WhatsApp number"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Contact Email</label>
                <input
                  type="email"
                  name="contact_email"
                  value={form.contact_email}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="business@example.com"
                />
              </div>

              <div>
                <label className={labelClass}>Description *</label>
                <textarea
                  required
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={5}
                  className={textareaClass}
                  placeholder="Describe the business..."
                />
              </div>
            </div>

            {error && (
              <div className="mt-7 rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
                {error}
              </div>
            )}

            {duplicateSubscription && (
              <div className="mt-7 rounded-xl border border-border bg-surface-sunken p-5">
                {duplicateSubscription.unknown ? (
                  <>
                    <p className="text-sm font-semibold text-ink">
                      This listing already has a subscription in progress
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Your business listing was saved, but we couldn't load
                      the details of the existing subscription. Check My
                      Subscriptions to manage it directly.
                    </p>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => navigate("/sell/subscription-status")}
                        className="cursor-pointer rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
                      >
                        View My Subscriptions
                      </button>
                    </div>
                  </>
                ) : duplicateSubscription.plan === selectedPlan.id ? (
                  <>
                    <p className="text-sm font-semibold text-ink">
                      You've already requested this plan
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Your business listing was saved. You already have the{" "}
                      {duplicateSubscription.plan_name ?? "same"} plan
                      pending for it — no need to add it again. Continue to
                      payment to finish that one.
                    </p>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleContinueWithExisting}
                        className="cursor-pointer rounded-full bg-gold-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:brightness-95"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-ink">
                      You already have a different plan pending for this listing
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Your business listing was saved. This listing already
                      has the{" "}
                      {duplicateSubscription.plan_name ?? "another"} plan
                      pending, not the one you just picked.
                      {duplicateSubscription.status === "PENDING"
                        ? " You can keep that plan and continue to payment, or switch to the new plan you just chose."
                        : " That subscription is already active, so it can't be switched — you can continue to payment with it, or review it from My Subscriptions."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleContinueWithExisting}
                        className="cursor-pointer rounded-full bg-gold-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:brightness-95"
                      >
                        Continue with Existing Plan
                      </button>
                      {duplicateSubscription.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={handleContinueWithNewPlan}
                          disabled={switchingPlan}
                          className="cursor-pointer rounded-full border border-brand-500 px-6 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {switchingPlan ? "Switching..." : "Continue with New Plan"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate("/sell/subscription-status")}
                        className="cursor-pointer rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
                      >
                        View My Subscriptions
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-9 flex justify-end border-t border-border pt-7">
              <button
                type="submit"
                disabled={submitting || duplicateSubscription}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-gold-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:brightness-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
              >
                {submitting ? "Creating Draft..." : "Continue to Payment"}
                {!submitting && <span aria-hidden="true">→</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}