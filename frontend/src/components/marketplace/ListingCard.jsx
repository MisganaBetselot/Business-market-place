import { Link } from "react-router-dom";
import { Card } from "../common/Card";

export default function ListingCard({ listing }) {
  const price = listing.asking_price != null
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(listing.asking_price)
    : null;

  const location = [listing.city, listing.region].filter(Boolean).join(", ") || "Location TBD";

  return (
    <Link to={`/business/${listing.id}`} className="block h-full">
      <Card className="group flex h-full flex-col overflow-hidden border-2 border-brand-100 p-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-sunken">
          <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-brand-500 to-gold-400" />
          {listing.image ? (
            <img
              src={listing.image}
              alt={listing.business_name || listing.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-300">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
            {listing.business_name || listing.title}
          </h3>
          <p className="inline-flex w-fit items-center rounded-md bg-brand-50 px-2 py-0.5 text-sm font-semibold text-brand-600">
            {price || "Price on request"}
          </p>
          <div className="mt-auto flex items-center justify-between text-xs text-ink-soft">
            <span className="truncate">{listing.seller || listing.sellerName}</span>
            <span className="truncate font-medium text-gold-500">{location}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
