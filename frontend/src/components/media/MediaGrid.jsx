import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMedia, replaceMedia } from "../../api/media";

const STATUS_STYLES = {
  APPROVED: { badge: "bg-primary-light/20 text-primary-dark", label: "Approved" },
  PENDING_REVIEW: { badge: "bg-accent/15 text-primary-dark", label: "Pending Review" },
  REJECTED: { badge: "bg-red-50 text-red-700", label: "Rejected" },
};

const STATUS_NOTE = {
  APPROVED: "Approved and visible on your public listing.",
  PENDING_REVIEW: "An administrator has not reviewed this item yet. It is not publicly visible.",
};

function CheckCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m5.2 8.2 1.8 1.8 3.8-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m6 6 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 5h10M6.5 5V3.5h3V5M4.5 5l.5 8.5a1 1 0 0 0 1 .95h4a1 1 0 0 0 1-.95L11.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M13 8a5 5 0 1 1-1.5-3.6M13 3v3.2h-3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATUS_ICON = {
  APPROVED: CheckCircleIcon,
  PENDING_REVIEW: ClockIcon,
  REJECTED: XCircleIcon,
};

function MediaCard({ item, onRemoved, onReplaced }) {
  const fileInputRef = useRef(null);
  const status = STATUS_STYLES[item.status] ?? STATUS_STYLES.PENDING_REVIEW;
  const StatusIcon = STATUS_ICON[item.status] ?? ClockIcon;

  const { mutate: remove, isPending: removing } = useMutation({
    mutationFn: () => deleteMedia(item.id),
    onSuccess: () => onRemoved?.(item.id),
  });

  const { mutate: replace, isPending: replacing } = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return replaceMedia(item.id, formData);
    },
    onSuccess: () => onReplaced?.(item.id),
  });

  return (
    <div className="overflow-hidden rounded-xl bg-white">
      {item.thumbnail_url && (
        <img
          src={item.thumbnail_url}
          alt={item.filename}
          className="h-44 w-full object-cover"
        />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-sans text-sm font-medium text-charcoal">
              {item.filename}
            </p>
            <p className="mt-0.5 font-sans text-xs text-charcoal/50">
              {item.size_mb ? `${item.size_mb} MB` : ""}
              {item.uploaded_date
                ? ` · ${new Date(item.uploaded_date).toLocaleDateString()}`
                : ""}
            </p>
          </div>
          <span
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-sans text-xs font-semibold ${status.badge}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </span>
        </div>

        {item.status === "REJECTED" && item.rejection_reason ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
            {item.rejection_reason}
          </p>
        ) : (
          STATUS_NOTE[item.status] && (
            <p className="mt-3 rounded-md bg-cream px-3 py-2 font-sans text-sm text-charcoal/60">
              {STATUS_NOTE[item.status]}
            </p>
          )
        )}

        {item.status === "REJECTED" && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={replacing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-cream py-2 font-sans text-sm font-medium text-primary-dark transition hover:bg-primary-light/15 disabled:opacity-50"
          >
            <RefreshIcon className="h-4 w-4" />
            {replacing ? "Uploading..." : "Replace and Resubmit"}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) replace(file);
          }}
        />

        {item.status !== "APPROVED" && (
          <button
            type="button"
            onClick={() => remove()}
            disabled={removing}
            className="mt-2 flex items-center gap-1.5 font-sans text-xs font-medium text-charcoal/60 transition hover:text-red-700 disabled:opacity-50"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            {removing ? "Removing..." : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MediaGrid({ items, mediaTypeLabel, onChange }) {
  if (!items || items.length === 0) {
    return (
      <p className="mt-6 font-sans text-sm text-charcoal/50">
        No {mediaTypeLabel}s uploaded yet.
      </p>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="font-serif text-xl font-bold text-charcoal">
        Uploaded {mediaTypeLabel}s
      </h2>
      <p className="mt-1 font-sans text-sm text-charcoal/60">
        Review status for each item on this listing.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onRemoved={onChange}
            onReplaced={onChange}
          />
        ))}
      </div>
    </div>
  );
}