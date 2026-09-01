export default function FilterPanel({ filters, onChange, onReset, resultsCount, categories = [] }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <p className="text-sm font-semibold text-ink">
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

      {/* Always one column: this panel only ever renders in a narrow
          sidebar (desktop) or a mobile drawer, never full width, so a
          responsive multi-column grid here just clips the labels. */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-brand-600">Category</label>
          <select
            value={filters.category || ""}
            onChange={(e) => update("category", e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-brand-600">Location</label>
          <input
            type="text"
            value={filters.location || ""}
            onChange={(e) => update("location", e.target.value)}
            placeholder="City or region"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gold-500">Min price</label>
            <input
              type="number"
              value={filters.minPrice || ""}
              onChange={(e) => update("minPrice", e.target.value ? Number(e.target.value) : "")}
              placeholder="0"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gold-500">Max price</label>
            <input
              type="number"
              value={filters.maxPrice || ""}
              onChange={(e) => update("maxPrice", e.target.value ? Number(e.target.value) : "")}
              placeholder="Any"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
