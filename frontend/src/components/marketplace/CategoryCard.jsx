import { Link } from "react-router-dom";
import { Coffee, UtensilsCrossed, BedDouble, Scissors, Cookie, ShoppingBag, Wrench, Dumbbell, LayoutGrid } from "lucide-react";

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

// Placeholder photos per category, swap for real listing photos once
// there's real inventory to pull from.
const categoryPhotos = {
  Café: "https://images.unsplash.com/photo-1594402919317-9e67dca0a305?auto=format&fit=crop&w=400&q=70",
  Restaurant: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=400&q=70",
  Hotel: "https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&w=400&q=70",
  Salon: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=400&q=70",
  Bakery: "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&w=400&q=70",
  Retail: "https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?auto=format&fit=crop&w=400&q=70",
  Services: "https://images.unsplash.com/photo-1575663620136-5ebbfcc2c597?auto=format&fit=crop&w=400&q=70",
  Fitness: "https://images.unsplash.com/photo-1637430308606-86576d8fef3c?auto=format&fit=crop&w=400&q=70",
};

export default function CategoryCard({ category }) {
  const Icon = categoryIcons[category.name] ?? LayoutGrid;
  const photo = categoryPhotos[category.name];

  return (
    <Link
      to={`/search?category=${category.id}`}
      className="group flex shrink-0 w-36 flex-col overflow-hidden rounded-xl border border-border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <div className="relative h-20 w-full overflow-hidden bg-surface-sunken">
        {photo && (
          <img
            src={photo}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-700/50 to-transparent" />
        <span className="absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
      </div>
      <span className="px-2.5 py-2 text-center text-xs font-medium text-ink line-clamp-1">
        {category.name}
      </span>
    </Link>
  );
}
