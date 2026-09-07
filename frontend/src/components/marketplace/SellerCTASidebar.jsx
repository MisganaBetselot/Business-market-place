import { Link } from "react-router-dom";

export default function SellerCTASidebar() {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="rounded-2xl bg-brand-700 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">
          For Sellers
        </p>
        <h3 className="mt-3 font-display text-2xl font-bold leading-tight">
          Thinking of selling?
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/80">
          Get your business in front of serious buyers actively searching
          the marketplace.
        </p>
        <Link
          to="/sell/plans"
          className="mt-5 flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-white/90"
        >
          List Your Business
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="rounded-2xl bg-surface-sunken p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Verified Listings
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Every listing is reviewed before it is published, so buyers see
          accurate business information from the start.
        </p>
      </div>
    </aside>
  );
}