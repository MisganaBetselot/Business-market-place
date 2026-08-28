import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { mockCategories } from "../../data/mockData";

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-brand-600" : "text-ink-soft hover:text-ink"
  }`;

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 gap-4">
        <Link to="/" className="font-display text-lg font-semibold text-brand-600 shrink-0">
          Business Marketplace
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/search" className={navLinkClass} end>
            Browse
          </NavLink>
          <div className="relative group">
            <button className="text-sm font-medium text-ink-soft hover:text-ink flex items-center gap-1">
              Categories ▾
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-border bg-surface shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {mockCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/search?category=${cat.id}`}
                  className="block px-4 py-2.5 text-sm text-ink hover:bg-surface-muted first:rounded-t-xl last:rounded-b-xl"
                >
                  {cat.icon} {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/messages"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Messages
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/seller"
                className="hidden sm:block text-sm font-medium text-ink-soft hover:text-ink"
              >
                Dashboard
              </Link>
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
