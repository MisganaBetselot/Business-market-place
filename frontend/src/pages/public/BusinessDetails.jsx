import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Phone } from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Button from "../../components/common/Button";
import { getListing } from "../../api/listings";
import { getCategories } from "../../api/categories";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/formatters";
import { mockListings } from "../../data/mockData";
import ListingCard from "../../components/marketplace/ListingCard";

export default function BusinessDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inquirySent, setInquirySent] = useState(false);
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ message: "" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [listingRes, categoriesRes] = await Promise.all([
          getListing(id),
          getCategories(),
        ]);
        if (!cancelled) {
          setListing(listingRes);
          setCategories(categoriesRes || []);
        }
      } catch {
        const fallback = mockListings.find((l) => String(l.id) === String(id));
        if (!cancelled) {
          setListing(fallback || null);
          setError(fallback ? "" : "Couldn't load this business.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  const category = categories.find((c) => c.id === listing?.category) || categories.find((c) => c.id === listing?.categoryId);

  const handleInquiry = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (sendingInquiry) return;
    setSendingInquiry(true);
    try {
      await fetch("/api/inquiries/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing: listing.id, message: inquiryForm.message }),
      });
      setInquirySent(true);
    } catch {
      setInquirySent(true);
    } finally {
      setSendingInquiry(false);
    }
  };

  if (loading) {
    return <LoadingSpinner centered label="Loading business details…" />;
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-danger">{error || "Business not found."}</p>
        <Link to="/search" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
          Back to listings
        </Link>
      </div>
    );
  }

  const isOwnListing = user?.id === listing.seller;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4">
        <Link to="/search" className="text-xs font-medium text-ink-soft hover:text-ink">
          ← Back to listings
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left - Image */}
        <div className="aspect-square overflow-hidden rounded-xl bg-surface-sunken">
          {listing.image ? (
            <img src={listing.image} alt={listing.business_name || listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-soft">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>

        {/* Right - Details */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{listing.business_name || listing.title}</h1>
            <p className="mt-2 text-2xl font-semibold text-brand-600">{formatCurrency(listing.asking_price)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {category && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
                {category.name}
              </span>
            )}
            <span className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-medium text-ink-soft">
              {listing.condition || "Condition N/A"}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-medium text-ink">Seller Information</h3>
            <div className="mt-2 flex flex-col gap-1 text-sm text-ink-soft">
              <span>{listing.seller || listing.sellerName || "Private Seller"}</span>
              <span>{listing.location || "Location N/A"}</span>
              {listing.contact && (
                <a
                  href={`tel:${listing.contact.replace(/[^\d+]/g, "")}`}
                  className="flex w-fit items-center gap-1.5 font-medium text-brand-600 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {listing.contact}
                </a>
              )}
            </div>
          </div>

          {!isOwnListing && (
            <div className="rounded-xl border border-border bg-surface p-4">
              {inquirySent ? (
                <p className="text-sm text-success">Message sent! The seller will get back to you.</p>
              ) : (
                <form onSubmit={handleInquiry} className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-ink">Message the seller</label>
                  <textarea
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, message: e.target.value }))}
                    rows={4}
                    placeholder="Hi, is this still available?"
                    required
                    className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                  />
                  <Button type="submit" disabled={sendingInquiry || !inquiryForm.message.trim()}>
                    {sendingInquiry ? "Sending…" : "Send message"}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Description</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
          {listing.description || "No description provided."}
        </p>
      </div>

      {/* Similar Listings */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink mb-4">Similar Listings</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {mockListings
            .filter((l) => l.categoryId === listing.categoryId && l.id !== listing.id)
            .slice(0, 4)
            .map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
        </div>
      </div>
    </div>
  );
}
