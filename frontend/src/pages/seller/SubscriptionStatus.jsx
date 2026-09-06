import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  Calendar,
  Link2,
  CheckCircle2,
  Clock3,
  FileWarning,
  Plus,
  X,
} from "lucide-react";
import { getMySubscriptions } from "../../api/sellerSubscriptions";
import { getMedia } from "../../api/media";

const STEPS = ["Business Details", "Payment", "Review", "Media", "Published"];

function formatDuration(days) {
  if (!days) return "";
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} Month${months > 1 ? "s" : ""}`;
  }
  return `${days} Days`;
}

function stepForSubscription(subscription, mediaItems) {
  const listingStatus = subscription?.listing?.status;
  if (listingStatus === "ACTIVE") return 5;
  if (subscription?.status === "ACTIVE" && mediaItems?.length > 0) return 4;
  if (subscription?.status === "ACTIVE") return 4;
  if (subscription?.status === "REJECTED") return 2;
  return 3; // PENDING (payment submitted, awaiting admin review)
}

const STATUS_BADGE = {
  PENDING: { label: "Pending Review", className: "bg-gold-100 text-gold-500" },
  ACTIVE: { label: "Approved", className: "bg-brand-50 text-brand-600" },
  REJECTED: { label: "Rejected", className: "bg-danger/10 text-danger" },
  EXPIRED: { label: "Expired", className: "bg-surface-sunken text-ink-soft" },
  CANCELLED: { label: "Cancelled", className: "bg-surface-sunken text-ink-soft" },
};

function StepTracker({ currentStep }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-3 rounded-2xl border border-border bg-surface px-6 py-5">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  isDone || isCurrent
                    ? "bg-brand-600 text-white"
                    : "bg-surface-sunken text-ink-soft"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNumber}
              </span>
              <span className={`text-sm ${isCurrent ? "font-semibold text-ink" : "text-ink-soft"}`}>
                {label}
              </span>
            </div>
            {stepNumber < STEPS.length && (
              <span className="h-px w-8 bg-border sm:w-12" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function summarizeMedia(mediaItems) {
  if (!mediaItems || mediaItems.length === 0) return { state: "NONE" };
  const anyRejected = mediaItems.some((m) => m.status === "REJECTED");
  const anyPending = mediaItems.some((m) => m.status === "PENDING_REVIEW");
  const allApproved = mediaItems.every((m) => m.status === "APPROVED");
  if (anyRejected) return { state: "REJECTED", items: mediaItems.filter((m) => m.status === "REJECTED") };
  if (anyPending) return { state: "PENDING" };
  if (allApproved) return { state: "APPROVED" };
  return { state: "NONE" };
}

// Only the single most recent video submission matters (a seller can
// replace/resubmit a video link, leaving older rejected/superseded
// attempts behind it) - unlike photos, where every item that passed
// review stays live at once.
function summarizeVideo(videoItems) {
  if (!videoItems || videoItems.length === 0) return { state: "NONE" };
  const latest = [...videoItems].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )[0];
  if (latest.status === "REJECTED") return { state: "REJECTED", item: latest };
  if (latest.status === "PENDING_REVIEW") return { state: "PENDING", item: latest };
  if (latest.status === "APPROVED") return { state: "APPROVED", item: latest };
  return { state: "NONE" };
}

function ListingSubscriptionCard({ subscription, onUploadMedia, onResubmitPayment }) {
  const plan = subscription.plan;
  const listing = subscription.listing; // ASSUMPTION — see file-level note
  const listingId = listing?.id ?? subscription.listing_id ?? subscription.listing;

  const { data: mediaData } = useQuery({
    queryKey: ["media", listingId],
    queryFn: () => getMedia({ listingId }),
    enabled: subscription.status === "ACTIVE" && !!listingId,
  });
  const mediaItems = (Array.isArray(mediaData) ? mediaData : mediaData?.results ?? [])
    .filter((item) => String(item.listing) === String(listingId));

  // Photos and video are two independent things with independent review
  // statuses - matches how MediaUpload.jsx already treats them. A
  // combined single "Media" badge was hiding real information (e.g.
  // photos fully approved but the video link still pending showed as
  // just "Pending Review" overall, which is misleading).
  const photoItems = mediaItems.filter((item) => item.media_type !== "VIDEO");
  const videoItems = mediaItems.filter((item) => item.media_type === "VIDEO");
  const mediaSummary = summarizeMedia(photoItems);
  const videoSummary = summarizeVideo(videoItems);

  const durationLabel = plan?.duration_label ?? formatDuration(plan?.duration ?? plan?.duration_days);
  const badge = STATUS_BADGE[subscription.status] ?? STATUS_BADGE.PENDING;
  const currentStep = stepForSubscription(subscription, mediaItems);

  // FIX: was mediaItems.length (all statuses, including REJECTED),
  // which inflated the "used" count forever once anything got rejected
  // - a rejected photo isn't going public, so it shouldn't count toward
  // the plan's limit. Matches the same fix applied in
  // media/serializers.py and MediaUpload.jsx.
  const activeMediaCount = photoItems.filter((item) => item.status !== "REJECTED").length;
  const mediaUsed = activeMediaCount || subscription.media_used || listing?.media_used || 0;
  const mediaLimit = plan?.media_limit ?? subscription.media_limit ?? null;
  const videoUrl =
    videoSummary.state === "APPROVED"
      ? videoSummary.item?.video_url ?? listing?.video_url ?? null
      : null;

  const businessName = listing?.business_name ?? "Untitled listing";
  const categoryLabel = listing?.category?.name ?? listing?.category_name ?? null;
  const locationLabel = [listing?.region, listing?.city].filter(Boolean).join(", ");
  const subtitle = [categoryLabel, locationLabel].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl border border-border bg-surface p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display text-lg font-bold text-ink">{businessName}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
            {subscription.status === "ACTIVE" && mediaSummary.state !== "NONE" && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mediaSummary.state === "PENDING"
                    ? "bg-gold-100 text-gold-500"
                    : mediaSummary.state === "APPROVED"
                    ? "bg-brand-50 text-brand-600"
                    : "bg-danger/10 text-danger"
                }`}
              >
                Media ·{" "}
                {mediaSummary.state === "PENDING"
                  ? "Pending Review"
                  : mediaSummary.state === "APPROVED"
                  ? "Approved"
                  : "Rejected"}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap gap-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Plan</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Calendar className="h-3.5 w-3.5 text-ink-soft" />
              {durationLabel || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Photos</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Camera className="h-3.5 w-3.5 text-ink-soft" />
              {mediaLimit != null ? `${mediaUsed} / ${mediaLimit}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Video URL</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Link2 className="h-3.5 w-3.5 text-ink-soft" />
              {videoUrl ? (
                <a href={videoUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                  View link
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
      </div>

      <StepTracker currentStep={currentStep} />

      <div className="mt-6">
        {subscription.status === "PENDING" && (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-sunken/60 px-5 py-4">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" />
            <div>
              <p className="text-sm font-semibold text-ink">Your payment is under review.</p>
              <p className="mt-1 text-sm text-ink-soft">
                An administrator is verifying your receipt. Reviews usually
                complete within 24 hours. Media upload stays locked until
                your payment is approved.
              </p>
            </div>
          </div>
        )}

        {subscription.status === "REJECTED" && (
          <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 px-5 py-4">
            <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-ink">Your payment was rejected.</p>
              {subscription.rejection_reason && (
                <p className="mt-1 text-sm text-ink-soft">{subscription.rejection_reason}</p>
              )}
              <button
                type="button"
                onClick={() => onResubmitPayment(subscription)}
                className="mt-3 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Resubmit Payment
              </button>
            </div>
          </div>
        )}

        {subscription.status === "ACTIVE" && (
          <div className="rounded-xl border border-border bg-surface-sunken/60 px-5 py-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-ink">Your payment has been approved.</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Your {durationLabel.toLowerCase() || "subscription"} is active
                  for this listing. You can now upload your business media.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUploadMedia(subscription)}
              className="mt-4 rounded-full bg-gold-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
            >
              {mediaSummary.state === "NONE" ? "Upload Business Media" : "Manage Media"}
            </button>

            {mediaSummary.state === "NONE" && (
              <div className="mt-4 rounded-xl bg-surface p-4">
                <p className="text-sm font-semibold text-ink">Media not submitted</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Add up to {mediaLimit ?? "your plan's"} photos and an
                  optional video URL, then submit them for review.
                </p>
              </div>
            )}

            {mediaSummary.state === "PENDING" && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-surface p-4">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" />
                <div>
                  <p className="text-sm font-semibold text-ink">Media under review</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    You've submitted {mediaUsed} photo{mediaUsed === 1 ? "" : "s"}. An
                    administrator is reviewing them before they go public.
                  </p>
                </div>
              </div>
            )}

            {mediaSummary.state === "APPROVED" && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-surface p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <p className="text-sm font-semibold text-ink">Media approved</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    All {mediaUsed} photo{mediaUsed === 1 ? "" : "s"} passed review.
                  </p>
                </div>
              </div>
            )}

            {mediaSummary.state === "REJECTED" && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4">
                <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-semibold text-ink">Some media was rejected</p>
                  <ul className="mt-1 space-y-1 text-sm text-ink-soft">
                    {mediaSummary.items.map((item) => (
                      <li key={item.id}>
                        {item.rejection_reason || "Rejected — reason not provided."}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => onUploadMedia(subscription)}
                    className="mt-3 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Upload replacement photos
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSubmittedBanner, setShowSubmittedBanner] = useState(
    Boolean(location.state?.justSubmittedMedia)
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mySubscriptions"],
    queryFn: getMySubscriptions,
    retry: false,
    refetchInterval: 8000,
  });

  const subscriptions = Array.isArray(data) ? data : data?.results ?? [];

  function handleUploadMedia(subscription) {
    const listingId = subscription.listing?.id;
    if (!listingId) return;
    navigate(`/sell/listings/${listingId}/media`, {
      state: { listingId, subscriptionId: subscription.id, selectedPlan: subscription.plan },
    });
  }

  function handleResubmitPayment(subscription) {
    const listingId = subscription.listing?.id;
    navigate("/sell/payment-instructions", {
      state: {
        selectedPlan: subscription.plan,
        listing: subscription.listing,
        listingId,
        subscriptionId: subscription.id,
      },
    });
  }

  return (
    <div className="min-h-screen bg-surface-sunken px-6 py-14">
      <div className="mx-auto max-w-5xl">
        {showSubmittedBanner && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-brand-100 bg-brand-50 px-6 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-ink">
                  Your media has been submitted.
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  It's now under review — an administrator will approve or
                  reject it shortly.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSubmittedBanner(false)}
              className="shrink-0 text-ink-soft hover:text-ink"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-ink">
              My Listings &amp; Subscriptions
            </h1>
            <p className="mt-2 text-ink-soft">
              Every business listing carries its own plan, payment status and
              media allowance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/sell/plans")}
            className="flex shrink-0 items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            New Listing
          </button>
        </div>

        {isLoading && (
          <p className="mt-10 text-ink-soft">Loading your listings...</p>
        )}

        {isError && (
          <p className="mt-10 text-sm text-danger">
            Couldn't load your listings. Please refresh the page.
          </p>
        )}

        {!isLoading && !isError && subscriptions.length === 0 && (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-10 text-center">
            <p className="text-sm text-ink-soft">
              You don't have any listings yet.
            </p>
            <button
              type="button"
              onClick={() => navigate("/sell/plans")}
              className="mt-3 text-sm font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
            >
              Create your first listing
            </button>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {subscriptions.map((subscription) => (
            <ListingSubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onUploadMedia={handleUploadMedia}
              onResubmitPayment={handleResubmitPayment}
            />
          ))}
        </div>
      </div>
    </div>
  );
}