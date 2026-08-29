import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Video, Calendar } from "lucide-react";
import { getMySellerSubscriptions } from "../../api/sellerSubscriptions";

const EXPIRING_SOON_THRESHOLD_DAYS = 7;

const STATUS_STYLES = {
  ACTIVE: { label: "Active", className: "bg-[#E4EAE1] text-[#3B5240]" },
  EXPIRING_SOON: {
    label: "Expiring Soon",
    className: "bg-[#F3DFB8] text-[#8A5A22]",
  },
  PENDING: { label: "Payment Pending", className: "bg-[#F3DFB8] text-[#8A5A22]" },
  UNDER_REVIEW: {
    label: "Receipt Under Review",
    className: "bg-[#E1E6F3] text-[#3F4F8A]",
  },
  EXPIRED: { label: "Expired", className: "bg-[#E8E6E0] text-[#5B564A]" },
  REJECTED: { label: "Rejected", className: "bg-[#F6DCE0] text-[#A33636]" },
  CANCELLED: { label: "Cancelled", className: "bg-[#E8E6E0] text-[#5B564A]" },
};

function daysRemaining(expiryDate) {
  if (!expiryDate) return null;
  const diff = Math.ceil(
    (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(diff, 0);
}

// Combine subscription.status + latest receipt into one UI status key.
function resolveUiStatus(sub) {
  if (sub.status === "ACTIVE") {
    const remaining = daysRemaining(sub.expiryDate);
    return remaining !== null && remaining <= EXPIRING_SOON_THRESHOLD_DAYS
      ? "EXPIRING_SOON"
      : "ACTIVE";
  }
  if (sub.status === "PENDING") {
    return sub.latestReceipt?.reviewStatus === "PENDING"
      ? "UNDER_REVIEW"
      : "PENDING";
  }
  return sub.status; // EXPIRED | REJECTED | CANCELLED
}

export default function SubscriptionStatus() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMySellerSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      setError("Couldn't load your subscriptions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const withStatus = useMemo(
    () =>
      subscriptions.map((sub) => ({ ...sub, uiStatus: resolveUiStatus(sub) })),
    [subscriptions]
  );

  const counts = useMemo(
    () => ({
      active: withStatus.filter((s) => s.uiStatus === "ACTIVE").length,
      pending: withStatus.filter(
        (s) => s.uiStatus === "PENDING" || s.uiStatus === "UNDER_REVIEW"
      ).length,
      expiringSoon: withStatus.filter((s) => s.uiStatus === "EXPIRING_SOON")
        .length,
      expired: withStatus.filter((s) => s.uiStatus === "EXPIRED").length,
    }),
    [withStatus]
  );

  return (
    <div className="min-h-screen bg-[#F5F1E7] px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-[#1E1B16] sm:text-5xl">
              My Media Subscriptions
            </h1>
            <p className="mt-3 max-w-xl text-[#6B6558]">
              Photo and video subscriptions are tracked separately and can
              expire on different dates.
            </p>
          </div>
          <a
            href="/seller/subscription-plans"
            className="whitespace-nowrap rounded-full bg-[#1F3A2C] px-6 py-3 font-medium text-white transition-colors hover:bg-[#183024]"
          >
            New Subscription
          </a>
        </div>
        <div className="mt-6 border-t border-[#E3DDCE]" />

        {error && (
          <p className="mt-6 rounded-xl bg-[#F5D9D9] px-4 py-3 text-sm text-[#A33636]">
            {error}
          </p>
        )}

        {/* Stat cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Active" value={counts.active} />
          <StatCard label="Pending" value={counts.pending} />
          <StatCard label="Expiring Soon" value={counts.expiringSoon} accent />
          <StatCard label="Expired" value={counts.expired} />
        </div>

        {/* Subscription cards */}
        <div className="mt-8 space-y-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-3xl bg-[#EDE8DB]"
              />
            ))
          ) : withStatus.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-[#D9D2BF] bg-[#FDFBF6]/60 px-6 py-16 text-center text-[#6B6558]">
              You don't have any media subscriptions yet.
            </div>
          ) : (
            withStatus.map((sub) => (
              <SubscriptionCard key={sub.id} sub={sub} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-[#FDFBF6] px-6 py-5 shadow-sm">
      <p className="text-xs font-semibold tracking-widest text-[#9A9282]">
        {label.toUpperCase()}
      </p>
      <p className="mt-2 text-3xl font-bold text-[#1E1B16]">{value}</p>
    </div>
  );
}

function SubscriptionCard({ sub }) {
  const status = STATUS_STYLES[sub.uiStatus];
  const Icon = sub.plan.mediaType === "VIDEO" ? Video : Camera;
  const remaining = daysRemaining(sub.expiryDate);
  const showAllowance = sub.uiStatus === "ACTIVE" || sub.uiStatus === "EXPIRING_SOON";
  const showDays = showAllowance || sub.uiStatus === "EXPIRED";

  const allowancePct =
    sub.plan.mediaLimit && sub.plan.mediaLimit > 0
      ? Math.min((sub.mediaUsed / sub.plan.mediaLimit) * 100, 100)
      : 0;

  return (
    <div className="rounded-3xl bg-[#FDFBF6] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7E2D3] text-[#5B5646]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-serif text-lg font-bold text-[#1E1B16]">
                {sub.plan.mediaType === "VIDEO" ? "Video" : "Photo"}{" "}
                Subscription &middot; {sub.plan.duration}
              </h3>
              <span
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-[#6B6558]">{sub.listingName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8">
          <DateField label="Start date" value={formatDate(sub.startDate)} />
          <DateField label="Expires" value={formatDate(sub.expiryDate)} />
          <div>
            <p className="text-xs text-[#9A9282]">Days remaining</p>
            <p className="mt-1 flex items-center gap-1.5 font-medium text-[#1E1B16]">
              <Calendar className="h-4 w-4 text-[#9A9282]" />
              {showDays ? `${remaining} days` : "—"}
            </p>
          </div>
          <CardAction sub={sub} />
        </div>
      </div>

      {sub.uiStatus === "UNDER_REVIEW" && (
        <p className="mt-4 text-right text-sm text-[#6B6558]">
          Awaiting administrator verification
        </p>
      )}

      {sub.uiStatus === "REJECTED" && sub.latestReceipt?.rejectionReason && (
        <p className="mt-4 rounded-2xl bg-[#F6DCE0] px-4 py-3 text-sm text-[#A33636]">
          {sub.latestReceipt.rejectionReason}
        </p>
      )}

      {showAllowance && (
        <div className="mt-5 border-t border-[#E3DDCE] pt-4">
          <div className="flex items-center justify-between text-sm text-[#6B6558]">
            <span>
              Media allowance used: {sub.mediaUsed} of {sub.plan.mediaLimit}
            </span>
            <span>{sub.plan.mediaLimit - sub.mediaUsed} remaining</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E3DDCE]">
            <div
              className="h-full rounded-full bg-[#1F3A2C]"
              style={{ width: `${allowancePct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DateField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[#9A9282]">{label}</p>
      <p className="mt-1 font-medium text-[#1E1B16]">{value}</p>
    </div>
  );
}

function CardAction({ sub }) {
  const solid =
    "whitespace-nowrap rounded-full bg-[#1F3A2C] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#183024]";
  const outline =
    "whitespace-nowrap rounded-full border border-[#D9D2BF] bg-white px-5 py-2.5 text-sm font-medium text-[#1E1B16] transition-colors hover:bg-[#F5F1E7]";

  switch (sub.uiStatus) {
    case "EXPIRING_SOON":
      return (
        <a href={`/seller/payment-instructions/${sub.id}`} className={solid}>
          Renew
        </a>
      );
    case "ACTIVE":
      return (
        <a href={`/seller/upload-media/${sub.id}`} className={solid}>
          Upload Media
        </a>
      );
    case "EXPIRED":
      return (
        <a href={`/seller/payment-instructions/${sub.id}`} className={outline}>
          Renew Subscription
        </a>
      );
    case "PENDING":
      return (
        <a href={`/seller/payment-instructions/${sub.id}`} className={outline}>
          View Payment Instructions
        </a>
      );
    case "REJECTED":
      return (
        <a href={`/seller/upload-receipt/${sub.id}`} className={outline}>
          Upload New Receipt
        </a>
      );
    default:
      return null;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toISOString().slice(0, 10);
}