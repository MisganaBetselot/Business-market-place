// Owner: muni
import { Heart, MapPin, Tag } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getSavedListings, unsaveListing } from "../../api/listings";
import { Card, Badge } from "../../components/common/Card";

const BADGE_TONE = {
  Verified: "brand",
  New: "gold",
  "Hot listing": "gold",
};

export default function Favorites() {
  const queryClient = useQueryClient();

  const { data: favorites, isLoading, isError, error } = useQuery({
    queryKey: ["saved-listings"],
    queryFn: getSavedListings,
    retry: false,
  });

  const removeMutation = useMutation({
    mutationFn: unsaveListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-listings"] }),
  });

  const count = favorites?.length ?? 0;

  return (
    <div className="min-h-screen bg-surface-sunken px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between border-b border-border pb-6 mb-8">
          <div>
            <h1 className="text-3xl text-ink mb-2">Saved Businesses</h1>
            <p className="text-ink-soft">Businesses you've saved to revisit later.</p>
          </div>
          <Badge tone="brand">{count} saved listing{count === 1 ? "" : "s"}</Badge>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-96 animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <Card className="p-8 text-center text-danger">
            {error?.response?.status === 404
              ? "The saved listings feature isn't available on the backend yet."
              : "Couldn't load your saved listings. Please try again."}
          </Card>
        )}

        {!isError && favorites && favorites.length === 0 && (
          <Card className="p-16 text-center text-ink-soft">
            No saved listings yet. Browse the marketplace and tap the heart icon to save one.
          </Card>
        )}

        {favorites && favorites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {favorites.map((listing) => (
              <Card key={listing.id} className="overflow-hidden p-0">
                <div className="relative">
                  <img
                    src={listing.coverImageUrl}
                    alt={listing.name}
                    className="w-full h-64 object-cover"
                  />
                  {listing.badge && (
                    <span className="absolute top-4 left-4">
                      <Badge tone={BADGE_TONE[listing.badge] || "neutral"}>{listing.badge}</Badge>
                    </span>
                  )}
                  <button
                    onClick={() => removeMutation.mutate(listing.id)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center text-brand-600 shadow-sm hover:text-danger transition-colors"
                    aria-label="Remove from saved"
                  >
                    <Heart className="h-4.5 w-4.5 fill-current" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="text-xl text-ink mb-1">{listing.name}</h3>
                  <p className="flex items-center gap-1.5 text-xs text-ink-soft uppercase tracking-wide mb-1">
                    <Tag className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {listing.category}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-ink-soft mb-4">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {listing.location}
                  </p>
                  <div className="border-t border-border pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink-soft mb-0.5">
                        Asking price
                      </p>
                      <p className="text-xl font-semibold text-brand-600">
                        {listing.askingPrice}
                      </p>
                    </div>
                    <a
                      href={`/business/${listing.id}`}
                      className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
