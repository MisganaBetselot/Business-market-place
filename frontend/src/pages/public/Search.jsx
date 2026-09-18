
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCategories } from "../../api/categories";
import { getListings } from "../../api/listings";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ListingGrid from "../../components/marketplace/ListingGrid";
import SearchBar from "../../components/marketplace/SearchBar";
import { mockCategories as staticCategories } from "../../data/mockData";
 
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  setListings(listingsRes ?? []);
  setCategories(categoriesRes?.length ? categoriesRes : staticCategories);
}
      } catch {
  if (!cancelled) {
    setError("Couldn't load listings.");
    setListings([]);
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
 
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-ink-soft">
            {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
          </p>
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
  );
}
 

