import { useCallback, useEffect, useState } from "react";
import { Heart, MapPin, Tag } from "lucide-react";

import { getSavedListings, unsaveListing } from "../../api/listings";

// Local images
import bakeryImage from "../../assets/biz-bakery.jpg";
import coffeeImage from "../../assets/biz-coffee.jpg";
import restaurantImage from "../../assets/biz-restaurant.jpg";
import retailImage from "../../assets/biz-retail.jpg";
import salonImage from "../../assets/biz-salon.jpg";

const BADGE_STYLES = {
  VERIFIED: {
    label: "Verified",
    className: "bg-[#1F3A2C]/90 text-white",
  },
  HOT: {
    label: "Hot listing",
    className: "bg-black/55 text-[#F0B429]",
  },
  NEW: {
    label: "New",
    className: "bg-[#C9D4C2] text-[#1F3A2C]",
  },
};

// Temporary mock data.
// This lets the page display properly before real users save businesses.
const MOCK_LISTINGS = [
  {
    id: "mock-coffee",
    name: "Tomoca Corner Coffee House",
    category: "CAFE & COFFEE",
    location: "Bole, Addis Ababa",
    askingPrice: "ETB 1,450,000",
    coverImageUrl: coffeeImage,
    badge: "VERIFIED",
  },
  {
    id: "mock-restaurant",
    name: "Kategna Fine Dining",
    category: "RESTAURANT",
    location: "Kazanchis, Addis Ababa",
    askingPrice: "ETB 4,200,000",
    coverImageUrl: restaurantImage,
    badge: "HOT",
  },
  {
    id: "mock-salon",
    name: "Enat Beauty & Hair Studio",
    category: "SALON & SPA",
    location: "Hawassa",
    askingPrice: "ETB 890,000",
    coverImageUrl: salonImage,
    badge: "VERIFIED",
  },
  {
    id: "mock-retail",
    name: "Merkato Style Boutique",
    category: "RETAIL SHOP",
    location: "Addis Ketema, Addis Ababa",
    askingPrice: "ETB 620,000",
    coverImageUrl: retailImage,
    badge: "NEW",
  },
  {
    id: "mock-bakery",
    name: "Adama Daily Bakery",
    category: "BAKERY",
    location: "Adama",
    askingPrice: "ETB 1,100,000",
    coverImageUrl: bakeryImage,
    badge: "VERIFIED",
  },
];

export default function Favorites() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Keeps track of whether currently displayed cards are mock cards
  const [usingMockData, setUsingMockData] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getSavedListings();

      // If real saved listings exist, use them
      if (Array.isArray(data) && data.length > 0) {
        setListings(data);
        setUsingMockData(false);
      } else {
        // Temporary mock cards for development/demo
        setListings(MOCK_LISTINGS);
        setUsingMockData(true);
      }
    } catch (err) {
      // If API is not ready yet, still show the page with mock cards
      setListings(MOCK_LISTINGS);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnsave(listingId) {
    setRemovingId(listingId);

    const previous = listings;

    // Remove from UI immediately
    setListings((current) =>
      current.filter((listing) => listing.id !== listingId)
    );

    try {
      // Don't call backend for temporary mock listings
      if (!usingMockData) {
        await unsaveListing(listingId);
      }
    } catch (err) {
      // Restore if backend removal fails
      setListings(previous);
      setError("Couldn't remove that listing. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F1E7] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-[#1E1B16] sm:text-5xl">
              Saved Businesses
            </h1>

            <p className="mt-3 text-[#6B6558]">
              Businesses you've saved to revisit later.
            </p>
          </div>

          <span className="whitespace-nowrap rounded-full bg-[#DDE0D2] px-5 py-2 text-sm font-medium text-[#3E4636]">
            {listings.length} saved listing
            {listings.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-6 border-t border-[#E3DDCE]" />

        {error && (
          <p className="mt-6 rounded-xl bg-[#F5D9D9] px-4 py-3 text-sm text-[#A33636]">
            {error}
          </p>
        )}

        {/* Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-96 animate-pulse rounded-3xl bg-[#EDE8DB]"
                />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-[#D9D2BF] bg-[#FDFBF6]/60 px-6 py-16 text-center text-[#6B6558]">
              You haven't saved any businesses yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onUnsave={() => handleUnsave(listing.id)}
                  removing={removingId === listing.id}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function ListingCard({ listing, onUnsave, removing }) {
  const badge = listing.badge
    ? BADGE_STYLES[listing.badge]
    : null;

  return (
    <div
      className={`overflow-hidden rounded-3xl bg-[#FDFBF6] shadow-sm transition-opacity ${
        removing ? "opacity-50" : ""
      }`}
    >
      <div className="relative h-48 w-full">
        <img
          src={listing.coverImageUrl}
          alt={listing.name}
          className="h-full w-full object-cover"
        />

        {badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        )}

        <button
          type="button"
          onClick={onUnsave}
          disabled={removing}
          aria-label="Remove from saved businesses"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
        >
          <Heart className="h-4 w-4 fill-[#1F3A2C] text-[#1F3A2C]" />
        </button>
      </div>

      <div className="p-5">
        <h3 className="font-serif text-xl font-bold text-[#1E1B16]">
          {listing.name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[#9A9282]">
          <Tag className="h-3.5 w-3.5" />
          {listing.category}
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[#6B6558]">
          <MapPin className="h-4 w-4" />
          {listing.location}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-[#E3DDCE] pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#9A9282]">
              Asking price
            </p>

            <p className="mt-1 font-semibold text-[#1E1B16]">
              {listing.askingPrice}
            </p>
          </div>

          <a
            href={`/listings/${listing.id}`}
            className="rounded-full bg-[#1F3A2C] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#183024]"
          >
            View Details
          </a>
        </div>
      </div>
    </div>
  );
}