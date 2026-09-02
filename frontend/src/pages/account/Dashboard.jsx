import { Link } from "react-router-dom";
import { User, Bell, Heart, Store } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Card, Badge } from "../../components/common/Card";

/**
 * Landing page after login, at /account. Quick status + shortcuts into the
 * other modules. The linked-to sections (listings, subscriptions,
 * messaging, notifications) belong to Dre, Muni, and Misgana, this page
 * only routes to them, it doesn't render their content.
 */
export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const shortcuts = [
    { to: "/account/profile", label: "Edit profile", blurb: "Update your name, bio, and contact info.", Icon: User },
    { to: "/notifications", label: "Notifications", blurb: "See updates on your listings and receipts.", Icon: Bell },
    { to: "/favorites", label: "Favorites", blurb: "Businesses you've saved.", Icon: Heart },
    { to: "/seller", label: "Seller tools", blurb: "Manage your listings and subscriptions.", Icon: Store },
  ];

  const firstName = user?.first_name || "there";
  const displayName = firstName.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
        </div>
        <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>{user.status || "ACTIVE"}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {shortcuts.map((s, i) => (
          <Link key={s.to} to={s.to} className={`animate-fade-up stagger-${i + 1}`}>
            <Card className="group h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200">
              <s.Icon className="h-6 w-6 text-brand-500" strokeWidth={1.75} />
              <p className="mt-2 font-medium text-ink group-hover:text-brand-600 transition-colors">{s.label}</p>
              <p className="mt-1 text-sm text-ink-soft">{s.blurb}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
