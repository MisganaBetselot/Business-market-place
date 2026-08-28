import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Card, Badge } from "../../components/common/Card";

/**
 * Landing page after login — /account. Quick status + shortcuts into the
 * other modules. The linked-to sections (listings, subscriptions,
 * messaging, notifications) belong to Dre, Muni, and msgana — this page
 * only routes to them, it doesn't render their content.
 */
export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const shortcuts = [
    { to: "/account/profile", label: "Edit profile", blurb: "Update your name, bio, and contact info." },
    { to: "/notifications", label: "Notifications", blurb: "See updates on your listings and receipts." },
    { to: "/favorites", label: "Favorites", blurb: "Businesses you've saved." },
    { to: "/seller", label: "Seller tools", blurb: "Manage your listings and subscriptions." },
  ];

  const firstName = user?.first_name || "there";
  const displayName = firstName.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
        </div>
        <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>{user.status || "ACTIVE"}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {shortcuts.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <p className="font-medium text-ink">{s.label}</p>
              <p className="mt-1 text-sm text-ink-soft">{s.blurb}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
