import { Link } from "react-router-dom";
import { Coffee, UtensilsCrossed, BedDouble, Scissors, Cookie, ShoppingBag, Wrench, Dumbbell, LayoutGrid } from "lucide-react";

// REFERENCE ONLY, proposal for Dre, not wired into the real routes.
// Same idea as CategoryCard.jsx, swaps the emoji for a real icon and a
// slightly richer card so it reads less like a plain link.

const categoryIcons = {
  Café: Coffee,
  Restaurant: UtensilsCrossed,
  Hotel: BedDouble,
  Salon: Scissors,
  Bakery: Cookie,
  Retail: ShoppingBag,
  Services: Wrench,
  Fitness: Dumbbell,
};

export default function CategoryCardReference({ category }) {
  const Icon = categoryIcons[category.name] ?? LayoutGrid;
  return (
    <Link
      to={`/search?category=${category.id}`}
      className="group flex shrink-0 w-36 flex-col items-center gap-2.5 rounded-xl border border-border bg-white p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="text-xs font-medium text-ink line-clamp-1">{category.name}</span>
    </Link>
  );
}
