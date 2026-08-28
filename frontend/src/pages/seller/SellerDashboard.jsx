import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { mockDashboardStats, mockSellerListings } from "../../data/mockData";

const navItems = [
  { path: "/seller", label: "Overview", icon: "📊" },
  { path: "/seller/products", label: "My Listings", icon: "📦" },
  { path: "/seller/add", label: "Add Listing", icon: "➕" },
  { path: "/messages", label: "Messages", icon: "💬" },
];

export default function SellerDashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between md:hidden mb-4">
          <h1 className="font-display text-xl font-semibold text-ink">Seller Dashboard</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink"
          >
            Menu
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className={`fixed inset-0 z-50 md:static md:block md:w-56 ${sidebarOpen ? "" : "hidden md:block"}`}>
            {sidebarOpen && (
              <div className="absolute inset-0 bg-ink/40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}
            <div className={`relative md:relative w-64 shrink-0 rounded-xl border border-border bg-surface p-4 ${sidebarOpen ? "absolute left-4 top-4 md:static" : ""}`}>
              <div className="hidden md:block mb-4">
                <h2 className="font-display text-lg font-semibold text-ink">Seller Dashboard</h2>
                <p className="text-xs text-ink-soft">{user?.first_name || "Seller"}</p>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-surface-muted hover:text-ink transition-colors"
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="hidden md:block mb-6">
              <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
              <p className="text-sm text-ink-soft">Welcome back, {user?.first_name || "seller"}.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
              <StatCard label="Active Listings" value={mockDashboardStats.activeListings} />
              <StatCard label="Total Views" value={mockDashboardStats.totalViews.toLocaleString()} />
              <StatCard label="Messages" value={mockDashboardStats.messages} />
              <StatCard label="Favorites" value={mockDashboardStats.favorites} />
              <StatCard label="Sold" value={mockDashboardStats.sold} />
            </div>

            {/* Recent Listings */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-ink">Recent Listings</h3>
                <Link to="/seller/products" className="text-sm font-medium text-brand-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-ink-soft">
                      <th className="pb-2 font-medium">Image</th>
                      <th className="pb-2 font-medium">Title</th>
                      <th className="pb-2 font-medium">Price</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Views</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSellerListings.map((listing) => (
                      <tr key={listing.id} className="border-b border-border last:border-0">
                        <td className="py-3">
                          <img src={listing.image} alt={listing.title} className="h-10 w-10 rounded-lg object-cover" />
                        </td>
                        <td className="py-3 font-medium text-ink">{listing.title}</td>
                        <td className="py-3 text-ink-soft">{listing.price.toLocaleString()} ETB</td>
                        <td className="py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${listing.status === "Active" ? "bg-green-50 text-success" : "bg-brand-50 text-brand-600"}`}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="py-3 text-ink-soft">{listing.views}</td>
                        <td className="py-3 text-ink-soft">{listing.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
