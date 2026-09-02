import { Link } from "react-router-dom";
import { Coffee, UtensilsCrossed, BedDouble, Scissors, Cookie, ShoppingBag, Wrench, Dumbbell } from "lucide-react";
import { mockCategories } from "../../data/mockData";
import Logo from "./Logo";

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

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-brand-700">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Logo variant="light" />
            <p className="mt-3 max-w-xs text-sm text-white/70">
              Buy and sell existing businesses across Ethiopia, cafes, shops, salons, and more.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gold-400">Categories</p>
            {mockCategories.slice(0, 5).map((cat) => {
              const Icon = categoryIcons[cat.name];
              return (
                <Link
                  key={cat.id}
                  to={`/search?category=${cat.id}`}
                  className="flex items-center gap-1.5 text-sm text-white/75 hover:text-white transition-colors"
                >
                  {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  {cat.name}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gold-400">Marketplace</p>
            <Link to="/search" className="text-sm text-white/75 hover:text-white transition-colors">Browse all</Link>
            <Link to="/favorites" className="text-sm text-white/75 hover:text-white transition-colors">Favorites</Link>
            <Link to="/seller" className="text-sm text-white/75 hover:text-white transition-colors">List your business</Link>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gold-400">Account</p>
            <Link to="/login" className="text-sm text-white/75 hover:text-white transition-colors">Log in</Link>
            <Link to="/register" className="text-sm text-white/75 hover:text-white transition-colors">Sign up</Link>
            <Link to="/account/profile" className="text-sm text-white/75 hover:text-white transition-colors">Your profile</Link>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-gold-400">Promotions</p>
            <span className="inline-flex w-fit items-center rounded-full bg-gold-400 px-2.5 py-1 text-xs font-semibold text-white">
              Coming soon
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © {year} Addis Gebeya. All rights reserved.
      </div>
    </footer>
  );
}
