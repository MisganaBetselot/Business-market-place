
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

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

const STATUS = {
  PENDING: {
    label: "Payment Pending",
    badge: "bg-amber-100 text-amber-800",
  },
  UNDER_REVIEW: {
    label: "Receipt Under Review",
    badge: "bg-purple-100 text-purple-800",
  },
  APPROVED: {
    label: "Approved",
    badge: "bg-green-100 text-green-800",
  },
  REJECTED: {
    label: "Rejected",
    badge: "bg-red-100 text-red-800",
  },
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

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

export default function ReceiptUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // Values passed from PaymentInstructions / BusinessInformation
  // -------------------------------------------------------------------------

  const selectedPlan = location.state?.selectedPlan;
  const listingId = location.state?.listingId;
  const subscriptionId = location.state?.subscriptionId;

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef(null);

  // -------------------------------------------------------------------------
  // Get seller subscriptions
  // -------------------------------------------------------------------------

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

  // Prefer the exact subscription passed through navigation state.
  // If the page was refreshed and subscriptionId is gone, fall back
  // to the latest subscription returned by the backend.
  const currentSubscription =
    subscriptions.find((item) => item.id === subscriptionId) ||
    subscriptions[0];

  const sellerSubscriptionId =
    subscriptionId || currentSubscription?.id;

  const displayPlan =
    selectedPlan || currentSubscription?.plan;

  const durationLabel = displayPlan
    ? displayPlan.duration_label ??
      formatDuration(
        displayPlan.duration ?? displayPlan.duration_days
      )
    : "";

  // -------------------------------------------------------------------------
  // Get latest payment receipt
  // -------------------------------------------------------------------------

  const {
    data: receipt,
    isLoading: receiptLoading,
  } = useQuery({
    queryKey: ["latestReceipt", sellerSubscriptionId],
    queryFn: () => getLatestReceipt(sellerSubscriptionId),
    enabled: !!sellerSubscriptionId,
    retry: false,
  });

  // -------------------------------------------------------------------------
  // Upload receipt mutation
  // -------------------------------------------------------------------------

  const uploadMutation = useMutation({
    mutationFn: () =>
      uploadPaymentReceipt(
        sellerSubscriptionId,
        file
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["latestReceipt", sellerSubscriptionId],
      });

      queryClient.invalidateQueries({
        queryKey: ["mySubscriptions"],
      });

      setFile(null);
      setFileError(null);
    },
  });

  // -------------------------------------------------------------------------
  // Current status
  // -------------------------------------------------------------------------

  const currentState = statusFromReceipt(
    currentSubscription?.status,
    receipt
  );

  const status = STATUS[currentState];

  const canUpload =
    currentState === "PENDING" ||
    currentState === "REJECTED";

  const canUploadMedia =
    currentState === "APPROVED" && !!listingId;

  const loading =
    subsLoading ||
    (!!sellerSubscriptionId && receiptLoading);

  // -------------------------------------------------------------------------
  // File validation
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Navigate to media upload
  // -------------------------------------------------------------------------

  function handleUploadMedia() {
    if (!canUploadMedia) return;

    navigate(`/sell/listings/${listingId}/media`, {
      state: {
        listingId,
        subscriptionId: sellerSubscriptionId,
        selectedPlan: displayPlan,
      },
    });
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-3xl">

        <h1 className="font-serif text-4xl font-bold text-charcoal">
          Upload Payment Receipt
        </h1>

        <p className="mt-2 font-sans text-charcoal/70">
          Submit proof of your off-platform payment so an administrator can
          verify and activate your subscription.
        </p>

        {/* Subscription loading error */}
        {subsError && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
            Couldn't load your subscription status. Please refresh.
          </p>
        )}

        {/* No plan */}
        {!subsLoading && !displayPlan && (
          <div className="mt-8 rounded-xl bg-white p-6 text-center">

            <p className="font-sans text-sm text-charcoal/70">
              There's no pending subscription to upload a receipt for right
              now.
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

        {displayPlan && (
          <>
            {/* -------------------------------------------------------------
                Subscription summary
            ------------------------------------------------------------- */}

            <div className="mt-8 flex items-start justify-between rounded-xl bg-white p-6">

              <div>

                <p className="font-sans text-xs font-medium uppercase tracking-wide text-charcoal/50">
                  Subscription Summary
                </p>

                <p className="mt-3 font-serif text-xl font-bold text-charcoal">
                  {displayPlan.media_type === "VIDEO"
                    ? "Video"
                    : "Photo"}{" "}
                  plan &middot; {durationLabel}
                </p>

                <p className="mt-1 font-sans text-charcoal/70">
                  ETB {Number(displayPlan.price).toLocaleString()}
                </p>

              </div>

              <span
                className={`whitespace-nowrap rounded-full px-4 py-2 font-sans text-sm font-medium ${status.badge}`}
              >
                {status.label}
              </span>

            </div>

            {/* -------------------------------------------------------------
                Main status / upload area
            ------------------------------------------------------------- */}

            <div className="mt-6">

              {loading ? (

                <div className="rounded-xl border-2 border-dashed border-charcoal/15 bg-white/60 p-16 text-center font-sans text-charcoal/50">
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
                    currentState === "REJECTED"
                      ? receipt?.rejection_reason
                      : null
                  }
                  inputRef={inputRef}
                  onBrowseClick={() =>
                    inputRef.current?.click()
                  }
                  onInputChange={(e) =>
                    handleFileSelect(e.target.files?.[0])
                  }
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() =>
                    setIsDragging(false)
                  }
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileSelect(
                      e.dataTransfer.files?.[0]
                    );
                  }}
                  onClear={() => {
                    setFile(null);
                    setFileError(null);
                  }}
                  onSubmit={() =>
                    uploadMutation.mutate()
                  }
                />

              ) : (

                <StatusPanel
                  state={currentState}
                  subscription={currentSubscription}
                  listingId={listingId}
                  sellerSubscriptionId={sellerSubscriptionId}
                  displayPlan={displayPlan}
                  onUploadMedia={handleUploadMedia}
                />

              )}

              {/* -----------------------------------------------------------
                  Back button
              ----------------------------------------------------------- */}

              <div className="mt-6">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/sell/payment-instructions", {
                      state: {
                        selectedPlan: displayPlan,
                        listingId,
                        subscriptionId: sellerSubscriptionId,
                      },
                    })
                  }
                  className="flex items-center gap-2 rounded-full border border-primary-light/50 px-5 py-2.5 font-sans text-sm font-semibold text-primary-dark transition hover:bg-primary-light/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload dropzone + submit
// ---------------------------------------------------------------------------

function UploadPanel({
  file,
  fileError,
  isDragging,
  submitting,
  submitError,
  rejectionReason,
  inputRef,
  onBrowseClick,
  onInputChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onClear,
  onSubmit,
}) {
  return (
    <div>

      {rejectionReason && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 px-5 py-4 text-red-700">

          <FileWarning className="mt-0.5 h-5 w-5 shrink-0" />

          <div>

            <p className="font-sans font-medium">
              Your last receipt was rejected
            </p>

            <p className="mt-1 font-sans text-sm">
              {rejectionReason}
            </p>

          </div>

        </div>
      )}

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary-light/10"
            : "border-charcoal/15 bg-white/60"
        }`}
      >

        {file ? (

          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light/15">
              <FileText className="h-7 w-7 text-primary-dark" />
            </div>

            <p className="mt-5 font-sans font-medium text-charcoal">
              {file.name}
            </p>

            <p className="mt-1 font-sans text-sm text-charcoal/50">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>

            <button
              type="button"
              onClick={onClear}
              className="mt-4 font-sans text-sm text-charcoal/70 underline decoration-charcoal/20 underline-offset-4 hover:text-charcoal"
            >
              Choose a different file
            </button>
          </>

        ) : (

          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal/10 text-charcoal/60">
              <UploadCloud className="h-7 w-7" />
            </div>

            <p className="mt-5 font-sans text-lg font-medium text-charcoal">
              Drag and drop your payment receipt
            </p>

            <p className="mt-1 font-sans text-charcoal/50">
              or browse from your device
            </p>

            <button
              type="button"
              onClick={onBrowseClick}
              className="mt-6 rounded-full bg-primary px-8 py-3 font-sans font-medium text-cream transition hover:bg-primary-dark"
            >
              Browse Files
            </button>

            <p className="mt-5 font-sans text-sm text-charcoal/50">
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

      {fileError && (
        <p className="mt-3 font-sans text-sm text-red-700">
          {fileError}
        </p>
      )}

      {submitError && (
        <p className="mt-3 font-sans text-sm text-red-700">
          {submitError}
        </p>
      )}

      <div className="mt-6">

        <button
          type="button"
          disabled={!file || submitting}
          onClick={onSubmit}
          className="rounded-full bg-primary px-8 py-3 font-sans font-medium text-cream transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Submitting..."
            : "Submit Receipt"}
        </button>

      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Non-upload states: under review / approved
// ---------------------------------------------------------------------------

function StatusPanel({
  state,
  subscription,
  listingId,
  sellerSubscriptionId,
  displayPlan,
  onUploadMedia,
}) {
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

  const mediaButtonEnabled =
    state === "APPROVED" && !!listingId;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-charcoal/15 bg-white/60 px-6 py-16 text-center">

      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${config.iconClass}`}
      >
        <Icon className="h-7 w-7" />
      </div>

      <p className="mt-5 font-sans text-lg font-medium text-charcoal">
        {config.title}
      </p>

      <p className="mt-2 max-w-md font-sans text-charcoal/70">
        {config.body}
      </p>

      {/* ---------------------------------------------------------------
          Upload Media
          
          Always visible.
          Disabled until payment is approved.
      ---------------------------------------------------------------- */}

      <button
        type="button"
        disabled={!mediaButtonEnabled}
        onClick={onUploadMedia}
        className={`mt-6 rounded-full px-8 py-3 font-sans font-medium transition ${
          mediaButtonEnabled
            ? "bg-primary text-cream hover:bg-primary-dark"
            : "cursor-not-allowed bg-charcoal/10 text-charcoal/40"
        }`}
      >
        Upload Media
      </button>

      {!mediaButtonEnabled && (
        <p className="mt-3 font-sans text-xs text-charcoal/50">
          Upload Media will be available after your payment is approved.
        </p>
      )}

    </div>
  );
}
