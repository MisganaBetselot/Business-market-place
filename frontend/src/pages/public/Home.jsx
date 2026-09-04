import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, MessageSquare, Handshake } from "lucide-react";
import Button from "../../components/common/Button";
import SearchBar from "../../components/marketplace/SearchBar";
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

const whyUs = [
  { Icon: ShieldCheck, title: "Verified sellers", text: "Listings are reviewed before they go live, so you're not guessing." },
  { Icon: MessageSquare, title: "Connect directly", text: "Message a seller through the built-in chat, no middlemen." },
  { Icon: Handshake, title: "Trade with confidence", text: "See real business details before you commit to a deal." },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const featured = mockListings.slice(0, 8);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero, photo slideshow behind the search */}
      <section className="relative overflow-hidden">
        <PhotoSlideshow images={heroPhotos} />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-700/90 via-brand-700/70 to-white" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl animate-fade-up text-center">
            <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
              Buy & Sell <span className="font-display-italic">Established</span> Businesses
              in Ethiopia
            </h1>
            <p className="mt-3 text-sm text-white/85 md:text-base">
              Discover businesses, connect with owners, and find your next opportunity.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl animate-fade-up stagger-1">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="What business are you looking for?"
              categories={mockCategories}
            />
          </div>
        </div>
      </section>

      {/* Category strip, icons + photos, no emoji */}
      <section className="mx-auto max-w-6xl px-4 py-10">
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
      </section>

      {/* Promotions strip, placeholder for future ads */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between rounded-xl border border-dashed border-gold-400 bg-gold-100/40 px-5 py-3">
          <p className="text-sm font-medium text-ink">Featured placements and promotions</p>
          <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-white">Coming soon</span>
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Featured listings</h2>
          <Link to="/search" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
      {/* Subscription Plans */}
<section id="subscription-plans" className="bg-white py-10">
  <SubscriptionPlans />
</section>

      {/* Why Addis Gebeya, tinted section so the page isn't all white */}
      <section className="bg-surface-sunken py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-6 font-display text-xl font-semibold text-ink">Why Addis Gebeya</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {whyUs.map((w, i) => (
              <div
                key={w.title}
                className={`rounded-xl border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm animate-fade-up stagger-${i + 1}`}
              >
                <w.Icon className="h-6 w-6 text-brand-500" strokeWidth={1.75} />
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sell CTA */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl bg-brand-600 p-8 text-center">
          <h2 className="font-display text-xl font-semibold text-white">Want to sell your business?</h2>
          <p className="mt-1 text-sm text-white/80">Create a listing and reach buyers across Ethiopia.</p>
          <div className="mt-5">
            <Link to="/seller">
              <Button variant="gold">List your business</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
