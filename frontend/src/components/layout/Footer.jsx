import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-base font-semibold text-brand-600">
            Business Marketplace
          </p>
          <p className="mt-1 max-w-xs text-sm text-ink-soft">
            Buy and sell existing businesses — cafés, shops, salons, and more.
          </p>
        </div>

        <div className="flex gap-10 text-sm">
          <div className="flex flex-col gap-2">
            <p className="font-medium text-ink">Marketplace</p>
            <Link to="/" className="text-ink-soft hover:text-ink">Browse businesses</Link>
            <Link to="/favorites" className="text-ink-soft hover:text-ink">Favorites</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-ink">Account</p>
            <Link to="/login" className="text-ink-soft hover:text-ink">Log in</Link>
            <Link to="/register" className="text-ink-soft hover:text-ink">Sign up</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 text-center text-xs text-ink-soft">
        © {year} Business Marketplace. All rights reserved.
      </div>
    </footer>
  );
}
