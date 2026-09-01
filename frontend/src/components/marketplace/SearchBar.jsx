import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Button from "../common/Button";

/**
 * Free-text search + a quick category shortcut. Location, min/max price
 * live only in FilterPanel now, this used to keep its own separate
 * copies of category/location and would wipe FilterPanel's choices on
 * submit. Submitting here now merges onto whatever's already in the URL
 * instead of replacing it, so sidebar filters survive a search.
 */
export default function SearchBar({ value, onChange, onSubmit, placeholder = "What are you looking for?", categories = [] }) {
  const navigate = useNavigate();
  const currentCategory = new URLSearchParams(window.location.search).get("category") || "";

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const form = new FormData(e.target);
    const category = form.get("category") || "";

    if (value?.trim()) params.set("search", value.trim());
    else params.delete("search");

    if (category) params.set("category", category);
    else params.delete("category");

    navigate(`/search?${params.toString()}`);
    onSubmit?.(e);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-12 w-full rounded-lg border border-border bg-white pl-12 pr-4 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" strokeWidth={1.75} />
        </div>

        {categories.length > 0 && (
          <select
            name="category"
            defaultValue={currentCategory}
            className="h-12 rounded-lg border border-border bg-white px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        )}

        <Button type="submit" className="h-12 px-8">
          Search
        </Button>
      </div>
    </form>
  );
}
