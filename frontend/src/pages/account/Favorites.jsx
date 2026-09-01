import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSavedListings, unsaveListing } from "../../api/listings";

const BADGE_STYLES = {
  VERIFIED: { label: "Verified", className: "bg-primary text-cream" },
  HOT: { label: "Hot listing", className: "bg-charcoal/80 text-accent" },
  NEW: { label: "New", className: "bg-primary-light/25 text-primary-dark" },
};

function HeartIcon({ className, filled }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} className={className}>
      <path
        d="M10 17s-6.2-3.9-8.1-7.7C.6 6.7 2 3.5 5 3c1.8-.3 3.5.6 5 2.4C11.5 3.6 13.2 2.7 15 3c3 .5 4.4 3.7 3.1 6.3C16.2 13.1 10 17 10 17Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TagIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M7 2H3.5A1.5 1.5 0 0 0 2 3.5V7l6.6 6.6a1.5 1.5 0 0 0 2.12 0l3.88-3.88a1.5 1.5 0 0 0 0-2.12L8 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="5.3" cy="5.3" r="0.9" fill="currentColor" />
    </svg>
  );
}

function MapPinIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M8 15s5-4.6 5-8.5A5 5 0 0 0 3 6.5C3 10.4 8 15 8 15Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function ListingCard({ listing, onUnsave, removing }) {
  const badge = listing.badge ? BADGE_STYLES[listing.badge] : null;

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white transition-opacity ${
        removing ? "opacity-50" : ""
      }`}
    >
      <div className="relative h-48 w-full bg-primary-light/10">
        {listing.coverImageUrl && (
          <img
            src={listing.coverImageUrl}
            alt={listing.name}
            className="h-full w-full object-cover"
          />
        )}

        {badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 font-sans text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        )}

        <button
          type="button"
          onClick={onUnsave}
          disabled={removing}
          aria-label="Remove from saved businesses"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 disabled:opacity-60"
        >
          <HeartIcon filled className="h-4 w-4 text-primary" />
        </button>
      </div>

      <div className="p-5">
        <h3 className="font-serif text-xl font-bold text-charcoal">
          {listing.name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 font-sans text-xs font-medium uppercase tracking-wide text-charcoal/50">
          <TagIcon className="h-3.5 w-3.5" />
          {listing.category}
        </div>

        <div className="mt-2 flex items-center gap-1.5 font-sans text-sm text-charcoal/70">
          <MapPinIcon className="h-4 w-4" />
          {listing.location}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-primary-light/20 pt-4">
          <div>
            <p className="font-sans text-xs font-medium uppercase tracking-wide text-charcoal/50">
              Asking price
            </p>
            <p className="mt-1 font-sans font-semibold text-charcoal">
              {listing.askingPrice}
            </p>
          </div>

          <a
            href={`/business/${listing.id}`}
            className="rounded-full bg-primary px-5 py-2 font-sans text-sm font-medium text-cream transition hover:bg-primary-dark"
          >
            View Details
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Favorites() {
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState(null);

  const {
    data: listings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["savedListings"],
    queryFn: getSavedListings,
    retry: false,
  });

  const { mutate: removeSaved } = useMutation({
    mutationFn: (listingId) => unsaveListing(listingId),
    onMutate: (listingId) => setRemovingId(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedListings"] });
    },
    onSettled: () => setRemovingId(null),
  });

  const count = listings?.length ?? 0;

  return (
    <div className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-charcoal">
              Saved Businesses
            </h1>
            <p className="mt-2 font-sans text-charcoal/70">
              Businesses you've saved to revisit later.
            </p>
          </div>

          {!isLoading && !isError && (
            <span className="whitespace-nowrap rounded-full bg-primary-light/15 px-5 py-2 font-sans text-sm font-medium text-primary-dark">
              {count} saved listing{count === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="mt-6 border-t border-primary-light/20" />

        {isLoading && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-white/60" />
            ))}
          </div>
        )}

        {isError && (
          <p className="mt-8 font-sans text-sm text-red-700">
            Couldn't load your saved businesses. Please refresh the page.
          </p>
        )}

        {!isLoading && !isError && count === 0 && (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-primary-light/40 bg-white/40 px-6 py-16 text-center font-sans text-charcoal/60">
            You haven't saved any businesses yet.
          </div>
        )}

        {!isLoading && !isError && count > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onUnsave={() => removeSaved(listing.id)}
                removing={removingId === listing.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}