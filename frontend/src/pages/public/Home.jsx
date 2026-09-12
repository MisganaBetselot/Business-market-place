import { Link } from "react-router-dom";
import { Compass, Handshake, FileText, TrendingUp, ArrowRight, BadgeCheck, Search, SlidersHorizontal } from "lucide-react";
import Button from "../../components/common/Button";
import CategoryCard from "../../components/marketplace/CategoryCard";
import ListingCard from "../../components/marketplace/ListingCard";
import PhotoSlideshow from "../../components/layout/PhotoSlideshow";
import { mockCategories, mockListings } from "../../data/mockData";
import SubscriptionPlans from "../../components/home/SubscriptionPlans";

const heroPhotos = [
  "https://images.unsplash.com/photo-1575663620136-5ebbfcc2c597?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1594402919317-9e67dca0a305?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1600&q=80",
];

const trustPoints = [
  { Icon: Compass, title: "Discover Opportunities", text: "Browse businesses across different industries." },
  { Icon: Handshake, title: "Connect With Serious Buyers", text: "Reach people actively looking for opportunities." },
  { Icon: FileText, title: "Simple and Transparent", text: "Clear business information in one place." },
  { Icon: TrendingUp, title: "Built for Growth", text: "A marketplace designed for entrepreneurs." },
];

const tickerSequence = Array.from({ length: 6 }).flatMap(() => [
  "Buy",
  "Sell",
  "Discover",
  "Invest",
  "Grow",
]);

const aboutPoints = [
  "Clear information",
  "Direct connections",
  "Guided listings",
  "Seamless selling",
  "Confident buying",
];

export default function Home() {
  const featured = mockListings.slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero - left-aligned per design direction, sitting lower in the
          section (generous top padding) rather than vertically centered.
          Buttons use solid brand green, not white/orange, since the
          dark gradient overlay behind the text guarantees contrast
          without needing background-brightness detection. */}
      <section className="relative overflow-hidden">
        <PhotoSlideshow images={heroPhotos} />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-700/90 via-brand-700/70 to-white" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-52 sm:px-6 md:pb-32 md:pt-60">
          <div className="max-w-2xl animate-fade-up text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              The marketplace for established businesses
            </p>
            <h1 className="font-display text-3xl font-semibold text-white md:text-5xl">
              Buy & Sell <span className="font-display-italic">Established</span> Businesses
              in Ethiopia
            </h1>
            <p className="mt-4 text-sm text-white/85 md:text-base">
              Discover businesses, connect with owners, and find your next opportunity.
            </p>
          </div>

          <div className="mt-9 flex max-w-md animate-fade-up flex-col gap-3 stagger-1 sm:flex-row sm:justify-start">
            <a
              href="#subscription-plans"
              className="flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md"
            >
              Sell Your Business
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/search"
              className="flex items-center justify-center gap-2 rounded-full border-2 border-brand-600 bg-gray-400/20 px-6 py-3 text-sm font-bold text-brand-600 backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-gray-400/30 hover:shadow-md"
            >
              Explore Business
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Category strip, icons + photos, no emoji. Extra top padding
          (pt-16 instead of py-10) pushes the section down a bit so it
          isn't crowded right under the hero's gradient fade. A search
          bar sits below the category row — reintroduced from an earlier
          cut, styled in brand green/gold rather than the cream/brown of
          the reference, so it fits the rest of the page instead of
          looking like a lifted screenshot. */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Browse by category</h2>
          <Link to="/search" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {mockCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-6 flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-2 shadow-sm"
        >
          <div className="flex flex-1 items-center gap-2 px-3">
            <Search className="h-4 w-4 shrink-0 text-ink-soft" />
            <input
              type="text"
              placeholder="Search cafés, hotels, salons, services..."
              className="w-full bg-transparent py-1.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none"
            />
          </div>
          <button
            type="submit"
            aria-label="Filters"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </form>
      </section>

      {/* Featured listings — 2/3 grid of listings + 1/3 sidebar. The
          sidebar replaces a "Verified Listings" info box (inspo
          reference) with the seller CTA plus the promotions placeholder
          that used to be its own standalone strip above this section. */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Featured listings</h2>
          <Link to="/search" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            {/* For sellers CTA — links straight to the plans page, not
                the on-page anchor, since this sits away from the hero. */}
            <div className="rounded-2xl bg-brand-600 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                For Sellers
              </p>
              <h3 className="mt-2 font-display text-xl font-bold">Thinking of selling?</h3>
              <p className="mt-2 text-sm text-white/85">
                Get your business in front of serious buyers actively
                searching the marketplace.
              </p>
              <Link
                to="/sell/plans"
                className="mt-5 flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                List Your Business
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Promotions placeholder — moved here from its own strip
                above the category section; same styling as before, just
                relocated and reshaped to fit the sidebar column instead
                of a full-width bar. */}
            <div className="rounded-2xl border border-dashed border-gold-400 bg-gold-100/40 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Featured placements and promotions</p>
                <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-white">
                  Coming soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A marketplace built on clarity and trust — replaces the old
          "Why Addis Gebeya" section (same purpose: value props with
          icons), matching the reference's divider-line style. Uses
          bg-surface-sunken (the app's light-blue-tinted background
          token) instead of the reference's cream, since our page is
          white, not cream. */}
      <section className="bg-surface-sunken py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            A marketplace built on clarity and trust
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <div key={point.title} className="border-t border-border pt-5">
                <point.Icon className="h-5 w-5 text-brand-600" strokeWidth={1.75} />
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{point.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{point.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scrolling ticker strip, matches the reference. Needs
          .animate-marquee added to index.css (see separate file) — a
          continuous linear loop of two duplicated sequences so it reads
          seamlessly. */}
      <div className="overflow-hidden border-y border-border bg-surface-sunken py-4">
        <div className="flex w-max animate-marquee items-center gap-3">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-3">
              {tickerSequence.map((word, i) => (
                <span
                  key={`${dup}-${i}`}
                  className="flex items-center gap-3 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.3em] text-ink-soft"
                >
                  {word}
                  <span aria-hidden="true">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Plans */}
      <section id="subscription-plans" className="bg-white py-10">
        <SubscriptionPlans />
      </section>

      {/* Sell CTA */}


      {/* About - last section on the page, no bottom padding so it sits
          flush against the site footer with no gap between them. */}
            {/* About - last section on the page, no bottom padding so it sits
          flush against the site footer with no gap between them.
          Background matches inspo's warm cream/golden tone instead of
          the blue-tinted surface-sunken token used elsewhere. */}
      <section className="border-t border-border bg-gold-50 pt-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-2 md:items-start md:gap-16">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px w-8 bg-gold-500" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-500">
                About Addis Gebeya
              </span>
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
              Business opportunities, brought within reach.
            </h2>
          </div>

          <div className="md:pt-14">
            <p className="text-base leading-relaxed text-ink-soft">
              Addis Gebeya brings Ethiopia's buyers and business owners into
              one organized marketplace — making it easier to discover,
              understand, and act on the right opportunity.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
              {aboutPoints.map((point) => (
                <span key={point} className="flex items-center gap-2 text-sm font-medium text-brand-600">
                  <BadgeCheck className="h-4 w-4 text-gold-500" strokeWidth={2} />
                  {point}
                </span>
              ))}
            </div>

            {/* Sell / Buy CTAs */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/sell/plans"
                className="flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md"
              >
                Sell Your Business
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/search"
                className="flex items-center justify-center gap-2 rounded-full border border-brand-600 px-6 py-3 text-sm font-semibold text-brand-600 transition hover:-translate-y-0.5 hover:bg-brand-600/10"
              >
                Browse Businesses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>    
 </div>
  );
}