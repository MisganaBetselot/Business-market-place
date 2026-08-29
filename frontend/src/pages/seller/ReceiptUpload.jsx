import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { UploadCloud, CheckCircle2, Clock3, FileWarning, FileText } from "lucide-react";
import {
  getLatestReceipt,
  uploadPaymentReceipt,
} from "../../api/payments";

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------
// UI-level states. "PENDING" / "SUBMITTED" are client-side (no receipt yet /
// just posted). "UNDER_REVIEW" / "APPROVED" / "REJECTED" mirror the backend
// receipt's review_status ("PENDING" -> UNDER_REVIEW once a receipt exists).
const STATUS = {
  PENDING: {
    label: "Payment Pending",
    badge: "bg-[#F3DFB8] text-[#8A5A22]",
    pill: "Payment Pending",
  },
  SUBMITTED: {
    label: "Receipt Submitted",
    badge: "bg-[#DCE7E1] text-[#2F5B4A]",
    pill: "Receipt Submitted",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    badge: "bg-[#E4DCF3] text-[#5B4A8A]",
    pill: "Under Review",
  },
  APPROVED: {
    label: "Approved",
    badge: "bg-[#D9EEDB] text-[#1F6B3A]",
    pill: "Approved",
  },
  REJECTED: {
    label: "Rejected",
    badge: "bg-[#F5D9D9] text-[#A33636]",
    pill: "Rejected",
  },
};

const STATE_ORDER = ["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"];

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// Map a backend receipt's review_status to a UI STATUS key.
function statusFromReceipt(receipt) {
  if (!receipt) return "PENDING";
  if (receipt.review_status === "APPROVED") return "APPROVED";
  if (receipt.review_status === "REJECTED") return "REJECTED";
  return "UNDER_REVIEW";
}

export default function ReceiptUpload({
  sellerSubscriptionId: sellerSubscriptionIdProp,
  subscriptionSummary,
  showPreviewSwitcher = true,
}) {
  const params = useParams();
  const sellerSubscriptionId = sellerSubscriptionIdProp || params.subscriptionId;

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Dev/QA-only override so designers/devs can preview every state without
  // needing real backend data in every status. Defaults to the real status.
  const [previewOverride, setPreviewOverride] = useState(null);

  const inputRef = useRef(null);

  const summary = subscriptionSummary || {
    planName: "Video plan",
    duration: "1 Month",
    price: "ETB 900",
    detail: "Up to 2 videos",
  };

  const loadReceipt = useCallback(async () => {
    if (!sellerSubscriptionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const latest = await getLatestReceipt(sellerSubscriptionId);
      setReceipt(latest);
    } catch (err) {
      setLoadError("Couldn't load your subscription status. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [sellerSubscriptionId]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  const actualState = statusFromReceipt(receipt);
  const currentState = previewOverride || actualState;
  const status = STATUS[currentState];

  const canUpload = currentState === "PENDING" || currentState === "REJECTED";

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

  function handleInputChange(e) {
    handleFileSelect(e.target.files?.[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  }

  async function handleSubmit() {
    if (!file || !sellerSubscriptionId) return;
    setSubmitting(true);
    setSubmitError(null);
    setUploadProgress(0);
    try {
      const created = await uploadPaymentReceipt(
        sellerSubscriptionId,
        file,
        setUploadProgress
      );
      setReceipt(created);
      setFile(null);
      setPreviewOverride(null);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.detail ||
          "Couldn't submit your receipt. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F1E7] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <h1 className="font-serif text-4xl font-bold text-[#1E1B16] sm:text-5xl">
          Upload Payment Receipt
        </h1>
        <p className="mt-3 max-w-xl text-[#6B6558]">
          Submit proof of your off-platform payment so an administrator can
          verify and activate your subscription.
        </p>
        <div className="mt-6 border-t border-[#E3DDCE]" />

        {loadError && (
          <p className="mt-6 rounded-xl bg-[#F5D9D9] px-4 py-3 text-sm text-[#A33636]">
            {loadError}
          </p>
        )}

        {/* Subscription summary card */}
        <div className="mt-8 flex items-start justify-between rounded-3xl bg-[#FDFBF6] p-8 shadow-sm">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#9A9282]">
              SUBSCRIPTION SUMMARY
            </p>
            <p className="mt-3 font-serif text-2xl font-bold text-[#1E1B16]">
              {summary.planName} &middot; {summary.duration}
            </p>
            <p className="mt-1 text-[#6B6558]">
              {summary.price} &middot; {summary.detail}
            </p>
          </div>
          <span
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${status.badge}`}
          >
            {status.label}
          </span>
        </div>

        {/* Dev/QA preview state switcher */}
        {showPreviewSwitcher && (
          <div className="mt-6 flex flex-wrap items-center gap-2 rounded-full bg-[#EDE8DB] px-4 py-2">
            <span className="mr-1 text-sm text-[#6B6558]">Preview state:</span>
            {STATE_ORDER.map((key) => {
              const active = currentState === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPreviewOverride(key)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-[#1F3A2C] text-white"
                      : "bg-white text-[#4A463C] hover:bg-[#F5F1E7]"
                  }`}
                >
                  {STATUS[key].pill}
                </button>
              );
            })}
          </div>
        )}

        {/* Main content by state */}
        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl border-2 border-dashed border-[#D9D2BF] bg-[#FDFBF6]/60 p-16 text-center text-[#9A9282]">
              Loading your subscription status&hellip;
            </div>
          ) : canUpload ? (
            <UploadPanel
              file={file}
              fileError={fileError}
              isDragging={isDragging}
              submitting={submitting}
              submitError={submitError}
              uploadProgress={uploadProgress}
              rejectionReason={
                currentState === "REJECTED" ? receipt?.rejection_reason : null
              }
              inputRef={inputRef}
              onBrowseClick={() => inputRef.current?.click()}
              onInputChange={handleInputChange}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClear={() => {
                setFile(null);
                setFileError(null);
              }}
              onSubmit={handleSubmit}
            />
          ) : (
            <StatusPanel state={currentState} receipt={receipt} />
          )}
        </div>
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
  uploadProgress,
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
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-[#F5D9D9] px-5 py-4 text-[#A33636]">
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
        className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
          isDragging
            ? "border-[#1F3A2C] bg-[#EEF3EE]"
            : "border-[#D9D2BF] bg-[#FDFBF6]/60"
        }`}
      >
        {file ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF3EE]">
              <FileText className="h-7 w-7 text-[#1F3A2C]" />
            </div>
            <p className="mt-5 font-medium text-[#1E1B16]">{file.name}</p>
            <p className="mt-1 text-sm text-[#9A9282]">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={onClear}
              className="mt-4 text-sm text-[#6B6558] underline decoration-[#D9D2BF] underline-offset-4 hover:text-[#1E1B16]"
            >
              Choose a different file
            </button>
          </>
        ) : (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E7E2D3] text-[#5B5646]">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="mt-5 text-lg font-medium text-[#1E1B16]">
              Drag and drop your payment receipt
            </p>
            <p className="mt-1 text-[#9A9282]">or browse from your device</p>
            <button
              type="button"
              onClick={onBrowseClick}
              className="mt-6 rounded-full bg-[#1F3A2C] px-8 py-3 font-medium text-white transition-colors hover:bg-[#183024]"
            >
              Browse Files
            </button>
            <p className="mt-5 text-sm text-[#9A9282]">
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
        <p className="mt-3 text-sm text-[#A33636]">{fileError}</p>
      )}
      {submitError && (
        <p className="mt-3 text-sm text-[#A33636]">{submitError}</p>
      )}

      <div className="mt-6">
        <button
          type="button"
          disabled={!file || submitting}
          onClick={onSubmit}
          className="rounded-full bg-[#8FA98C] px-8 py-3 font-medium text-white transition-colors enabled:hover:bg-[#7C9679] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? uploadProgress > 0
              ? `Uploading ${uploadProgress}%`
              : "Submitting..."
            : "Submit Receipt"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Non-upload states: submitted / under review / approved
// ---------------------------------------------------------------------------
function StatusPanel({ state, receipt }) {
  const config = {
    SUBMITTED: {
      icon: Clock3,
      iconClass: "bg-[#DCE7E1] text-[#2F5B4A]",
      title: "Receipt submitted",
      body: "We've received your payment receipt. You'll be notified once it's been reviewed.",
    },
    UNDER_REVIEW: {
      icon: Clock3,
      iconClass: "bg-[#E4DCF3] text-[#5B4A8A]",
      title: "Your receipt is under review",
      body: "An administrator is verifying your payment. This usually takes a short while.",
    },
    APPROVED: {
      icon: CheckCircle2,
      iconClass: "bg-[#D9EEDB] text-[#1F6B3A]",
      title: "Subscription active",
      body: receipt?.seller_subscription?.expiry_date
        ? `Your payment was verified. Your subscription is active until ${new Date(
            receipt.seller_subscription.expiry_date
          ).toLocaleDateString()}.`
        : "Your payment was verified and your subscription is now active.",
    },
  }[state];

  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#D9D2BF] bg-[#FDFBF6]/60 px-6 py-16 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${config.iconClass}`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <p className="mt-5 text-lg font-medium text-[#1E1B16]">{config.title}</p>
      <p className="mt-2 max-w-md text-[#6B6558]">{config.body}</p>
    </div>
  );
}
