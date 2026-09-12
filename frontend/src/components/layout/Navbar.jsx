import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Heart,
  Store,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Logo from "./Logo";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = location.pathname === "/";

  const scrollToPlans = () => {
    setMobileMenuOpen(false);
    document.getElementById("subscription-plans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handlePricingClick = () => {
    setMobileMenuOpen(false);

    if (isHome) {
      // On the landing page, "Pricing" scrolls to the plans section
      // already rendered inline — no need to leave the page.
      if (isAuthenticated) {
        scrollToPlans();
      } else {
        navigate("/login?next=/#subscription-plans");
      }
    } else {
      // On any other page, there's no plans section to scroll to, so
      // go straight to the dedicated plans page instead of navigating
      // home first and scrolling (which was the old behavior).
      if (isAuthenticated) {
        navigate("/sell/plans");
      } else {
        navigate("/login?next=/sell/plans");
      }
    }
  };

  /*
   * HOME:
   * Navbar sits on top of the hero and scrolls away with the page.
   *
   * OTHER PAGES:
   * Navbar stays sticky at the top with a small green announcement bar
   * and a white navigation row underneath.
   */

  const headerClass = isHome
    ? "absolute inset-x-0 top-0 z-50"
    : "sticky inset-x-0 top-0 z-50";

  const linkColor = isHome
    ? "text-white/85 hover:text-white"
    : "text-ink-soft hover:text-ink";

  const iconColor = isHome
    ? "text-white/85 hover:text-white"
    : "text-ink-soft hover:text-brand-600";

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  return (
    <header className={headerClass}>
      {/* =========================================================
          ANNOUNCEMENT BAR
          ========================================================= */}

      {isHome ? (
        <div className="border-b border-white/15">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs sm:px-6">
            <span className="text-white/75">
              Explore verified businesses and new opportunities
            </span>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="font-medium text-white/90 transition-colors hover:text-white"
              >
                Log out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="font-medium text-white/90 transition-colors hover:text-white"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-brand-700 text-white">
          <div className="mx-auto flex h-7 max-w-7xl items-center justify-between px-4 text-xs sm:px-6">
            <span className="text-white/90">
              Explore verified businesses and new opportunities
            </span>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="font-medium text-white transition-colors hover:text-white/80"
              >
                Log out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="font-medium text-white transition-colors hover:text-white/80"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          MAIN NAVIGATION
          ========================================================= */}

      <div
        className={
          isHome
            ? "mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6"
            : "border-b border-border bg-white shadow-sm"
        }
      >
        <div
          className={
            isHome
              ? "relative flex w-full items-center"
              : "relative mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6"
          }
        >
          {/* =====================================================
              LOGO
              ===================================================== */}

          <Link
            to="/"
            className="shrink-0"
            onClick={closeMobileMenu}
          >
            <Logo variant={isHome ? "light" : "dark"} />
          </Link>

          {/* =====================================================
              DESKTOP NAVIGATION
              ===================================================== */}

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">

            {/* Browse — re-enabled. Persistent nav link to search/browse,
                since this is a recurring action users need from any page,
                not just from the home hero. */}
            <Link
              to="/search"
              className={`text-sm font-medium transition-colors hover:underline hover:underline-offset-4 ${linkColor}`}
            >
              Browse
            </Link>

            <Link
              to="/about"
              className={`text-sm font-medium transition-colors hover:underline hover:underline-offset-4 ${linkColor}`}
            >
              About Us
            </Link>

            {/* Pricing */}
            <button
              type="button"
              onClick={handlePricingClick}
              className={`text-sm font-medium transition-colors hover:underline hover:underline-offset-4 ${linkColor}`}
            >
              Pricing
            </button>
          </nav>

          {/* =====================================================
              DESKTOP RIGHT SIDE
              ===================================================== */}

          <div className="ml-auto hidden items-center gap-5 md:flex">

            {/* Favorites */}
            <Link
              to="/favorites"
              className={`transition-colors ${iconColor}`}
              title="Favorites"
            >
              <Heart
                className="h-5 w-5"
                strokeWidth={1.75}
              />
            </Link>

            {/* Messages */}
            <Link
              to="/messages"
              className={`transition-colors ${iconColor}`}
              title="Messages"
            >
              <MessageCircle
                className="h-5 w-5"
                strokeWidth={1.75}
              />
            </Link>

            {/* =================================================
                SELL YOUR BUSINESS

                Temporarily commented out as requested.
                Keeping the original code here so it can easily
                be restored later.
                ================================================= */}

            {/*
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={scrollToPlans}
                  className="sell-button-glow group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 px-6 py-2.5 text-base font-bold text-white shadow-lg shadow-gold-400/40 transition-transform duration-200 hover:scale-105"
                >
                  <Store
                    className="h-5 w-5 animate-[wiggle_2s_ease-in-out_infinite]"
                    strokeWidth={2.25}
                  />

                  Sell Your Business

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-white/30 group-hover:[animation:shine_0.9s_ease]"
                  />
                </button>

                <Link
                  to="/seller"
                  className={`text-sm font-medium transition-colors ${linkColor}`}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  navigate("/login?next=/#subscription-plans")
                }
                className="sell-button-glow group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 px-6 py-2.5 text-base font-bold text-white shadow-lg shadow-gold-400/40 transition-transform duration-200 hover:scale-105"
              >
                <Store
                  className="h-5 w-5 animate-[wiggle_2s_ease-in-out_infinite]"
                  strokeWidth={2.25}
                />

                Sell Your Business

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-white/30 group-hover:[animation:shine_0.9s_ease]"
                />
              </button>
            )}
            */}

            {/* Guest fallback: if not logged in, there's currently no way
                to start the selling flow from the navbar except on the
                home page hero. This gives that path back without
                restoring the full glowing button. Remove if you'd
                rather guests only ever start selling from the hero. */}
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => navigate("/login?next=/#subscription-plans")}
                className={`text-sm font-medium transition-colors ${linkColor}`}
              >
                Sell Your Business
              </button>
            )}

            {/* Seller Dashboard */}
            {isAuthenticated && (
              <Link
                to="/seller"
                className={`ml-auto rounded-lg border border-gold-500 bg-transparent px-4 py-2 text-sm font-semibold text-gold-500 transition-all duration-200 ${
                  isHome
                    ? "hover:bg-white hover:text-ink"
                    : "hover:bg-gold-500 hover:text-white"
                }`}
              >
                Seller Dashboard
              </Link>
            )}
          </div>

          {/* =====================================================
              MOBILE HAMBURGER
              ===================================================== */}

          <div className="ml-auto md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                isHome
                  ? "text-white hover:bg-white/10"
                  : "text-ink-soft hover:bg-gray-100"
              }`}
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X
                  className="h-6 w-6"
                  strokeWidth={2}
                />
              ) : (
                <Menu
                  className="h-6 w-6"
                  strokeWidth={2}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE MENU
          ========================================================= */}

      {mobileMenuOpen && (
        <div
          className={`md:hidden ${
            isHome
              ? "border-t border-white/15 bg-black/80 backdrop-blur-md"
              : "border-b border-border bg-white shadow-lg"
          }`}
        >
          <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6">

            {/* Browse — re-enabled, same reasoning as desktop. */}
            <Link
              to="/search"
              onClick={closeMobileMenu}
              className={`flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                isHome
                  ? "text-white/90 hover:bg-white/10 hover:text-white"
                  : "text-ink-soft hover:bg-gray-50 hover:text-ink"
              }`}
            >
              Browse
            </Link>

            {/* About Us */}
            <Link
              to="/about"
              onClick={closeMobileMenu}
              className={`flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:underline hover:underline-offset-4 ${
                isHome
                  ? "text-white/90 hover:bg-white/10 hover:text-white"
                  : "text-ink-soft hover:bg-gray-50 hover:text-ink"
              }`}
            >
              About Us
            </Link>

            {/* Pricing */}
            <button
              type="button"
              onClick={handlePricingClick}
              className={`flex w-full items-center rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors hover:underline hover:underline-offset-4 ${
                isHome
                  ? "text-white/90 hover:bg-white/10 hover:text-white"
                  : "text-ink-soft hover:bg-gray-50 hover:text-ink"
              }`}
            >
              Pricing
            </button>

            {/* Favorites */}
            <Link
              to="/favorites"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                isHome
                  ? "text-white/90 hover:bg-white/10 hover:text-white"
                  : "text-ink-soft hover:bg-gray-50 hover:text-ink"
              }`}
            >
              <Heart
                className="h-5 w-5"
                strokeWidth={1.75}
              />
              Favorites
            </Link>

            {/* Messages */}
            <Link
              to="/messages"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                isHome
                  ? "text-white/90 hover:bg-white/10 hover:text-white"
                  : "text-ink-soft hover:bg-gray-50 hover:text-ink"
              }`}
            >
              <MessageCircle
                className="h-5 w-5"
                strokeWidth={1.75}
              />
              Messages
            </Link>

            {/* Dashboard */}
            {isAuthenticated && (
              <Link
                to="/seller"
                onClick={closeMobileMenu}
                className={`flex w-fit rounded-lg border border-gold-500 bg-transparent px-4 py-2 text-sm font-semibold text-gold-500 transition-all duration-200 ${
                  isHome
                    ? "hover:bg-white hover:text-ink"
                    : "hover:bg-gold-500 hover:text-white"
                }`}
              >
                Seller Dashboard
              </Link>
            )}

            {/* Guest fallback for mobile — same reasoning as desktop. */}
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  navigate("/login?next=/#subscription-plans");
                }}
                className={`flex w-full items-center rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors ${
                  isHome
                    ? "text-white/90 hover:bg-white/10 hover:text-white"
                    : "text-ink-soft hover:bg-gray-50 hover:text-ink"
                }`}
              >
                Sell Your Business
              </button>
            )}

            {/* =================================================
                Sell Your Business

                Temporarily commented out as requested.
                ================================================= */}

            {/*
            <div
              className={`my-2 border-t ${
                isHome ? "border-white/15" : "border-border"
              }`}
            />

            <button
              type="button"
              onClick={handleMobileSell}
              className="sell-button-glow group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 px-5 py-3 text-base font-bold text-white shadow-lg shadow-gold-400/40"
            >
              <Store
                className="h-5 w-5"
                strokeWidth={2.25}
              />

              Sell Your Business

              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full bg-white/30 group-hover:[animation:shine_0.9s_ease]"
              />
            </button>
            */}

            {/* Mobile Login / Logout */}
            <div
              className={`mt-2 border-t pt-2 ${
                isHome
                  ? "border-white/15"
                  : "border-border"
              }`}
            >
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`w-full rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors ${
                    isHome
                      ? "text-white/80 hover:bg-white/10 hover:text-white"
                      : "text-ink-soft hover:bg-gray-50 hover:text-ink"
                  }`}
                >
                  Log out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className={`flex w-full rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isHome
                      ? "text-white/80 hover:bg-white/10 hover:text-white"
                      : "text-ink-soft hover:bg-gray-50 hover:text-ink"
                  }`}
                >
                  Log in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}