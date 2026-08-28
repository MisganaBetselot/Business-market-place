export function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

const badgeTones = {
  neutral: "bg-surface-sunken text-ink-soft",
  brand: "bg-brand-50 text-brand-600",
  gold: "bg-gold-100 text-gold-500",
  success: "bg-green-50 text-success",
  danger: "bg-red-50 text-danger",
};

export function Badge({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}
