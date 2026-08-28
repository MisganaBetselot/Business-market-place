import { Link } from "react-router-dom";

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/search?category=${category.id}`}
      className="flex shrink-0 w-36 flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center transition-shadow hover:shadow-sm"
    >
      <span className="text-2xl" aria-hidden="true">{category.icon || "📦"}</span>
      <span className="text-xs font-medium text-ink line-clamp-1">{category.name}</span>
    </Link>
  );
}
