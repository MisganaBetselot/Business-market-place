import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { saveListing, unsaveListing } from "../../api/listings";

function HeartIcon({ className, filled }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} className={className}>
      <path
        d="M10 17s-6.2-3.9-8.1-7.7C.6 6.7 2 3.5 5 3c1.8-.3 3.5.6 5 2.4C11.5 3.6 13.2 2.7 15 3c3 .5 4.4 3.7 3.1 6.3C16.2 13.1 10 17 10 17Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * FavoriteButton
 *
 * A reusable heart toggle that saves/un-saves a listing. It is designed to
 * sit on top of a listing card image without interfering with the card's
 * link navigation: clicks are stopped from propagating and the default
 * link behaviour is prevented.
 *
 * Props:
 *  - listing        {object}  listing object (must have an `id`)
 *  - saved          {boolean} controlled "is it saved?" state. When provided,
 *                              the component is controlled and `onChange`
 *                              reports toggles. When omitted, the component
 *                              manages its own optimistic state.
 *  - onChange        {(nextSaved) => {}} fired after a successful toggle
 *  - size            {"sm" | "md"} button size (default "md")
 *  - variant         {"icon" | "icon+label"} visual style (default "icon")
 */
export default function FavoriteButton({
  listing,
  saved: controlledSaved,
  onChange,
  size = "md",
  variant = "icon",
}) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [internalSaved, setInternalSaved] = useState(false);
  const saved = controlledSaved ?? internalSaved;

  const sizeClasses =
    size === "sm"
      ? "h-8 w-8"
      : "h-9 w-9";

  const iconSize =
    size === "sm" ? "h-4 w-4" : "h-5 w-5";

  const saveMutation = useMutation({
    mutationFn: (listingId) => saveListing(listingId),
    onMutate: () => {
      // Optimistically flip state for instant feedback.
      setInternalSaved(true);
      onChange?.(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedListings"] });
    },
    onError: () => {
      setInternalSaved(false);
      onChange?.(false);
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (listingId) => unsaveListing(listingId),
    onMutate: () => {
      setInternalSaved(false);
      onChange?.(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedListings"] });
    },
    onError: () => {
      setInternalSaved(true);
      onChange?.(true);
    },
  });

  const isBusy = saveMutation.isPending || unsaveMutation.isPending;

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Send unauthenticated users to login, preserving the current URL
      // so they can come back to this card afterwards.
      window.location.href = `/login?redirect=${encodeURIComponent(
        window.location.pathname + window.location.search
      )}`;
      return;
    }

    if (isBusy) return;

    if (saved) {
      unsaveMutation.mutate(listing.id);
    } else {
      saveMutation.mutate(listing.id);
    }
  };

  const label = saved ? "Remove from saved" : "Save to favorites";

  if (variant === "icon+label") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isBusy}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={`inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-brand-600 shadow-sm transition hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 ${isBusy ? "opacity-60" : ""}`}
      >
        <span className={`transition-transform duration-200 ${isBusy ? "animate-pulse" : ""}`}>
          <HeartIcon filled={saved} className={iconSize} />
        </span>
        <span>{saved ? "Saved" : "Save"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isBusy}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 disabled:opacity-60 disabled:hover:scale-100 ${sizeClasses} ${isBusy ? "animate-pulse" : ""}`}
    >
      <span className={`transition-transform duration-200 ${isBusy ? "scale-90" : ""}`}>
        <HeartIcon filled={saved} className={iconSize} />
      </span>
    </button>
  );
}