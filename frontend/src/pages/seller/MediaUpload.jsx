import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMySubscriptions } from "../../api/sellerSubscriptions";
import { getMedia } from "../../api/media";
import MediaUploader from "../../components/media/MediaUploader";
import MediaGrid from "../../components/media/MediaGrid";

function formatDuration(days) {
  if (!days) return "";
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} Month${months > 1 ? "s" : ""}`;
  }
  return `${days} Days`;
}

function daysRemaining(expiryDate) {
  if (!expiryDate) return null;
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function displayStatusLabel(subscription) {
  if (!subscription) return "Not subscribed";
  if (subscription.status === "PENDING") return "Payment Pending";
  if (subscription.status === "ACTIVE") {
    const remaining = daysRemaining(subscription.expiry_date);
    return remaining !== null && remaining <= 7 ? "Expiring Soon" : "Active";
  }
  if (subscription.status === "EXPIRED") return "Expired";
  if (subscription.status === "REJECTED") return "Rejected";
  if (subscription.status === "CANCELLED") return "Cancelled";
  return subscription.status;
}

function BuildingIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 17V4.5A1.5 1.5 0 0 1 5.5 3h5A1.5 1.5 0 0 1 12 4.5V17M4 17h12M4 17H2.5M12 17h4.5M12 17h-2M7 6h1M7 9h1M9.5 6h1M9.5 9h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="3" y="4.5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 8a2 2 0 0 1 2-2h1.2a1 1 0 0 0 .86-.5l.68-1.14A1 1 0 0 1 9.6 4h4.8a1 1 0 0 1 .86.36l.68 1.14a1 1 0 0 0 .86.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function VideoIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m16 10.5 4.2-2.6a.8.8 0 0 1 1.2.68v6.84a.8.8 0 0 1-1.2.68L16 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export default function MediaUpload() {
  const { id: routeListingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mediaTab, setMediaTab] = useState("PHOTO");

  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ["mySubscriptions"],
    queryFn: getMySubscriptions,
    retry: false,
  });

  // Resolve which listing we're uploading for: the route param if given,
  // otherwise the listing tied to the seller's first subscription.
  const listingId = routeListingId ?? subscriptions?.[0]?.listing_id;
  const listingName =
    subscriptions?.find((s) => s.listing_id === listingId)?.listing_name;

  const photoSub = useMemo(
    () =>
      subscriptions?.find(
        (s) => s.listing_id === listingId && s.plan?.media_type === "PHOTO"
      ),
    [subscriptions, listingId]
  );
  const videoSub = useMemo(
    () =>
      subscriptions?.find(
        (s) => s.listing_id === listingId && s.plan?.media_type === "VIDEO"
      ),
    [subscriptions, listingId]
  );
  const currentSub = mediaTab === "PHOTO" ? photoSub : videoSub;
  const remaining = currentSub
    ? Math.max((currentSub.media_limit ?? 0) - (currentSub.media_used ?? 0), 0)
    : null;
  const canUpload = currentSub?.status === "ACTIVE";

  const {
    data: mediaItems,
    isLoading: mediaLoading,
    isError: mediaError,
  } = useQuery({
    queryKey: ["media", listingId, mediaTab],
    queryFn: () => getMedia({ listingId, mediaType: mediaTab }),
    enabled: !!listingId,
  });

  const refreshMedia = () => {
    queryClient.invalidateQueries({ queryKey: ["media", listingId, mediaTab] });
    queryClient.invalidateQueries({ queryKey: ["mySubscriptions"] });
  };

  return (
    <div className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-4xl font-bold text-charcoal">
          Upload Media
        </h1>
        <p className="mt-2 font-sans text-charcoal/70">
          Every uploaded item starts as Pending Review and stays private
          until an administrator approves it.
        </p>

        {subsLoading && (
          <p className="mt-8 font-sans text-charcoal/60">Loading listing...</p>
        )}

        {!subsLoading && !listingId && (
          <div className="mt-8 rounded-xl bg-white p-8 text-center">
            <p className="font-sans text-sm text-charcoal/70">
              You don't have any listings with subscriptions yet.
            </p>
            <button
              type="button"
              onClick={() => navigate("/sell/plans")}
              className="mt-3 font-sans text-sm font-medium text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              Choose a plan
            </button>
          </div>
        )}

        {!subsLoading && listingId && (
          <>
            <div className="mt-8 rounded-xl bg-white p-6">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <div>
                  <p className="font-sans text-xs font-medium uppercase tracking-wide text-charcoal/50">
                    Listing
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-sans text-sm font-semibold text-charcoal">
                    <BuildingIcon className="h-4 w-4 text-charcoal/40" />
                    {listingName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-xs font-medium uppercase tracking-wide text-charcoal/50">
                    Active Subscriptions
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-primary-light/15 px-2.5 py-0.5 font-sans text-xs font-medium text-primary-dark">
                      Photo · {displayStatusLabel(photoSub)}
                    </span>
                    <span className="rounded-full bg-primary-light/15 px-2.5 py-0.5 font-sans text-xs font-medium text-primary-dark">
                      Video · {displayStatusLabel(videoSub)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-sans text-xs font-medium uppercase tracking-wide text-charcoal/50">
                    Expires
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-sans text-sm font-semibold text-charcoal">
                    <CalendarIcon className="h-4 w-4 text-charcoal/40" />
                    {currentSub?.expiry_date
                      ? `${new Date(currentSub.expiry_date).toLocaleDateString()}${
                          daysRemaining(currentSub.expiry_date) !== null
                            ? ` (${daysRemaining(currentSub.expiry_date)} days)`
                            : ""
                        }`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-xs font-medium uppercase tracking-wide text-charcoal/50">
                    Remaining Allowance
                  </p>
                  <p className="mt-1 font-sans text-sm font-semibold text-charcoal">
                    {currentSub
                      ? `${remaining} of ${currentSub.media_limit ?? "—"} ${
                          mediaTab === "PHOTO" ? "photos" : "videos"
                        }`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 inline-flex rounded-full border border-primary-light/40 bg-white p-1">
              <button
                type="button"
                onClick={() => setMediaTab("PHOTO")}
                className={`flex items-center gap-2 rounded-full px-5 py-2 font-sans text-sm font-semibold transition ${
                  mediaTab === "PHOTO"
                    ? "bg-primary text-cream"
                    : "text-primary-dark hover:bg-primary-light/10"
                }`}
              >
                <CameraIcon className="h-4 w-4" />
                Photos
              </button>
              <button
                type="button"
                onClick={() => setMediaTab("VIDEO")}
                className={`flex items-center gap-2 rounded-full px-5 py-2 font-sans text-sm font-semibold transition ${
                  mediaTab === "VIDEO"
                    ? "bg-primary text-cream"
                    : "text-primary-dark hover:bg-primary-light/10"
                }`}
              >
                <VideoIcon className="h-4 w-4" />
                Videos
              </button>
            </div>

            <div className="mt-6">
              {canUpload ? (
                <MediaUploader
                  listingId={listingId}
                  mediaType={mediaTab}
                  remaining={remaining}
                  onUploaded={refreshMedia}
                />
              ) : (
                <div className="rounded-xl border-2 border-dashed border-primary-light/40 bg-white/60 px-6 py-10 text-center">
                  <p className="font-sans text-sm text-charcoal/60">
                    {mediaTab === "PHOTO" ? "Photo" : "Video"} uploads are only
                    available while that subscription is active.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/sell/plans")}
                    className="mt-3 font-sans text-sm font-medium text-primary underline underline-offset-2 hover:text-primary-dark"
                  >
                    View subscription plans
                  </button>
                </div>
              )}
            </div>

            {mediaLoading && (
              <p className="mt-6 font-sans text-charcoal/60">
                Loading uploaded {mediaTab === "PHOTO" ? "photos" : "videos"}...
              </p>
            )}
            {mediaError && (
              <p className="mt-6 font-sans text-sm text-red-700">
                Couldn't load your uploads. Please refresh the page.
              </p>
            )}
            {!mediaLoading && !mediaError && (
              <MediaGrid
                items={mediaItems}
                mediaTypeLabel={mediaTab === "PHOTO" ? "photo" : "video"}
                onChange={refreshMedia}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}