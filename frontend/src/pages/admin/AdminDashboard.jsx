import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { Card } from "../../components/common/Card";

const statCards = [
  { key: "pending_receipts", label: "Pending receipts", to: "/admin/receipts" },
  { key: "pending_media", label: "Pending media", to: "/admin/media" },
  { key: "active_listings", label: "Active listings", to: "/admin/listings" },
  { key: "open_reports", label: "Open reports", to: "/admin/reports" },
  { key: "total_users", label: "Total users", to: "/admin/users" },
  { key: "active_subscriptions", label: "Active subscriptions", to: "/admin/plans" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard/")
      .then(({ data }) => setStats(data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Admin dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Moderation queue and marketplace overview.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <Link key={card.key} to={card.to}>
            <Card className="transition-shadow hover:shadow-md">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                {card.label}
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-brand-600">
                {loading ? "—" : stats[card.key] ?? 0}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
