import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SearchBar from "../../components/marketplace/SearchBar";
import ListingGrid from "../../components/marketplace/ListingGrid";
import { getListings } from "../../api/listings";
import { getCategories } from "../../api/categories";
import { mockListings, mockCategories as staticCategories } from "../../data/mockData";
import FilterPanel from "../../components/marketplace/FilterPanel";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  const query = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";
  const locationFilter = searchParams.get("location") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [listingsRes, categoriesRes] = await Promise.all([
          getListings(),
          getCategories(),
        ]);
        if (!cancelled) {
          const data = listingsRes?.length ? listingsRes : mockListings;
          const cats = categoriesRes?.length ? categoriesRes : staticCategories;
          setListings(data);
          setCategories(cats);
        }
      } catch {
        if (!cancelled) {
          setListings(mockListings);
          setCategories(staticCategories);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = listings.filter((listing) => {
      if (listing.status === "SUSPENDED") return false;

      if (query) {
        const term = query.toLowerCase();
        const haystack = [
          listing.business_name,
          listing.description,
          listing.category_name,
          listing.city,
          listing.region,
          listing.area,
          listing.seller_email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (categoryFilter && String(listing.category) !== categoryFilter && listing.categoryId !== Number(categoryFilter)) {
        return false;
      }

      if (locationFilter) {
        const loc = [listing.city, listing.region, listing.area]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!loc.includes(locationFilter.toLowerCase())) return false;
      }

      if (minPrice && listing.asking_price < Number(minPrice)) return false;
      if (maxPrice && listing.asking_price > Number(maxPrice)) return false;

      return true;
    });

    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => a.asking_price - b.asking_price);
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => b.asking_price - a.asking_price);
    } else if (sortBy === "newest") {
      result = [...result].sort((a, b) => b.id - a.id);
    } else if (sortBy === "popular") {
      result = [...result].sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    return result;
  }, [listings, query, categoryFilter, locationFilter, minPrice, maxPrice, sortBy]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    setSearchParams({}, { replace: true });
    setSortBy("newest");
  };

  return (
    <div className="mx-auto max-w-6xl bg-surface-sunken px-4 py-6">
      <div className="mb-6">
        <SearchBar
          value={query}
          onChange={(val) => updateFilter("search", val)}
          onSubmit={(e) => e.preventDefault()}
          placeholder="What are you looking for?"
          categories={categories}
        />
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20">
            <FilterPanel
              filters={{
                category: categoryFilter,
                location: locationFilter,
                minPrice: minPrice ? Number(minPrice) : "",
                maxPrice: maxPrice ? Number(maxPrice) : "",
              }}
              categories={categories}
              onChange={(next) => {
                if (next.category !== undefined) updateFilter("category", next.category);
                if (next.location !== undefined) updateFilter("location", next.location);
                if (next.minPrice !== undefined) updateFilter("minPrice", next.minPrice);
                if (next.maxPrice !== undefined) updateFilter("maxPrice", next.maxPrice);
              }}
              onReset={resetFilters}
              resultsCount={filtered.length}
            />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-ink-soft">
              {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                Filters
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingSpinner centered label="Loading listings…" />
          ) : (
            <ListingGrid
              listings={filtered}
              loading={false}
              emptyMessage="No businesses or products found."
            />
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-surface p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-ink">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="rounded-full p-1 text-ink-soft hover:bg-surface-sunken hover:text-ink"
              >
                ✕
              </button>
            </div>
            <FilterPanel
              filters={{
                category: categoryFilter,
                location: locationFilter,
                minPrice: minPrice ? Number(minPrice) : "",
                maxPrice: maxPrice ? Number(maxPrice) : "",
              }}
              categories={categories}
              onChange={(next) => {
                if (next.category !== undefined) updateFilter("category", next.category);
                if (next.location !== undefined) updateFilter("location", next.location);
                if (next.minPrice !== undefined) updateFilter("minPrice", next.minPrice);
                if (next.maxPrice !== undefined) updateFilter("maxPrice", next.maxPrice);
              }}
              onReset={() => {
                resetFilters();
                setShowMobileFilters(false);
              }}
              resultsCount={filtered.length}
            />
          </div>
        </div>
      )}
    </div>
  );
}
