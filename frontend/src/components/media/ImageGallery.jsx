import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

function ChevronIcon({ direction, className }) {
  if (direction === "left") {
    return <ChevronLeft className={className} strokeWidth={2} />;
  }
  return <ChevronRight className={className} strokeWidth={2} />;
}

export default function ImageGallery({ images = [], alt = "", variant = "full" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const safeImages = images.filter((img) => img?.url);
  const hasMultiple = safeImages.length > 1;
  const currentImage = safeImages[activeIndex] || null;

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % safeImages.length);
  }, [safeImages.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") setLightboxOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, goNext, goPrev]);

  if (!currentImage) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-surface-sunken">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-200">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="relative">
        <div
          className="relative cursor-pointer overflow-hidden rounded-xl bg-surface-sunken"
          onClick={() => safeImages.length > 0 && setLightboxOpen(true)}
        >
          <img
            src={currentImage.url}
            alt={alt}
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {hasMultiple && (
            <div className="absolute inset-0 flex items-center justify-between px-1 opacity-0 transition-opacity duration-200 hover:opacity-100">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-ink shadow-sm hover:bg-white"
              >
                <ChevronIcon direction="left" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-ink shadow-sm hover:bg-white"
              >
                <ChevronIcon direction="right" className="h-4 w-4" />
              </button>
            </div>
          )}
          {hasMultiple && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-ink/60 px-2 py-0.5 text-xs font-medium text-white">
              <ZoomIn className="h-3 w-3" />
              {activeIndex + 1}/{safeImages.length}
            </div>
          )}
        </div>
        {hasMultiple && (
          <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {safeImages.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`shrink-0 overflow-hidden rounded-lg transition-all ${
                  idx === activeIndex
                    ? "ring-2 ring-brand-500 ring-offset-1"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={img.url}
                  alt={`${alt} ${idx + 1}`}
                  className="h-12 w-16 object-cover"
                />
              </button>
            ))}
          </div>
        )}
        {lightboxOpen && (
          <Lightbox
            images={safeImages}
            activeIndex={activeIndex}
            onClose={() => setLightboxOpen(false)}
            onNext={goNext}
            onPrev={goPrev}
            onSelect={setActiveIndex}
            alt={alt}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-surface-sunken">
        <img
          src={currentImage.url}
          alt={alt}
          className="aspect-square w-full object-cover"
        />
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white hover:shadow-md"
            >
              <ChevronIcon direction="left" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white hover:shadow-md"
            >
              <ChevronIcon direction="right" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-ink/60 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-ink/80"
            >
              <ZoomIn className="h-3.5 w-3.5" />
              View all {safeImages.length} photos
            </button>
          </>
        )}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {safeImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === activeIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
      {hasMultiple && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {safeImages.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`overflow-hidden rounded-lg transition-all ${
                idx === activeIndex
                  ? "ring-2 ring-brand-500 ring-offset-2"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img.url}
                alt={`${alt} ${idx + 1}`}
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      {lightboxOpen && (
        <Lightbox
          images={safeImages}
          activeIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={goNext}
          onPrev={goPrev}
          onSelect={setActiveIndex}
          alt={alt}
        />
      )}
    </div>
  );
}

function Lightbox({ images, activeIndex, onClose, onNext, onPrev, onSelect, alt }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <ChevronIcon direction="left" className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <ChevronIcon direction="right" className="h-6 w-6" />
      </button>
      <div
        className="max-h-[85vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[activeIndex].url}
          alt={`${alt} ${activeIndex + 1}`}
          className="max-h-[80vh] max-w-full rounded-xl object-contain"
        />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((img, idx) => (
          <button
            key={img.id || idx}
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(idx); }}
            className={`overflow-hidden rounded-lg transition-all ${
              idx === activeIndex
                ? "ring-2 ring-white"
                : "opacity-50 hover:opacity-100"
            }`}
          >
            <img
              src={img.url}
              alt={`${alt} ${idx + 1}`}
              className="h-12 w-16 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}