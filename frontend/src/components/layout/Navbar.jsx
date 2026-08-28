import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-brand-600" : "text-ink-soft hover:text-ink"
  }`;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-display text-lg font-semibold text-brand-600">
          Business Marketplace
        </Link>

        {/* Browse/Favorites route to Dre & Muni's modules — links only, no
            dependency on their components, so this shell renders standalone. */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Browse
          </NavLink>
          <NavLink to="/favorites" className={navLinkClass}>
            Favorites
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notifications bell: msgana owns the real dropdown component.
                  This is a plain link placeholder so the navbar doesn't block
                  on a component that isn't built yet — swap in
                  <NotificationsBell /> here once it lands on main. */}
              <Link
                to="/notifications"
                aria-label="Notifications"
                className="rounded-full p-2 text-ink-soft hover:bg-surface-sunken hover:text-ink"
              >
                <BellIcon />
              </Link>

              <Link
                to="/account"
                className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:block"
              >
                {user?.full_name || "Account"}
              </Link>

              {/* Admin panel is msgana's module — this link just routes
                  there for admins; it doesn't render anything from it. */}
              {user?.is_admin && (
                <Link
                  to="/admin"
                  className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-100"
                >
                  Admin
                </Link>
              )}

              <button
                onClick={logout}
                className="text-sm font-medium text-ink-soft hover:text-danger"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
