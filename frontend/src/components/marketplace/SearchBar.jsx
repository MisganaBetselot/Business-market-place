import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";

export default function SearchBar({ value, onChange, onSubmit, placeholder = "What are you looking for?", categories = [] }) {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    if (category) params.set("category", category);
    if (location.trim()) params.set("location", location.trim());
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
            className="h-12 w-full rounded-lg border border-border bg-surface pl-12 pr-4 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-12 rounded-lg border border-border bg-surface px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        )}

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="h-12 rounded-lg border border-border bg-surface px-4 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
        />

        <Button type="submit" className="h-12 px-8">
          Search
        </Button>
      </div>
    </form>
  );
}
