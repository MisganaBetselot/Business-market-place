import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Search,
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
  const handleSellClick = () => {
  if (window.location.pathname === "/") {
    document.getElementById("subscription-plans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } else {
    navigate("/#subscription-plans");
  }
};
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
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6 lg:px-16">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <NavLink to="/" end className={navLinkClass}>
          Home
        </NavLink>

        <form onSubmit={handleSearchSubmit} className="relative hidden w-48 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-9 w-full rounded-xl border border-border bg-surface-sunken pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-brand-400 focus:bg-white"
          />
        </form>

        <div className="ml-auto flex items-center gap-5">
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
    <button
      type="button"
      onClick={() => {
        if (window.location.pathname === "/") {
          document.getElementById("subscription-plans")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } else {
          navigate("/");
          setTimeout(() => {
            document.getElementById("subscription-plans")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        }
      }}
      className="sell-button-glow group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 px-6 py-2.5 text-base font-bold text-white shadow-lg shadow-gold-400/40 transition-transform duration-200 hover:scale-105"
    >
      <Store
        className="h-5 w-5 animate-[wiggle_2s_ease-in-out_infinite]"
        strokeWidth={2.25}
      />
      Sell
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-white/30 group-hover:[animation:shine_0.9s_ease]"
      />
    </button>

    <Link
      to="/seller"
      className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:block"
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
    <button
      type="button"
      onClick={() => {
        navigate("/login?next=/#subscription-plans");
      }}
      className="sell-button-glow group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 px-6 py-2.5 text-base font-bold text-white shadow-lg shadow-gold-400/40 transition-transform duration-200 hover:scale-105"
    >
      <Store
        className="h-5 w-5 animate-[wiggle_2s_ease-in-out_infinite]"
        strokeWidth={2.25}
      />
      Sell
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-white/30 group-hover:[animation:shine_0.9s_ease]"
      />
    </button>

    <Link
      to="/login"
      className="text-sm font-medium text-ink-soft hover:text-ink"
    >
      Log in
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
