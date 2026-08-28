import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import SearchBar from "../../components/marketplace/SearchBar";
import CategoryCard from "../../components/marketplace/CategoryCard";
import Footer from "../../components/layout/Footer";
import { mockCategories } from "../../data/mockData";

export default function Home() {
  const [query, setQuery] = useState("");

  const popularSearches = ["Café", "Restaurant", "Hotel", "Salon", "Bakery", "Shop", "Bar", "Car Wash"];

  return (
    <div className="min-h-screen bg-surface-muted">
      {/* Hero / Search */}
      <section className="bg-surface border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
              Buy & Sell Businesses in Ethiopia
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Discover businesses, connect with owners, and find your next opportunity.
            </p>
          </div>

          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) {
                window.location.href = `/search?search=${encodeURIComponent(query.trim())}`;
              } else {
                window.location.href = "/search";
              }
            }}
            placeholder="What business are you looking for?"
          />

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-soft">
            <span>Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  window.location.href = `/search?search=${encodeURIComponent(term)}`;
                }}
                className="rounded-full bg-surface-sunken px-3 py-1.5 hover:bg-brand-50 hover:text-brand-600 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Business Categories */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-ink">Business Categories</h2>
          <Link to="/search" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {mockCategories.map((cat) => (
            <div key={cat.id} className="shrink-0 w-36">
              <CategoryCard category={cat} />
            </div>
          ))}
        </div>
      </section>

      {/* Why Business Marketplace */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-display text-xl font-semibold text-ink mb-6">Why Business Marketplace</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="font-display text-lg font-semibold text-ink">Find Opportunities</h3>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
              Discover businesses available for sale across Ethiopia. From cafés to hotels, find the right opportunity.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="font-display text-lg font-semibold text-ink">Connect Directly</h3>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
              Communicate with business owners directly through our built-in messaging system. No middlemen.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6">
            <h3 className="font-display text-lg font-semibold text-ink">Trade With Confidence</h3>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
              Explore business information and connect with verified sellers to make informed decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Sell CTA */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">Want to sell your business?</h2>
          <p className="mt-1 text-sm text-ink-soft">Create a listing and reach thousands of buyers.</p>
          <div className="mt-4">
            <Link to="/seller">
              <Button>List Your Business</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
