import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Search,
  Home as HomeIcon,
  MessageCircle,
  Bell,
  Heart,
  Store,
  Coffee,
  UtensilsCrossed,
  BedDouble,
  Scissors,
  Cookie,
  ShoppingBag,
  Wrench,
  Dumbbell,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { mockCategories } from "../../data/mockData";
import Logo from "./Logo";

const navLinkClass = ({ isActive }) =>
  `relative text-sm font-medium transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-brand-500 after:transition-all after:duration-200 ${
    isActive
      ? "text-brand-600 after:w-full"
      : "text-ink-soft hover:text-ink after:w-0 hover:after:w-full"
  }`;

// Real icons in place of the emoji that used to live on mockCategories.
// Keep this in sync with the category names in data/mockData.js.
const categoryIcons = {
  Café: Coffee,
  Restaurant: UtensilsCrossed,
  Hotel: BedDouble,
  Salon: Scissors,
  Bakery: Cookie,
  Retail: ShoppingBag,
  Services: Wrench,
  Fitness: Dumbbell,
};

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : "";
    navigate(`/search${params}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="h-1 bg-gradient-to-r from-brand-500 via-brand-600 to-gold-500" />
      {/* Main row: logo, search, quick links, account */}
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <form onSubmit={handleSearchSubmit} className="relative hidden flex-1 max-w-md md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search businesses, cafes, shops..."
            className="h-10 w-full rounded-xl border border-border bg-surface-sunken pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-brand-400 focus:bg-white"
          />
        </form>

        <NavLink to="/" end className={navLinkClass}>
          Home
        </NavLink>

        <div className="ml-auto flex items-center gap-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `hidden sm:block ${isActive ? "text-brand-600" : "text-ink-soft hover:text-brand-600"}`
            }
            title="Home"
          >
            <HomeIcon className="h-5 w-5" strokeWidth={1.75} />
          </NavLink>
          <Link to="/favorites" className="hidden text-ink-soft hover:text-brand-600 sm:block" title="Favorites">
            <Heart className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <Link to="/notifications" className="hidden text-ink-soft hover:text-brand-600 sm:block" title="Notifications">
            <Bell className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <Link to="/messages" className="hidden text-ink-soft hover:text-brand-600 sm:block" title="Messages">
            <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/seller"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-5 py-2.5 text-base font-bold text-white shadow-md shadow-gold-400/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold-400/40"
              >
                <Store className="h-5 w-5" strokeWidth={2} />
                Sell
              </Link>
              <Link to="/seller" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:block">
                Dashboard
              </Link>
              <button onClick={logout} className="text-sm font-medium text-ink-soft hover:text-danger">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login?next=/seller"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-5 py-2.5 text-base font-bold text-white shadow-md shadow-gold-400/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold-400/40"
              >
                <Store className="h-5 w-5" strokeWidth={2} />
                Sell
              </Link>
              <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-md"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Category strip, always visible, not tucked behind a hover menu */}
      <div className="border-t border-border bg-brand-50/40">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
          <NavLink
            to="/search"
            end
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-600" : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
              }`
            }
          >
            <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />
            All
          </NavLink>
          {mockCategories.map((cat) => {
            const Icon = categoryIcons[cat.name] ?? LayoutGrid;
            return (
              <NavLink
                key={cat.id}
                to={`/search?category=${cat.id}`}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive ? "bg-brand-50 text-brand-600" : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {cat.name}
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
}
