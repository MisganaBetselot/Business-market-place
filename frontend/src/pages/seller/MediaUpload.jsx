import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Calendar,
  Link2,
  UploadCloud,
  Trash2,
  Info,
  ArrowLeft,
  Clock3,
  CheckCircle2,
  FileWarning,
  Pencil,
} from "lucide-react";
import { getMySubscriptions } from "../../api/sellerSubscriptions";

import { getMedia, uploadMedia, deleteMedia } from "../../api/media";

const STEPS = ["Business Details", "Payment", "Review", "Media", "Published"];

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

// Confirmed against media/models.py: MediaType choices are only PHOTO and
// VIDEO — there is no separate "VIDEO_LINK" type. Use VIDEO. The model
// also already has a real `video_url` URLField and `file_path` is
// nullable, so a file-less video-link row is genuinely valid at the
// model level (not something we're forcing in from the frontend).
const VIDEO_LINK_MEDIA_TYPE = "VIDEO";

function formatDuration(days) {
  if (!days) return "";
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} Month${months > 1 ? "s" : ""}`;
  }
  return `${days} Days`;
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

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
        status === "APPROVED"
          ? "bg-brand-50 text-brand-600"
          : status === "REJECTED"
          ? "bg-danger/10 text-danger"
          : "bg-gold-100 text-gold-500"
      }`}
    >
      {status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Pending Review"}
    </span>
  );
}

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
                {stepNumber}
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

export default function MediaUpload() {
  const { id: routeListingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const listingId = routeListingId ?? location.state?.listingId;
  const stateSelectedPlan = location.state?.selectedPlan;

  const [draftPhotos, setDraftPhotos] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [editingVideo, setEditingVideo] = useState(false);
  const [videoLinkError, setVideoLinkError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);

  const { data: subscriptionsData } = useQuery({
    queryKey: ["mySubscriptions"],
    queryFn: getMySubscriptions,
    retry: false,
  });
  const subscriptions = Array.isArray(subscriptionsData)
    ? subscriptionsData
    : subscriptionsData?.results ?? [];

  const activeSubscription = subscriptions.find(
    (s) => String(s.listing?.id) === String(listingId) && s.status === "ACTIVE"
  );
  const listing = location.state?.listing;
  const selectedPlan = activeSubscription
    ? {
        ...activeSubscription.plan,
        price: activeSubscription.plan_price,
        duration_days: activeSubscription.plan_duration_days,
        duration_label: activeSubscription.plan_name,
      }
    : stateSelectedPlan;

  const durationLabel = selectedPlan
    ? selectedPlan.duration_label ?? formatDuration(selectedPlan.duration ?? selectedPlan.duration_days)
    : "";
  const mediaLimit = selectedPlan?.media_limit ?? null;

  const { data: existingMedia } = useQuery({
    queryKey: ["media", listingId],
    queryFn: () => getMedia({ listingId }),
    enabled: !!listingId,
  });
  const allExistingItems = (Array.isArray(existingMedia) ? existingMedia : existingMedia?.results ?? [])
    .filter((item) => String(item.listing) === String(listingId));

  // Photos and the video link are two independent things — split them so
  // the photo-slot limit never blocks the video link, and vice versa.
  const existingItems = allExistingItems.filter((item) => item.media_type !== VIDEO_LINK_MEDIA_TYPE);
  const videoItems = allExistingItems.filter((item) => item.media_type === VIDEO_LINK_MEDIA_TYPE);
  const currentVideoItem =
    videoItems.length > 0
      ? [...videoItems].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : null;
  // Follows the same lifecycle as photos: locked while pending or already
  // approved (changing an approved link should require going through
  // review again, not silently swap what's already live), editable if
  // there's none yet, it was rejected, or the seller explicitly chose to
  // change it.
  const videoLocked =
    !!currentVideoItem && currentVideoItem.status !== "REJECTED" && !editingVideo;

  // FIX: a REJECTED photo was counting against the plan's photo limit
  // forever, blocking the seller from ever uploading a replacement once
  // they'd hit the limit (confirmed live - 6 total uploads against a
  // limit of 3, several rejected, still blocked). It's still shown below
  // in the grid (so the seller knows to remove/replace it), but no
  // longer counted toward "how many photos does this listing have" -
  // matches the same fix applied server-side in media/serializers.py.
  const existingCount = existingItems.filter((item) => item.status !== "REJECTED").length;
  const mediaSummary = summarizeMedia(existingItems);

  const totalUsed = existingCount + draftPhotos.length;
  const remaining = mediaLimit != null ? Math.max(mediaLimit - totalUsed, 0) : null;
  const percentUsed = mediaLimit ? Math.min((totalUsed / mediaLimit) * 100, 100) : 0;

  useEffect(() => {
    return () => {
      draftPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload a JPG, PNG, or WEBP photo.";
    }
    if (file.size > MAX_FILE_BYTES) {
      return "File is too large. Maximum size is 8 MB.";
    }
    return null;
  }

  function addFiles(fileList) {
    setFileError("");
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    if (remaining != null && files.length > remaining) {
      setFileError(`You can only add ${remaining} more photo${remaining === 1 ? "" : "s"} on this plan.`);
      return;
    }

    const validated = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        return;
      }
      validated.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setDraftPhotos((prev) => [...prev, ...validated]);
  }

  function removeDraft(id) {
    setDraftPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  // Photos only now — the video link has its own mutation below and is no
  // longer silently dropped when there are zero draft photos.
  const submitMutation = useMutation({
    mutationFn: async () => {
      for (const draft of draftPhotos) {
        const formData = new FormData();
        formData.append("file_path", draft.file);
        formData.append("subscription", activeSubscription?.id);
        formData.append("media_type", "PHOTO");
        if (listingId) formData.append("listing", listingId);
        await uploadMedia(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", listingId] });
      queryClient.invalidateQueries({ queryKey: ["mySubscriptions"] });
      setDraftPhotos([]);
      navigate("/sell/subscription-status", {
        state: { justSubmittedMedia: true },
      });
    },
    onError: (err) => {
      const data = err.response?.data;
      const realMessage =
        data?.detail ||
        (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) ||
        (data && typeof data === "object" && Object.values(data)[0]?.[0]);

      setSubmitError(realMessage || "Couldn't submit your media. Please try again.");
    },
  });

  // Separate, independent mutation for the video/social link — does not
  // touch photos, is not affected by remaining photo slots, and submits
  // for review the same way a photo does.
  const videoLinkMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (listingId) formData.append("listing", listingId);
      if (activeSubscription?.id) formData.append("subscription", activeSubscription.id);
      formData.append("media_type", VIDEO_LINK_MEDIA_TYPE);
      formData.append("video_url", videoUrl);
      return uploadMedia(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", listingId] });
      setVideoUrl("");
      setEditingVideo(false);
      setVideoLinkError("");
    },
    onError: (err) => {
      const data = err.response?.data;
      const realMessage =
        data?.detail ||
        (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) ||
        (data && typeof data === "object" && Object.values(data)[0]?.[0]);
      // Surface whatever the backend actually said — this is unconfirmed
      // functionality, so the real error is more useful here than a
      // generic fallback would be.
      setVideoLinkError(
        realMessage ||
          "Couldn't save the link — the backend may not support this yet."
      );
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId) => deleteMedia(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", listingId] });
    },
  });

  const categoryLabel = listing?.category?.name ?? listing?.category_name ?? null;
  const locationLabel = [listing?.region, listing?.city].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-surface-sunken px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl border-b border-border pb-8">
          <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Upload Business Media
          </h1>
          <p className="mt-4 text-base text-ink-soft">
            Photos and your video link are reviewed by an administrator
            before they appear publicly.
          </p>
        </div>

        <StepTracker currentStep={4} />

        {mediaSummary.state === "PENDING" && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-surface px-6 py-5">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" />
            <div>
              <p className="text-sm font-semibold text-ink">Media submitted — under review</p>
              <p className="mt-1 text-sm text-ink-soft">
                Your photos and video link are not publicly visible yet. An
                administrator will approve or reject them shortly.
              </p>
            </div>
          </div>
        )}

        {mediaSummary.state === "APPROVED" && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-surface px-6 py-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-ink">Media approved</p>
              <p className="mt-1 text-sm text-ink-soft">
                All submitted photos passed review and are now public on your listing.
              </p>
            </div>
          </div>
        )}

        {mediaSummary.state === "REJECTED" && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-6 py-5">
            <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-ink">Some media was rejected</p>
              <ul className="mt-1 space-y-1 text-sm text-ink-soft">
                {mediaSummary.items.map((item) => (
                  <li key={item.id}>{item.rejection_reason || "Rejected — reason not provided."}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-ink-soft">
                Upload replacement photos below, or add more if you have slots remaining.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-2xl border border-border bg-surface p-7 lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Selected Plan
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink">
              {durationLabel || "—"}
            </h2>
            {selectedPlan?.price != null && (
              <p className="mt-3 font-display text-3xl font-bold text-brand-600">
                ETB {Number(selectedPlan.price).toLocaleString()}
              </p>
            )}
            <p className="mt-1 text-sm text-ink-soft">One-time payment for this listing</p>

            <div className="mt-5 space-y-3 border-t border-border pt-5">
              <p className="flex items-start gap-2.5 text-sm text-ink">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Listing stays active for {durationLabel.toLowerCase() || "the plan duration"}
              </p>
              {mediaLimit != null && (
                <p className="flex items-start gap-2.5 text-sm text-ink">
                  <Camera className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  Upload up to {mediaLimit} photos
                </p>
              )}
              <p className="flex items-start gap-2.5 text-sm text-ink">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                Add a video or social media URL — hosted externally, linked
                from your listing
              </p>
            </div>

            {listing?.business_name && (
              <div className="mt-5 border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Subscription applies to
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">{listing.business_name}</p>
                {(categoryLabel || locationLabel) && (
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {[categoryLabel, locationLabel].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            )}
          </aside>

          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-surface p-7 sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                  <Camera className="h-5 w-5 text-brand-600" />
                  Photos
                </h3>
                {mediaLimit != null && (
                  <span className="text-sm font-medium text-ink-soft">
                    {totalUsed} / {mediaLimit} uploaded
                  </span>
                )}
              </div>

              {mediaLimit != null && (
                <>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">
                    {remaining} photo slot{remaining === 1 ? "" : "s"} remaining on this plan
                  </p>
                </>
              )}

              {existingItems.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {existingItems.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                      <img
                        src={item.file_path || item.file_url}
                        alt={item.filename || ""}
                        className="h-32 w-full object-cover"
                      />
                      <div className="p-3">
                        <p className="truncate text-sm font-medium text-ink">
                          {item.filename || `Photo ${existingItems.indexOf(item) + 1}`}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <StatusBadge status={item.status} />
                          {item.status !== "APPROVED" && (
                            <button
                              type="button"
                              onClick={() => deleteMediaMutation.mutate(item.id)}
                              disabled={deleteMediaMutation.isPending}
                              className="flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-danger disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (remaining !== 0) setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (remaining === 0) return;
                  addFiles(e.dataTransfer.files);
                }}
                className={`mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition ${
                  dragActive ? "border-brand-400 bg-brand-50" : "border-border bg-surface-sunken/60"
                } ${remaining === 0 ? "opacity-60" : ""}`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-ink-soft">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="mt-4 text-base font-medium text-ink">
                  Drag and drop your business photos
                </p>
                <p className="mt-1 text-ink-soft">or browse from your device</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={remaining === 0}
                  className="mt-6 rounded-full bg-brand-600 px-8 py-3 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Upload Photos
                </button>
                <p className="mt-5 text-sm text-ink-soft">
                  JPG, PNG or WEBP — maximum 8 MB per photo
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              {fileError && <p className="mt-3 text-sm text-danger">{fileError}</p>}

              {draftPhotos.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {draftPhotos.map((draft) => (
                    <div key={draft.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                      <img
                        src={draft.previewUrl}
                        alt={draft.file.name}
                        className="h-32 w-full object-cover"
                      />
                      <div className="p-3">
                        <p className="truncate text-sm font-medium text-ink">{draft.file.name}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-ink-soft">
                            Draft
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDraft(draft.id)}
                            className="flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {submitError && (
                <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {submitError}
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={draftPhotos.length === 0 || submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                  className="shrink-0 rounded-full bg-gold-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Photos for Review"}
                </button>
              </div>
            </div>

            {/* Video / social link — fully independent of the photo flow
                above: its own status, its own submit action, never
                blocked by photo slots and never blocking them either.
                NOTE: intended to be available on every plan, per product
                direction — but the backend currently rejects this for
                non-Video-type plans ("This subscription only allows
                photo uploads."). That's a backend-side restriction that
                needs removing too; this frontend gate alone doesn't
                control whether the submission actually succeeds. */}
            <div className="rounded-2xl border border-border bg-surface p-7 sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                  <Link2 className="h-5 w-5 text-brand-600" />
                  Video / Social Media
                </h3>
                {currentVideoItem && !editingVideo && (
                  <StatusBadge status={currentVideoItem.status} />
                )}
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                We don't host videos. Paste a link to YouTube, TikTok,
                Instagram or Facebook and visitors will be redirected to
                your page. Like photos, this is reviewed by an administrator
                before it goes live — and changing an approved link sends
                it back for review rather than updating it instantly.
              </p>

              {currentVideoItem?.status === "REJECTED" && !editingVideo && (
                <p className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {currentVideoItem.rejection_reason || "Rejected — reason not provided."}
                </p>
              )}

              {videoLocked ? (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-sunken/60 px-5 py-3">
                  <p className="truncate text-sm text-ink">
                    {currentVideoItem.video_url || currentVideoItem.url || currentVideoItem.link}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrl(currentVideoItem.video_url || currentVideoItem.url || currentVideoItem.link || "");
                      setEditingVideo(true);
                    }}
                    className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Change Link
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Paste video or social media URL"
                    className="mt-4 w-full rounded-full border border-border bg-surface px-5 py-3 text-sm text-ink outline-none transition focus:border-brand-400"
                  />

                  {videoLinkError && (
                    <p className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                      {videoLinkError}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="flex items-start gap-1.5 text-xs text-ink-soft">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Reviewed by an administrator before it appears on your listing.
                    </p>
                    <div className="flex shrink-0 gap-2">
                      {editingVideo && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVideo(false);
                            setVideoUrl("");
                            setVideoLinkError("");
                          }}
                          className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-sunken"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!videoUrl.trim() || videoLinkMutation.isPending}
                        onClick={() => videoLinkMutation.mutate()}
                        className="rounded-full bg-gold-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {videoLinkMutation.isPending ? "Saving..." : "Save Link for Review"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border pt-7">
              <button
                type="button"
                onClick={() => navigate("/sell/subscription-status")}
                className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-sunken"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}