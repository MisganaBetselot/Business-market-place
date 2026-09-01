const variants = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 focus-visible:outline-brand-500 shadow-sm hover:shadow-md hover:-translate-y-0.5",
  secondary:
    "bg-white text-brand-600 border-2 border-brand-100 hover:border-brand-400 hover:-translate-y-0.5",
  gold:
    "bg-gold-400 text-white hover:bg-gold-500 focus-visible:outline-gold-500 hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-ink-soft hover:bg-surface-sunken focus-visible:outline-brand-500",
  danger:
    "bg-danger text-white hover:opacity-90 focus-visible:outline-danger",
};

/**
 * Shared button. Primary/secondary/gold lift slightly on hover instead of
 * just swapping color, and primary gets a one-shot light "shine" sweep on
 * hover so the main CTA on every page (login, sign up, save) feels alive
 * without looping forever and becoming annoying.
 */
export default function Button({
  as: Tag = "button",
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) {
  return (
    <Tag
      disabled={disabled || loading}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-medium
      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
      ${variants[variant]} ${className}`}
      {...props}
    >
      {variant === "primary" && !disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-white/25 opacity-0 group-hover:opacity-100 group-hover:[animation:shine_0.9s_ease]"
        />
      )}
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      <span className="relative">{children}</span>
    </Tag>
  );
}
