import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createListing } from "../../api/listings";
import { getCategories } from "../../api/categories";
import { createSellerSubscription } from "../../api/sellerSubscriptions";

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
            className="mt-6 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
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

    try {
      setSubmitting(true);

      const listing = await createListing({
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

      // The backend's SellerSubscription model only stores { user, plan }
      // — no listing FK — so creation order doesn't matter structurally.
      // Creating it here, right after the listing, so both IDs are
      // guaranteed to exist before moving on to payment.
      const subscription = await createSellerSubscription(selectedPlan.id);

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

  const inputClass =
    "mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400";

  return (
    <div className="min-h-screen bg-surface-sunken pb-16">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-ink">
            Tell us about your business
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Add the basic information for your listing. You can continue to
            payment once you're finished.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Selected plan */}
          <aside className="h-fit rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Selected Plan
            </p>

            <h2 className="mt-3 font-display text-2xl font-semibold text-ink">
              {duration}
            </h2>

            <p className="mt-3 text-2xl font-bold text-brand-600">
              ETB {Number(selectedPlan.price).toLocaleString()}
            </p>

            {selectedPlan.description && (
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                {selectedPlan.description}
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate("/sell/plans")}
              className="mt-6 text-sm font-medium text-brand-600 underline underline-offset-2"
            >
              Change plan
            </button>
          </aside>

          {/* Business information */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-ink">
                  Business Name *
                </label>
                <input
                  required
                  name="business_name"
                  value={form.business_name}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="e.g. Addis Coffee House"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ink">
                  Category *
                </label>
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

              <div>
                <label className="text-sm font-medium text-ink">
                  Asking Price *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  name="asking_price"
                  value={form.asking_price}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="ETB"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-ink">
                  Description *
                </label>
                <textarea
                  required
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={5}
                  className={inputClass}
                  placeholder="Describe the business..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ink">
                  Region *
                </label>
                <input
                  required
                  name="region"
                  value={form.region}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Region"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ink">
                  City *
                </label>
                <input
                  required
                  name="city"
                  value={form.city}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="City"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ink">
                  Area
                </label>
                <input
                  name="area"
                  value={form.area}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Area"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ink">
                  Address
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Address"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ink">
                  Phone
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ink">
                  WhatsApp
                </label>
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="WhatsApp number"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-ink">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={form.contact_email}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="business@example.com"
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-brand-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Creating Draft..."
                  : "Continue to Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}