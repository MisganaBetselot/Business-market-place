const variants = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 focus-visible:outline-brand-500",
  secondary:
    "bg-white text-brand-600 border border-border hover:bg-surface-muted focus-visible:outline-brand-500",
  gold:
    "bg-gold-400 text-white hover:bg-gold-500 focus-visible:outline-gold-500",
  ghost:
    "bg-transparent text-ink-soft hover:bg-surface-sunken focus-visible:outline-brand-500",
  danger:
    "bg-danger text-white hover:opacity-90 focus-visible:outline-danger",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
      transition-colors disabled:opacity-50 disabled:cursor-not-allowed
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
      ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
