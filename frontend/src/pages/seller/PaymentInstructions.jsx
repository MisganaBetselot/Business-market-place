import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  CheckCircle2,
  Clock3,
  FileWarning,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { getMySubscriptions } from "../../api/sellerSubscriptions";
import { getLatestReceipt, uploadPaymentReceipt } from "../../api/payments";

// Temporary payment information. Replace with real business payment
// details when available.
const DEMO_PAYMENT_INFO = {
  bankName: "Commercial Bank of Ethiopia (Demo)",
  accountName: "Business Marketplace PLC (Demo)",
  accountNumber: "1000 2345 6789 01",
};

const STATUS = {
  PENDING: { label: "Payment Pending", badge: "bg-amber-100 text-amber-800" },
  UNDER_REVIEW: { label: "Receipt Under Review", badge: "bg-purple-100 text-purple-800" },
  APPROVED: { label: "Approved", badge: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", badge: "bg-red-100 text-red-800" },
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const STEPS = ["Business Details", "Payment", "Review", "Media", "Published"];

function formatDuration(days) {
  if (!days) return "";
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} Month${months > 1 ? "s" : ""}`;
  }
  return `${days} Days`;
}

// Map backend receipt/subscription status to a UI status.
function statusFromReceipt(subscriptionStatus, receipt) {
  if (subscriptionStatus === "REJECTED") return "REJECTED";
  if (!receipt) return "PENDING";
  if (receipt.status === "APPROVED") return "APPROVED";
  if (receipt.status === "REJECTED") return "REJECTED";
  return "UNDER_REVIEW";
}

function CopyIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 12.5H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h7A1.5 1.5 0 0 1 12.5 4v.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function InfoIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6.7" r="0.9" fill="currentColor" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepTracker({ currentStep }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3 rounded-2xl border border-border bg-surface px-6 py-5">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  isDone
                    ? "bg-brand-600 text-white"
                    : isCurrent
                    ? "bg-brand-600 text-white"
                    : "bg-surface-sunken text-ink-soft"
                }`}
              >
                {isDone ? <CheckCircleIcon className="h-3.5 w-3.5" /> : stepNumber}
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

export default function PaymentInstructions() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Values passed from BusinessInformation.jsx
  const selectedPlan = location.state?.selectedPlan;
  const listing = location.state?.listing;
  const listingId = location.state?.listingId || listing?.id;
  const subscriptionId = location.state?.subscriptionId;

  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const {
    data: subscriptionsData,
    isLoading: subsLoading,
    isError: subsError,
  } = useQuery({
    queryKey: ["mySubscriptions"],
    queryFn: getMySubscriptions,
    retry: false,
  });

  const subscriptions = Array.isArray(subscriptionsData)
    ? subscriptionsData
    : subscriptionsData?.results ?? [];

  // Prefer the exact subscription passed through navigation state. If the
  // page was refreshed and it's gone, fall back to the latest PENDING one.
  const currentSubscription =
    subscriptions.find((item) => item.id === subscriptionId) ||
    subscriptions.find((item) => item.status === "PENDING") ||
    subscriptions[0];

  const sellerSubscriptionId = subscriptionId || currentSubscription?.id;
  const displayPlan = selectedPlan || currentSubscription?.plan;

  const durationLabel = displayPlan
    ? displayPlan.duration_label ??
      formatDuration(displayPlan.duration ?? displayPlan.duration_days)
    : "";

  const { data: receipt, isLoading: receiptLoading } = useQuery({
    queryKey: ["latestReceipt", sellerSubscriptionId],
    queryFn: () => getLatestReceipt(sellerSubscriptionId),
    enabled: !!sellerSubscriptionId,
    retry: false,
  });

const uploadMutation = useMutation({
  mutationFn: () => uploadPaymentReceipt(sellerSubscriptionId, file),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["latestReceipt", sellerSubscriptionId] });
    queryClient.invalidateQueries({ queryKey: ["mySubscriptions"] });
    setFile(null);
    setFileError(null);
    navigate("/sell/subscription-status");
  },
});

  const currentState = statusFromReceipt(currentSubscription?.status, receipt);
  const status = STATUS[currentState];
  const canUpload = currentState === "PENDING" || currentState === "REJECTED";
  const canUploadMedia = currentState === "APPROVED" && !!listingId;
  const loading = subsLoading || (!!sellerSubscriptionId && receiptLoading);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DEMO_PAYMENT_INFO.accountNumber.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  function validateFile(candidate) {
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      return "Unsupported file type. Please upload a JPG, PNG or PDF.";
    }
    if (candidate.size > MAX_FILE_BYTES) {
      return "File is too large. Maximum size is 5 MB.";
    }
    return null;
  }

  function handleFileSelect(candidate) {
    if (!candidate) return;
    const error = validateFile(candidate);
    if (error) {
      setFileError(error);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(candidate);
  }

  function handleUploadMedia() {
    if (!canUploadMedia) return;
    navigate(`/sell/listings/${listingId}/media`, {
      state: { listingId, subscriptionId: sellerSubscriptionId, selectedPlan: displayPlan },
    });
  }

  const categoryLabel = listing?.category?.name ?? listing?.category_name ?? null;
  const locationLabel = [categoryLabel, listing?.region].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-surface-sunken px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl border-b border-border pb-8">
          <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Complete Your Payment
          </h1>
          <p className="mt-4 text-base text-ink-soft">
            Payment is completed outside the platform. Transfer the amount
            below, then upload your receipt for verification.
          </p>
        </div>

        <StepTracker currentStep={2} />

        {subsError && !selectedPlan && (
          <p className="mt-6 rounded-lg bg-danger/5 border border-danger/20 px-4 py-3 text-sm text-danger">
            Couldn't load your subscription. Please try again.
          </p>
        )}

        {!subsLoading && !subsError && !displayPlan && (
          <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-center">
            <p className="text-sm text-ink-soft">
              There's no pending subscription to pay for right now.
            </p>
            <button
              type="button"
              onClick={() => navigate("/sell/plans")}
              className="mt-3 text-sm font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
            >
              Choose a plan
            </button>
          </div>
        )}

        {displayPlan && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
            {/* Selected plan */}
            <aside className="h-fit rounded-2xl border border-border bg-surface p-7 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Selected Plan
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink">
                {durationLabel}
              </h2>
              <p className="mt-3 font-display text-3xl font-bold text-brand-600">
                ETB {Number(displayPlan.price).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-ink-soft">One-time payment for this listing</p>

              <div className="mt-5 space-y-3 border-t border-border pt-5">
                <p className="flex items-start gap-2.5 text-sm text-ink">
                  <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600">
                    <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Listing stays active for {durationLabel.toLowerCase()}
                </p>
                {displayPlan.media_limit != null && (
                  <p className="flex items-start gap-2.5 text-sm text-ink">
                    <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600">
                      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h1.6l.7-1.2A1.5 1.5 0 0 1 8.1 4h3.8a1.5 1.5 0 0 1 1.3.8l.7 1.2h1.6A1.5 1.5 0 0 1 17 7.5v6A1.5 1.5 0 0 1 15.5 15h-11A1.5 1.5 0 0 1 3 13.5v-6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                    Upload up to {displayPlan.media_limit} photos
                  </p>
                )}
                <p className="flex items-start gap-2.5 text-sm text-ink">
                  <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600">
                    <path d="M8.5 11.5 11.5 8.5M7.5 12.5 5 15a2.5 2.5 0 1 1-3.5-3.5l2.5-2.5M12.5 7.5 15 5a2.5 2.5 0 1 1 3.5 3.5l-2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Add a video or social media URL — hosted externally, linked
                  from your listing
                </p>
              </div>

              {displayPlan.description && (
                <div className="mt-5 rounded-xl bg-surface-sunken p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <InfoIcon className="h-3.5 w-3.5 text-ink-soft" />
                    About this plan
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">
                    {displayPlan.description}
                  </p>
                  {displayPlan.best_suited_for && (
                    <p className="mt-2 text-sm leading-6 text-ink-soft">
                      <span className="font-semibold text-ink">Best suited for:</span>{" "}
                      {displayPlan.best_suited_for}
                    </p>
                  )}
                </div>
              )}

              {listing?.business_name && (
                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Subscription applies to
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {listing.business_name}
                  </p>
                  {locationLabel && (
                    <p className="mt-0.5 text-sm text-ink-soft">{locationLabel}</p>
                  )}
                </div>
              )}
            </aside>

            {/* Payment + receipt */}
            <div className="space-y-8">
              {/* Payment details */}
              <div className="rounded-2xl border border-border bg-surface p-7 sm:p-9">
                <h3 className="font-display text-xl font-bold text-ink">
                  Payment details
                </h3>
                <p className="mt-1 text-sm text-ink-soft">
                  Transfer ETB {Number(displayPlan.price).toLocaleString()} for
                  the {durationLabel.toLowerCase()} listing
                  {listing?.business_name ? ` of ${listing.business_name}` : ""},
                  then upload proof of payment.
                </p>

                <div className="mt-6 rounded-2xl bg-surface-sunken p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Bank Transfer Details
                  </p>

                  <div className="mt-4">
                    <p className="text-sm text-ink-soft">Bank name</p>
                    <p className="mt-0.5 text-base font-semibold text-ink">
                      {DEMO_PAYMENT_INFO.bankName}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-ink-soft">Account name</p>
                    <p className="mt-0.5 text-base font-semibold text-ink">
                      {DEMO_PAYMENT_INFO.accountName}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-ink-soft">Account number</p>
                      <p className="mt-0.5 font-mono text-base font-semibold text-ink">
                        {DEMO_PAYMENT_INFO.accountNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-sunken"
                    >
                      <CopyIcon className="h-4 w-4" />
                      {copied ? "Copied" : "Copy account number"}
                    </button>
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-sm text-ink-soft">Amount due</p>
                    <p className="mt-0.5 font-display text-lg font-bold text-brand-600">
                      ETB {Number(displayPlan.price).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-xl border border-gold-400 bg-gold-100/40 p-4">
                  <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Use your business name as the transfer reference
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Your subscription only becomes active after an
                      administrator approves the uploaded receipt. Media
                      upload stays locked until then.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload receipt */}
              <div className="rounded-2xl border border-border bg-surface p-7 sm:p-9">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">
                      Upload payment receipt
                    </h3>
                    <p className="mt-1 text-sm text-ink-soft">
                      Attach a clear photo or PDF of your transfer
                      confirmation.
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${status.badge}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-6">
                  {loading ? (
                    <div className="rounded-xl border-2 border-dashed border-border bg-surface-sunken/60 p-16 text-center text-sm text-ink-soft">
                      Loading your subscription status&hellip;
                    </div>
                  ) : canUpload ? (
                    <UploadPanel
                      file={file}
                      fileError={fileError}
                      isDragging={isDragging}
                      submitting={uploadMutation.isPending}
                      submitError={
                        uploadMutation.isError
                          ? uploadMutation.error?.response?.data?.detail ||
                            "Couldn't submit your receipt. Please try again."
                          : null
                      }
                      rejectionReason={
                        currentState === "REJECTED" ? receipt?.rejection_reason : null
                      }
                      inputRef={inputRef}
                      onBrowseClick={() => inputRef.current?.click()}
                      onInputChange={(e) => handleFileSelect(e.target.files?.[0])}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFileSelect(e.dataTransfer.files?.[0]);
                      }}
                      onClear={() => {
                        setFile(null);
                        setFileError(null);
                      }}
                      onSubmit={() => uploadMutation.mutate()}
                    />
                  ) : (
                    <StatusPanel
                      state={currentState}
                      subscription={currentSubscription}
                      listingId={listingId}
                      onUploadMedia={handleUploadMedia}
                    />
                  )}
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-border pt-7">
                  <button
                    type="button"
                    onClick={() => navigate("/sell/business-information", { state: { selectedPlan: displayPlan } })}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-sunken"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to listing details
                  </button>

                  {canUpload && (
                    <button
                      type="button"
                      disabled={!file || uploadMutation.isPending}
                      onClick={() => uploadMutation.mutate()}
                      className="cursor-pointer rounded-full bg-gold-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:brightness-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                    >
                      {uploadMutation.isPending ? "Submitting..." : "Submit Receipt for Review"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload dropzone
// ---------------------------------------------------------------------------
function UploadPanel({
  file,
  fileError,
  isDragging,
  rejectionReason,
  inputRef,
  onBrowseClick,
  onInputChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onClear,
}) {
  return (
    <div>
      {rejectionReason && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 px-5 py-4 text-danger">
          <FileWarning className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Your last receipt was rejected</p>
            <p className="mt-1 text-sm">{rejectionReason}</p>
          </div>
        </div>
      )}

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging ? "border-brand-400 bg-brand-50" : "border-border bg-surface-sunken/60"
        }`}
      >
        {file ? (
          <div className="flex w-full items-center gap-4 rounded-xl bg-surface px-5 py-4 text-left">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-sunken">
              <FileText className="h-5 w-5 text-ink-soft" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{file.name}</p>
              <p className="text-xs text-ink-soft">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={onBrowseClick}
                className="cursor-pointer rounded-full border border-border bg-surface-sunken px-4 py-2 text-sm font-medium text-ink transition hover:bg-border/40"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onClear}
                className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-sunken"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-ink-soft">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="mt-5 text-lg font-medium text-ink">
              Drag and drop your payment receipt
            </p>
            <p className="mt-1 text-ink-soft">or browse from your device</p>
            <button
              type="button"
              onClick={onBrowseClick}
              className="mt-6 cursor-pointer rounded-full bg-brand-600 px-8 py-3 font-medium text-white transition hover:bg-brand-700"
            >
              Browse Files
            </button>
            <p className="mt-5 text-sm text-ink-soft">
              Supported files: JPG, PNG, PDF &mdash; maximum 5 MB
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={onInputChange}
          className="hidden"
        />
      </div>

      {fileError && <p className="mt-3 text-sm text-danger">{fileError}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Non-upload states: under review / approved
// ---------------------------------------------------------------------------
function StatusPanel({ state, subscription, listingId, onUploadMedia }) {
  const config = {
    UNDER_REVIEW: {
      icon: Clock3,
      iconClass: "bg-purple-100 text-purple-800",
      title: "Your receipt is under review",
      body: "An administrator is verifying your payment. This usually takes a short while.",
    },
    APPROVED: {
      icon: CheckCircle2,
      iconClass: "bg-green-100 text-green-800",
      title: "Subscription active",
      body: subscription?.expiry_date
        ? `Your payment was verified. Your subscription is active until ${new Date(
            subscription.expiry_date
          ).toLocaleDateString()}.`
        : "Your payment was verified and your subscription is now active.",
    },
  }[state];

  if (!config) return null;
  const Icon = config.icon;
  const mediaButtonEnabled = state === "APPROVED" && !!listingId;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-sunken/60 px-6 py-12 text-center">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${config.iconClass}`}>
        <Icon className="h-7 w-7" />
      </div>
      <p className="mt-5 text-lg font-medium text-ink">{config.title}</p>
      <p className="mt-2 max-w-md text-ink-soft">{config.body}</p>

      <button
        type="button"
        disabled={!mediaButtonEnabled}
        onClick={onUploadMedia}
        className={`mt-6 cursor-pointer rounded-full px-8 py-3 font-medium transition ${
          mediaButtonEnabled
            ? "bg-gold-500 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:brightness-95"
            : "cursor-not-allowed bg-border text-ink-soft"
        }`}
      >
        Upload Media
      </button>

      {!mediaButtonEnabled && (
        <p className="mt-3 text-xs text-ink-soft">
          Upload Media will be available after your payment is approved.
        </p>
      )}
    </div>
  );
}