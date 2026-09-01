import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Generic modal used across modules — e.g. "confirm reject", media preview,
 * report reason, delete confirmation.
 *
 * Usage:
 *   <Modal open={open} onClose={() => setOpen(false)} title="Reject receipt">
 *     ...body...
 *     <div className="mt-6 flex justify-end gap-3">
 *       <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button variant="danger" onClick={handleReject}>Reject</Button>
 *     </div>
 *   </Modal>
 */
export default function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={`relative w-full ${widths[size]} rounded-xl border border-border bg-surface p-6 shadow-lg`}
      >
        <div className="flex items-start justify-between gap-4">
          {title && (
            <h2 id="modal-title" className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto rounded-full p-1 text-ink-soft hover:bg-surface-sunken hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
