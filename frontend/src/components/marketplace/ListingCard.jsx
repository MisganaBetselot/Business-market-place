import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { Card } from "../common/Card";
import FavoriteButton from "../favorite/FavoriteButton";
import ImageGallery from "../media/ImageGallery";

export default function ListingCard({ listing }) {
  const price =
    listing.asking_price != null
      ? new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(listing.asking_price)
      : null;

  const location = [listing.city, listing.region].filter(Boolean).join(", ") || "Location TBD";
  const sellerLabel = listing.seller || listing.sellerName;

  const images = (listing.images || []).map((img, idx) => ({
    id: img.id || idx,
    url: img.url || img.thumbnail_url || img,
    thumbnail_url: img.thumbnail_url || img.url || img,
  }));

  return (
    <Link to={`/business/${listing.id}`} className="block h-full">
      <Card
        padded={false}
        className="group flex h-full flex-col overflow-hidden border border-border transition-all duration-200 hover:-translate-y-1 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10"
      >
        <div className="relative">
          <ImageGallery
            images={images}
            alt={listing.business_name || listing.title}
            variant="compact"
          />
          <div className="absolute right-3 top-3 z-20">
            <FavoriteButton listing={listing} size="sm" />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg font-bold leading-snug text-ink line-clamp-2">
            {listing.business_name || listing.title}
          </h3>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </p>

          {sellerLabel && (
            <p className="mt-0.5 truncate text-xs text-ink-soft">Listed by {sellerLabel}</p>
          )}

          <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                Asking Price
              </p>
              <p className="mt-0.5 font-display text-base font-bold text-brand-600">
                {price || "Price on request"}
              </p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-brand-600 transition group-hover:gap-1.5">
              View Details
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}