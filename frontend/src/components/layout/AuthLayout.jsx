import { Link } from "react-router-dom";
import Logo from "./Logo";

/**
 * Shared shell for Login / Register / Reset password. Centered card on a
 * plain white page, kept from feeling flat with a couple of soft drifting
 * blur shapes behind it rather than a hard flat white.
 */
export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-100 opacity-50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-gold-100 opacity-50 blur-3xl"
        style={{ animationDelay: "3s" }}
      />

      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-border bg-white p-8 shadow-sm sm:p-10">
        <Link to="/" className="mb-6 inline-block">
          <Logo />
        </Link>

        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-500">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>}

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
