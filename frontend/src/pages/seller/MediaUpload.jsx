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
} from "lucide-react";
import { getMySubscriptions } from "../../api/sellerSubscriptions";
import { getMedia, uploadMedia } from "../../api/media";

const STEPS = ["Business Details", "Payment", "Review", "Media", "Published"];

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

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
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);

  // Always fetch the real subscription list — never skip this just because
  // navigation state happened to include a plan. The passed-through
  // subscriptionId/selectedPlan can be stale or simply wrong (confirmed
  // bug: a leftover subscription from a different listing got attached to
  // an upload here). The one source of truth is: which ACTIVE subscription
  // actually belongs to THIS listing, right now, according to the backend.
  const { data: subscriptionsData } = useQuery({
    queryKey: ["mySubscriptions"],
    queryFn: getMySubscriptions,
    retry: false,
  });
  const subscriptions = Array.isArray(subscriptionsData)
    ? subscriptionsData
    : subscriptionsData?.results ?? [];

  const activeSubscription = subscriptions.find(
    (s) => String(s.listing) === String(listingId) && s.status === "ACTIVE"
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
  // TODO: backend ignores the ?listing= filter entirely right now (confirmed
  // live - request for listing=33 returned items from listings 31/32/33 all
  // mixed together). Filtering client-side as a stopgap until fixed there.
  const existingItems = (Array.isArray(existingMedia) ? existingMedia : existingMedia?.results ?? [])
    .filter((item) => String(item.listing) === String(listingId));
  const existingCount = existingItems.length;
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

    if (remaining != null && draftPhotos.length + files.length > remaining) {
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

  const submitMutation = useMutation({
    mutationFn: async () => {
      for (const draft of draftPhotos) {
        const formData = new FormData();
        formData.append("file_path", draft.file);
        formData.append("subscription", activeSubscription?.id);
        formData.append("media_type", "PHOTO");
        if (listingId) formData.append("listing", listingId);

        // NOTE: video_url has no confirmed backend field yet (per the
        // integration report — Media.file_path is a FileField only, no
        // URL field exists). Sending it here as a best-effort guess;
        // if the backend rejects/ignores it, that's expected until a
        // real field is added — do not silently treat this as working.
        if (videoUrl) formData.append("video_url", videoUrl);

        await uploadMedia(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", listingId] });
      queryClient.invalidateQueries({ queryKey: ["mySubscriptions"] });
      setDraftPhotos([]);
      // Navigate back to the status page and flag that this was just
      // submitted, so it can show a clear one-time confirmation banner
      // instead of the seller having to notice the per-card state.
      navigate("/sell/subscription-status", {
        state: { justSubmittedMedia: true },
      });
    },
    onError: (err) => {
      setSubmitError(
        err.response?.data?.detail ||
          "Couldn't submit your media. Please try again."
      );
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
                          {item.filename || `Photo #${item.id}`}
                        </p>
                        <span
                          className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.status === "APPROVED"
                              ? "bg-brand-50 text-brand-600"
                              : item.status === "REJECTED"
                              ? "bg-danger/10 text-danger"
                              : "bg-gold-100 text-gold-500"
                          }`}
                        >
                          {item.status === "APPROVED"
                            ? "Approved"
                            : item.status === "REJECTED"
                            ? "Rejected"
                            : "Pending Review"}
                        </span>
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
            </div>

            <div className="rounded-2xl border border-border bg-surface p-7 sm:p-9">
              <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                <Link2 className="h-5 w-5 text-brand-600" />
                Video / Social Media
              </h3>
              <p className="mt-2 text-sm text-ink-soft">
                We don't host videos. Paste a link to YouTube, TikTok,
                Instagram or Facebook and visitors will be redirected to
                your page.
              </p>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste video or social media URL"
                className="mt-4 w-full rounded-full border border-border bg-surface px-5 py-3 text-sm text-ink outline-none transition focus:border-brand-400"
              />
              <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-soft">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Backend support for saving this link is still being
                confirmed with the team — it may not persist yet.
              </p>
            </div>

            {submitError && (
              <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                {submitError}
              </p>
            )}

            <div className="flex items-center justify-between gap-4 border-t border-border pt-7">
              <button
                type="button"
                onClick={() => navigate("/sell/subscription-status")}
                className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-sunken"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex items-center gap-4">
                <p className="text-sm text-ink-soft">
                  Submitted media stays private until an administrator
                  approves it.
                </p>
                <button
                  type="button"
                  disabled={draftPhotos.length === 0 || submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                  className="shrink-0 rounded-full bg-gold-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}