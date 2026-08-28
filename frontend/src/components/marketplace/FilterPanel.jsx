export default function FilterPanel({ filters, onChange, onReset, resultsCount, categories = [] }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">
          {resultsCount != null ? `${resultsCount} result${resultsCount !== 1 ? "s" : ""}` : "Filters"}
        </p>
        {Object.values(filters).some(Boolean) && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink-soft">Category</label>
          <select
            value={filters.category || ""}
            onChange={(e) => update("category", e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink-soft">Location</label>
          <input
            type="text"
            value={filters.location || ""}
            onChange={(e) => update("location", e.target.value)}
            placeholder="City or region"
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink-soft">Min price</label>
          <input
            type="number"
            value={filters.minPrice || ""}
            onChange={(e) => update("minPrice", e.target.value ? Number(e.target.value) : "")}
            placeholder="0"
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink-soft">Max price</label>
          <input
            type="number"
            value={filters.maxPrice || ""}
            onChange={(e) => update("maxPrice", e.target.value ? Number(e.target.value) : "")}
            placeholder="Any"
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
        </div>
      </div>
    </div>
  );
}
