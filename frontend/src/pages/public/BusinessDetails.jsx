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
import ImageGallery from "../../components/media/ImageGallery";

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

  const images = (listing.images || []).map((img, idx) => ({
    id: img.id || idx,
    url: img.url || img.thumbnail_url || img,
    thumbnail_url: img.thumbnail_url || img.url || img,
  }));

  const locationText = [listing.city, listing.region, listing.area].filter(Boolean).join(", ") || "Location N/A";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4">
        <Link to="/search" className="text-xs font-medium text-ink-soft hover:text-ink">
          ← Back to listings
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left - Image Gallery */}
        <div>
          <ImageGallery
            images={images}
            alt={listing.business_name || listing.title}
            variant="full"
          />
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
            {listing.status && (
              <span className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-medium text-ink-soft">
                {listing.status}
              </span>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-medium text-ink">Seller Information</h3>
            <div className="mt-2 flex flex-col gap-1 text-sm text-ink-soft">
              <span>{listing.seller || listing.sellerName || "Private Seller"}</span>
              <span>{locationText}</span>
              {listing.phone && (
                <a
                  href={`tel:${listing.phone.replace(/[^\d+]/g, "")}`}
                  className="flex w-fit items-center gap-1.5 font-medium text-brand-600 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {listing.phone}
                </a>
              )}
              {listing.whatsapp && (
                <span className="flex items-center gap-1.5 text-brand-600">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {listing.whatsapp}
                </span>
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