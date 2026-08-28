import ListingCard from "./ListingCard";

export default function ListingGrid({ listings, loading, emptyMessage = "No businesses found." }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-surface-sunken" />
        ))}
      </div>
    );
  }

  if (!listings?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16 text-center">
        <p className="text-sm text-ink-soft">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
