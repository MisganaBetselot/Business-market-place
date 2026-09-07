import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSavedListings, unsaveListing } from "../../api/listings";
import FavoriteListingCard from "../../components/favorites/FavoriteListingCard";
import SellerCTASidebar from "../../components/marketplace/SellerCTASidebar";

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
    <div className="min-h-screen bg-surface-sunken px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-ink">
              Saved Businesses
            </h1>
            <p className="mt-2 text-ink-soft">
              Businesses you've saved to revisit later.
            </p>
          </div>

          {!isLoading && !isError && (
            <span className="whitespace-nowrap rounded-full bg-brand-50 px-5 py-2 text-sm font-medium text-brand-600">
              {count} saved listing{count === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="mt-6 border-t border-border" />

        {isError && (
          <p className="mt-8 text-sm text-danger">
            Couldn't load your saved businesses. Please refresh the page.
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            {isLoading && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-96 animate-pulse rounded-2xl bg-surface" />
                ))}
              </div>
            )}

            {!isLoading && !isError && count === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-border bg-surface/40 px-6 py-16 text-center text-ink-soft">
                You haven't saved any businesses yet.
              </div>
            )}

            {!isLoading && !isError && count > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <FavoriteListingCard
                    key={listing.id}
                    listing={listing}
                    onUnsave={() => removeSaved(listing.id)}
                    removing={removingId === listing.id}
                  />
                ))}
              </div>
            )}
          </div>

          <SellerCTASidebar />
        </div>
      </div>
    </div>
  );
}