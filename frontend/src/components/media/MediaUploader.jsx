import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadMedia } from "../../api/media";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const PHOTO_MAX_MB = 8;
const VIDEO_MAX_MB = 100; // guessed — confirm real limit with backend

function UploadCloudIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 17a4 4 0 0 1-.6-7.96A5 5 0 0 1 16.2 8.1 4.5 4.5 0 0 1 17.5 17H7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12 20v-6m0 0-2.2 2.2M12 14l2.2 2.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MediaUploader({ listingId, mediaType, remaining, onUploaded }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const isPhoto = mediaType === "PHOTO";
  const acceptedTypes = isPhoto ? PHOTO_TYPES : VIDEO_TYPES;
  const maxMb = isPhoto ? PHOTO_MAX_MB : VIDEO_MAX_MB;
  const noAllowance = remaining != null && remaining <= 0;

  const { mutate: submitUpload, isPending: uploading } = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("media_type", mediaType);
      if (listingId) formData.append("listing", listingId);
      return uploadMedia(formData);
    },
    onSuccess: () => {
      onUploaded?.();
    },
    onError: () => {
      setError("Upload failed. Please try again.");
    },
  });

  const validateAndUpload = (file) => {
    if (!file) return;
    if (!acceptedTypes.includes(file.type)) {
      setError(
        isPhoto
          ? "Please upload a JPG, PNG, or WEBP photo."
          : "Please upload an MP4 or MOV video."
      );
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxMb} MB.`);
      return;
    }
    setError("");
    submitUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (noAllowance) return;
    validateAndUpload(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!noAllowance) setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition ${
        dragActive
          ? "border-primary bg-primary-light/10"
          : "border-primary-light/50 bg-white"
      } ${noAllowance ? "opacity-60" : ""}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light/15 text-primary-dark">
        <UploadCloudIcon className="h-6 w-6" />
      </div>

      <p className="mt-4 font-sans text-base font-semibold text-charcoal">
        Drag and drop {isPhoto ? "photos" : "videos"} here
      </p>

      <p className="mt-1 font-sans text-sm text-charcoal/60">
        {noAllowance
          ? "No uploads remaining. Renew your subscription to add more."
          : `${remaining ?? "—"} ${isPhoto ? "photo" : "video"} upload${
              remaining === 1 ? "" : "s"
            } remaining on this subscription`}
      </p>

      {error && (
        <p className="mt-2 font-sans text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={noAllowance || uploading}
        className="mt-5 rounded-full bg-primary px-6 py-2.5 font-sans text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Browse Files"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        className="hidden"
        onChange={(e) => validateAndUpload(e.target.files?.[0])}
      />

      <p className="mt-4 font-sans text-xs text-charcoal/50">
        {isPhoto
          ? `JPG, PNG or WEBP — maximum ${maxMb} MB per photo`
          : `MP4 or MOV — maximum ${maxMb} MB per video`}
      </p>
    </div>
  );
}