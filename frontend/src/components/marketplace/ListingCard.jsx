import { Link } from "react-router-dom";
import { Card } from "../common/Card";
import FavoriteButton from "../favorite/FavoriteButton";
import ImageGallery from "../media/ImageGallery";

export default function ListingCard({ listing }) {
  const price = listing.asking_price != null
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(listing.asking_price)
    : null;

  const location = [listing.city, listing.region].filter(Boolean).join(", ") || "Location TBD";

  const images = (listing.images || []).map((img, idx) => ({
    id: img.id || idx,
    url: img.url || img.thumbnail_url || img,
    thumbnail_url: img.thumbnail_url || img.url || img,
  }));

  return (
    <Link to={`/business/${listing.id}`} className="block h-full">
      <Card className="group flex h-full flex-col overflow-hidden border-2 border-brand-100 p-0 transition-all duration-200 hover:-translate-y-1 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/20">
        <div className="relative">
          <ImageGallery
            images={images}
            alt={listing.business_name || listing.title}
            variant="compact"
          />
          <div className="absolute right-2.5 top-2.5 z-20">
            <FavoriteButton listing={listing} size="sm" />
          </div>
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