import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../../api/categories";
import api from "../../api/client";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";

const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "listings", label: "My Listings", icon: "📦" },
  { id: "add", label: "Add Listing", icon: "➕" },
  { id: "subscription", label: "Subscription", icon: "💳" },
  { id: "media", label: "Media", icon: "🖼️" },
  { id: "messages", label: "Messages", icon: "💬" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
];

const NAV_ITEMS = [
  { path: "overview", label: "Overview", icon: "📊" },
  { path: "listings", label: "My Listings", icon: "📦" },
  { path: "add", label: "Add Listing", icon: "➕" },
  { path: "subscription", label: "Subscription", icon: "💳" },
  { path: "media", label: "Media", icon: "🖼️" },
  { path: "messages", label: "Messages", icon: "💬" },
  { path: "notifications", label: "Notifications", icon: "🔔" },
];

const STATUS_BADGE = {
  DRAFT: { label: "Draft", className: "bg-surface-sunken text-ink-soft" },
  ACTIVE: { label: "Active", className: "bg-brand-50 text-brand-600" },
  SOLD: { label: "Sold", className: "bg-green-50 text-success" },
  SUSPENDED: { label: "Suspended", className: "bg-danger/10 text-danger" },
};

const SUB_STATUS_BADGE = {
  PENDING: { label: "Pending Review", className: "bg-gold-100 text-gold-500" },
  ACTIVE: { label: "Active", className: "bg-brand-50 text-brand-600" },
  EXPIRED: { label: "Expired", className: "bg-surface-sunken text-ink-soft" },
  REJECTED: { label: "Rejected", className: "bg-danger/10 text-danger" },
  CANCELLED: { label: "Cancelled", className: "bg-surface-sunken text-ink-soft" },
};

const LISTING_STATUSES = ["DRAFT", "ACTIVE", "SOLD", "SUSPENDED"];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function badgeFor(status, map = STATUS_BADGE) {
  return map[status] ?? { label: status || "Unknown", className: "bg-surface-sunken text-ink-soft" };
}

function emptyState(title, subtitle, cta) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      {cta}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Overview Section                                                   */
/* ------------------------------------------------------------------ */

function initials(user) {
  const a = (user?.first_name || "").trim()[0] ?? "";
  const b = (user?.last_name || "").trim()[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

function formatCurrency(value) {
  if (value == null) return "—";
  return `ETB ${Number(value).toLocaleString()}`;
}

const OVERVIEW_LISTING_BADGE = {
  ACTIVE: { label: "Live", className: "bg-brand-50 text-brand-600" },
  DRAFT: { label: "Draft", className: "bg-surface-sunken text-ink-soft" },
  SOLD: { label: "Sold", className: "bg-blue-50 text-blue-600" },
  SUSPENDED: { label: "Suspended", className: "bg-danger/10 text-danger" },
};

function ProfileCard({ user, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-surface-sunken" />
          <div className="h-4 w-32 rounded bg-surface-sunken" />
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-3 w-3/4 rounded bg-surface-sunken" />
          <div className="h-3 w-2/3 rounded bg-surface-sunken" />
          <div className="h-3 w-1/2 rounded bg-surface-sunken" />
        </div>
      </div>
    );
  }

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Seller";

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">
          {initials(user)}
        </div>
        <p className="font-display text-lg font-semibold text-ink">{fullName}</p>
      </div>

      <div className="mt-4 space-y-2.5 text-sm text-ink-soft">
        {user?.phone && (
          <div className="flex items-center gap-2">
            <span aria-hidden="true">📞</span>
            <span>{user.phone}</span>
          </div>
        )}
        {user?.email && (
          <div className="flex items-center gap-2">
            <span aria-hidden="true">✉️</span>
            <span>{user.email}</span>
          </div>
        )}
      </div>

      {user?.created_at && (
        <>
          <div className="my-4 border-t border-border" />
          <p className="text-xs text-ink-soft">Member since {formatDate(user.created_at)}</p>
        </>
      )}
    </div>
  );
}

function OverviewListingRow({ listing }) {
  const thumb = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url;
  const badge = badgeFor(listing.status, OVERVIEW_LISTING_BADGE);

  return (
    <div className="flex items-center gap-4 border-b border-border py-4 last:border-0">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-soft" aria-hidden="true">🏢</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-semibold text-ink">{listing.business_name}</p>
        <p className="text-sm text-ink-soft">
          {listing.category_name || "Uncategorized"} · {formatDate(listing.created_at)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold text-ink">{formatCurrency(listing.asking_price)}</p>
        <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="hidden shrink-0 items-center gap-1 text-sm text-ink-soft sm:flex">
        <span aria-hidden="true">👁</span>
        {listing.views ?? 0}
      </div>
    </div>
  );
}

function OverviewSection({ onNavigate }) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["seller", "overview"],
    queryFn: async () => {
      const { data } = await api.get("/seller/overview/");
      return data;
    },
    retry: false,
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["listings", "mine"],
    queryFn: async () => {
      const { data } = await api.get("/listings/", { params: { mine: "true" } });
      return data;
    },
  });

  const recentListings = useMemo(() => {
    const raw = listingsData;
    const arr = Array.isArray(raw) ? raw : raw?.results ?? [];
    return [...arr]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);
  }, [listingsData]);

  const listingCounts = data?.listing_counts ?? {};
  const totalListings =
    (listingCounts.draft ?? 0) + (listingCounts.active ?? 0) + (listingCounts.sold ?? 0) + (listingCounts.suspended ?? 0);
  const totalViews = data?.total_views ?? 0;
  const savedBusinesses = data?.saved_businesses_count ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <ProfileCard user={user} isLoading={isLoading} />

        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-surface-sunken" />
            ))
          ) : (
            <>
              <StatCard label="Listings" value={totalListings} />
              <StatCard label="Published" value={listingCounts.active ?? 0} />
              <StatCard label="Total Views" value={totalViews.toLocaleString()} />
              <StatCard label="Saved Businesses" value={savedBusinesses} />
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">My Listings</h3>
          <button
            type="button"
            onClick={() => onNavigate("listings")}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            View all
          </button>
        </div>

        {listingsLoading ? (
          <div className="space-y-4 py-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-sunken" />
            ))}
          </div>
        ) : recentListings.length === 0 ? (
          emptyState("No listings yet", "Create your first listing to get started.", (
            <Button size="sm" className="mt-4" onClick={() => onNavigate("add")}>Add Listing</Button>
          ))
        ) : (
          <div>
            {recentListings.map((listing) => (
              <OverviewListingRow key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Listings Section                                                   */
/* ------------------------------------------------------------------ */

function ListingsSection({ onNavigate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [form, setForm] = useState({
    business_name: "",
    description: "",
    asking_price: "",
    category: "",
    region: "",
    city: "",
    area: "",
    address: "",
    phone: "",
    whatsapp: "",
    contact_email: "",
    status: "DRAFT",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const qc = useQueryClient();

  const { data: listingsData, isLoading: listingsLoading, error: listingsError, refetch: refetchListings } = useQuery({
    queryKey: ["listings", "mine"],
    queryFn: async () => {
      const { data } = await api.get("/listings/", { params: { mine: "true" } });
      return data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await getCategories();
      return data;
    },
  });

  const listings = useMemo(() => {
    const raw = listingsData;
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : raw.results ?? [];
    return arr;
  }, [listingsData]);

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/listings/", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["seller", "overview"] });
      resetForm();
      onNavigate("listings");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/listings/${id}/`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["seller", "overview"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/listings/${id}/`).then(() => id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["seller", "overview"] });
      setDeleteConfirmId(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/listings/${id}/`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["seller", "overview"] });
    },
  });

  function resetForm() {
    setForm({
      business_name: "",
      description: "",
      asking_price: "",
      category: "",
      region: "",
      city: "",
      area: "",
      address: "",
      phone: "",
      whatsapp: "",
      contact_email: "",
      status: "DRAFT",
    });
    setShowForm(false);
    setEditingId(null);
    setFormError("");
  }

  function startCreate() {
    setEditingId(null);
    setForm({
      business_name: "",
      description: "",
      asking_price: "",
      category: "",
      region: "",
      city: "",
      area: "",
      address: "",
      phone: "",
      whatsapp: "",
      contact_email: "",
      status: "DRAFT",
    });
    setShowForm(true);
    setFormError("");
  }

  function startEdit(listing) {
    setEditingId(listing.id);
    setForm({
      business_name: listing.business_name || "",
      description: listing.description || "",
      asking_price: listing.asking_price != null ? String(listing.asking_price) : "",
      category: listing.category != null ? String(listing.category) : "",
      region: listing.region || "",
      city: listing.city || "",
      area: listing.area || "",
      address: listing.address || "",
      phone: listing.phone || "",
      whatsapp: listing.whatsapp || "",
      contact_email: listing.contact_email || "",
      status: listing.status || "DRAFT",
    });
    setShowForm(true);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        business_name: form.business_name,
        description: form.description,
        asking_price: form.asking_price ? Number(form.asking_price) : 0,
        category: Number(form.category),
        region: form.region,
        city: form.city,
        area: form.area || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        contact_email: form.contact_email || undefined,
        status: form.status,
      };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (err) {
      setFormError(err.response?.data?.detail || err.response?.data || "Couldn't save listing.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert(err.response?.data?.detail || "Couldn't delete listing.");
      setDeleteConfirmId(null);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await statusMutation.mutateAsync({ id, status: newStatus });
    } catch (err) {
      alert(err.response?.data?.detail || "Couldn't update status.");
    }
  }

  const categories = useMemo(() => {
    const raw = categoriesData;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.results ?? [];
  }, [categoriesData]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">
          My Listings ({listings.length})
        </h3>
        <Button size="sm" onClick={startCreate}>
          <span aria-hidden="true">➕</span> New Listing
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-surface p-5 space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Title *"
              name="business_name"
              value={form.business_name}
              onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
              required
            />
            <Input
              label="Price (USD) *"
              type="number"
              name="asking_price"
              value={form.asking_price}
              onChange={(e) => setForm((f) => ({ ...f, asking_price: e.target.value }))}
              required
            />
            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <Input
              label="Region"
              name="region"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            />
            <Input
              label="Area"
              name="area"
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            />
            <Input
              label="Address"
              name="address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="WhatsApp"
              name="whatsapp"
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            />
            <Input
              label="Contact Email"
              type="email"
              name="contact_email"
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-600">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
                className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-600">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              >
                {LISTING_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-600">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              required
              className="rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
            />
          </div>
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div className="flex gap-3">
            <Button type="submit" loading={isSubmitting}>
              {editingId ? "Save Changes" : "Create Listing"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {deleteConfirmId && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-5">
          <p className="text-sm font-medium text-danger">Delete this listing permanently?</p>
          <div className="mt-3 flex gap-3">
            <Button
              size="sm"
              variant="danger"
              loading={isDeleting}
              onClick={() => handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-soft">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Views</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listingsLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-soft">
                  <LoadingSpinner centered label="Loading listings…" />
                </td>
              </tr>
            ) : listingsError ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-danger">
                  {listingsError?.response?.data?.detail || listingsError?.message || "Couldn't load listings."}
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-soft">
                  {emptyState("No listings yet", "Create your first listing to get started.", (
                    <Button size="sm" className="mt-4" onClick={startCreate}>Create Listing</Button>
                  ))}
                </td>
              </tr>
            ) : (
              listings.map((listing) => (
                <tr key={listing.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{listing.business_name}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {listing.asking_price != null ? `$${Number(listing.asking_price).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={listing.status}
                      onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 cursor-pointer ${badgeFor(listing.status).className}`}
                    >
                      {LISTING_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{listing.views ?? 0}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(listing.created_at)}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(listing.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(listing)}
                        className="text-ink-soft hover:text-brand-600"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(listing.id)}
                        className="text-ink-soft hover:text-danger"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Subscription Section                                               */
/* ------------------------------------------------------------------ */

function SubscriptionSection() {
  const [view, setView] = useState("current"); // current | choose_plan | upload_receipt
  const [chosenPlanId, setChosenPlanId] = useState("");
  const [chosenListingId, setChosenListingId] = useState("");
  const [error, setError] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const qc = useQueryClient();

  const { data: subscriptionsData, isLoading: subsLoading, error: subsError, refetch: refetchSubs } = useQuery({
    queryKey: ["mySubscriptions"],
    queryFn: async () => {
      const { data } = await api.get("/seller-subscriptions/");
      return data;
    },
    retry: false,
  });

  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await api.get("/subscriptions/");
      return data;
    },
  });

  const { data: listingsData } = useQuery({
    queryKey: ["listings", "mine"],
    queryFn: async () => {
      const { data } = await api.get("/listings/", { params: { mine: "true" } });
      return data;
    },
  });

  const { data: paymentsData, isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data } = await api.get("/payments/");
      return data;
    },
    retry: false,
  });

  const subscriptions = useMemo(() => {
    const raw = subscriptionsData;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.results ?? [];
  }, [subscriptionsData]);

  const plans = useMemo(() => {
    const raw = plansData;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.results ?? [];
  }, [plansData]);

  const myListings = useMemo(() => {
    const raw = listingsData;
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : raw.results ?? [];
    return arr;
  }, [listingsData]);

  const payments = useMemo(() => {
    const raw = paymentsData;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.results ?? [];
  }, [paymentsData]);

  const current = subscriptions[0];

  const hasPendingReceipt = current
    ? payments.some((p) => String(p.subscription) === String(current.id) && p.status === "PENDING")
    : false;

  const needsReceiptUpload = current && (current.status === "PENDING" || current.status === "REJECTED") && !hasPendingReceipt;

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/seller-subscriptions/", payload).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["mySubscriptions"] });
      qc.invalidateQueries({ queryKey: ["seller", "overview"] });
      setChosenPlanId("");
      setChosenListingId("");
      setError("");
      setView("upload_receipt");
      setUploadSuccess(false);
      setUploadError("");
      setUploadFile(null);
      window._lastCreatedSubscriptionId = data.id;
    },
    onError: (err) => {
      setError(err.response?.data?.detail || err.response?.data || "Couldn't create subscription.");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ subscriptionId, file }) => {
      const fd = new FormData();
      fd.append("subscription", subscriptionId);
      fd.append("receipt_file", file);
      return api.post("/payments/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["mySubscriptions"] });
      qc.invalidateQueries({ queryKey: ["seller", "overview"] });
      setUploadSuccess(true);
      setUploadError("");
      setUploadFile(null);
    },
    onError: (err) => {
      setUploadError(err.response?.data?.detail || err.response?.data || "Upload failed.");
    },
  });

  async function handleCreateSubscription(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        plan: Number(chosenPlanId),
        listing: Number(chosenListingId),
      };
      await createMutation.mutateAsync(payload);
    } finally {
      // mutation handles state
    }
  }

  async function handleUploadReceipt(e) {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess(false);

    if (!uploadFile) {
      setUploadError("Please select a file.");
      return;
    }

    const subscriptionId = window._lastCreatedSubscriptionId || current?.id;
    if (!subscriptionId) {
      setUploadError("No subscription found. Please create a subscription first.");
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync({ subscriptionId, file: uploadFile });
    } finally {
      setUploading(false);
    }
  }

  function startPlanFlow() {
    setChosenPlanId("");
    setChosenListingId("");
    setError("");
    setView("choose_plan");
    setUploadSuccess(false);
    setUploadError("");
    setUploadFile(null);
  }

  function showUploadForm() {
    setView("upload_receipt");
    setUploadSuccess(false);
    setUploadError("");
    setUploadFile(null);
  }

  if (subsLoading) {
    return <LoadingSpinner centered label="Loading subscription…" />;
  }

  if (subsError) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-6 text-center">
        <p className="text-sm font-medium text-danger">
          {subsError?.response?.data?.detail || subsError?.message || "Couldn't load subscription."}
        </p>
        <Button size="sm" className="mt-3" onClick={() => refetchSubs()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!current) {
    if (view === "choose_plan") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink">Choose a Plan</h3>
            <Button size="sm" variant="ghost" onClick={() => setView("current")}>
              Cancel
            </Button>
          </div>

          {plansLoading ? (
            <LoadingSpinner centered label="Loading plans…" />
          ) : plansError ? (
            <p className="text-sm text-danger">Couldn't load plans.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                    chosenPlanId === String(plan.id)
                      ? "border-brand-500 bg-brand-50"
                      : "border-border bg-surface hover:border-brand-200"
                  }`}
                  onClick={() => setChosenPlanId(String(plan.id))}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-display text-base font-semibold text-ink">{plan.name}</h5>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${plan.is_active ? "bg-brand-50 text-brand-600" : "bg-surface-sunken text-ink-soft"}`}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-brand-600">
                    {plan.price != null ? `${Number(plan.price).toLocaleString()} ETB` : "—"}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">{plan.duration_days} days · {plan.media_type}</p>
                  {plan.media_limit != null && (
                    <p className="mt-1 text-xs text-ink-soft">Up to {plan.media_limit} photos</p>
                  )}
                  {plan.description && (
                    <p className="mt-2 text-xs text-ink-soft">{plan.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {chosenPlanId && (
            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-600">Select Listing *</label>
                <select
                  value={chosenListingId}
                  onChange={(e) => setChosenListingId(e.target.value)}
                  required
                  className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                >
                  <option value="">Choose a listing</option>
                  {myListings.map((l) => (
                    <option key={l.id} value={l.id}>{l.business_name}</option>
                  ))}
                </select>
                {myListings.length === 0 && (
                  <p className="text-xs text-ink-soft">
                    You need a listing first. <Link to="/seller/add" className="text-brand-600 hover:underline">Create one</Link>.
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <div className="flex gap-3">
                <Button type="submit" loading={createMutation.isPending}>
                  Create Subscription
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setChosenPlanId(""); setChosenListingId(""); }}>
                  Back
                </Button>
              </div>
            </form>
          )}
        </div>
      );
    }

    if (view === "upload_receipt") {
      return <ReceiptUploadForm subscriptionId={window._lastCreatedSubscriptionId} onSuccess={() => { setView("current"); setUploadSuccess(false); }} />;
    }

    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-ink-soft">No active subscription.</p>
        <Button size="sm" className="mt-3" onClick={startPlanFlow}>
          Choose a Plan
        </Button>
      </div>
    );
  }

  const plan = current.plan || {};
  const badge = badgeFor(current.status, SUB_STATUS_BADGE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">Current Subscription</h3>
        <Button size="sm" onClick={startPlanFlow}>
          New Plan
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-display text-lg font-semibold text-ink">
              {plan.name || "Plan"}
            </h4>
            <p className="mt-1 text-sm text-ink-soft">
              {current.listing?.business_name ?? current.listing_id ?? "—"}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-ink-soft">Plan</p>
            <p className="mt-1 text-sm font-semibold text-ink">{plan.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Price</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {plan.price != null ? `${Number(plan.price).toLocaleString()} ETB` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Media Type</p>
            <p className="mt-1 text-sm font-semibold text-ink">{plan.media_type ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Duration</p>
            <p className="mt-1 text-sm font-semibold text-ink">{plan.duration_days ?? "—"} days</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Photo Limit</p>
            <p className="mt-1 text-sm font-semibold text-ink">{plan.media_limit ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Started</p>
            <p className="mt-1 text-sm font-semibold text-ink">{formatDate(current.start_date)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Expires</p>
            <p className="mt-1 text-sm font-semibold text-ink">{formatDate(current.expiry_date)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Status</p>
            <p className="mt-1 text-sm font-semibold text-ink">{badge.label}</p>
          </div>
        </div>

        {current.status === "REJECTED" && current.rejection_reason && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger/5 px-3 py-2">
            <span className="text-danger text-xs">Rejection reason:</span>
            <span className="text-xs text-ink-soft">{current.rejection_reason}</span>
          </div>
        )}

        {current.status === "PENDING" && !hasPendingReceipt && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface-sunken/60 px-5 py-4">
            <span className="text-gold-500 text-lg">⏳</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Payment under review</p>
              <p className="mt-1 text-sm text-ink-soft">
                No receipt uploaded yet. Please upload your payment receipt to complete this step.
              </p>
              <Button size="sm" className="mt-3" onClick={showUploadForm}>Upload Receipt</Button>
            </div>
          </div>
        )}

        {current.status === "PENDING" && hasPendingReceipt && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface-sunken/60 px-5 py-4">
            <span className="text-gold-500 text-lg">⏳</span>
            <div>
              <p className="text-sm font-semibold text-ink">Payment under review</p>
              <p className="mt-1 text-sm text-ink-soft">
                An administrator is verifying your receipt. This usually takes up to 24 hours.
              </p>
            </div>
          </div>
        )}

        {current.status === "REJECTED" && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 px-5 py-4">
            <span className="text-danger text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Payment was rejected</p>
              <p className="mt-1 text-sm text-ink-soft">
                Please upload a new receipt to retry.
              </p>
              <Button size="sm" className="mt-3" onClick={showUploadForm}>Upload New Receipt</Button>
            </div>
          </div>
        )}

        {current.status === "ACTIVE" && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface-sunken/60 px-5 py-4">
            <span className="text-brand-600 text-lg">✅</span>
            <div>
              <p className="text-sm font-semibold text-ink">Subscription active</p>
              <p className="mt-1 text-sm text-ink-soft">
                Your plan is active. You can now upload media for your listing.
              </p>
            </div>
          </div>
        )}
      </div>

      {view === "upload_receipt" && (
        <ReceiptUploadForm
          subscriptionId={window._lastCreatedSubscriptionId || current?.id}
          onSuccess={() => {
            setView("current");
            setUploadSuccess(false);
            setUploadError("");
            setUploadFile(null);
          }}
        />
      )}

      <PaymentHistory payments={payments} paymentsLoading={paymentsLoading} paymentsError={paymentsError} />
    </div>
  );
}

function ReceiptUploadForm({ subscriptionId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const qc = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ subscriptionId, file }) => {
      const fd = new FormData();
      fd.append("subscription", subscriptionId);
      fd.append("receipt_file", file);
      return api.post("/payments/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["mySubscriptions"] });
      qc.invalidateQueries({ queryKey: ["seller", "overview"] });
      setSuccess(true);
      setError("");
    },
    onError: (err) => {
      setError(err.response?.data?.detail || err.response?.data || "Upload failed.");
    },
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!file) {
      setError("Please select a file.");
      return;
    }

    if (!subscriptionId) {
      setError("No subscription found. Please create a subscription first.");
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync({ subscriptionId, file });
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!validTypes.includes(selected.type)) {
      setError("Invalid file type. Please upload a JPG, PNG, or PDF file.");
      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (selected.size > maxSize) {
      setError("File is too large. Maximum size is 5MB.");
      e.target.value = "";
      return;
    }

    setFile(selected);
    setError("");
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-display text-lg font-semibold text-ink">Upload Payment Receipt</h4>
        <Button size="sm" variant="ghost" onClick={onSuccess}>
          Cancel
        </Button>
      </div>

      {success ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-5 py-4">
          <p className="text-sm font-semibold text-brand-600">Receipt uploaded successfully!</p>
          <p className="mt-1 text-sm text-ink-soft">
            An administrator will review your payment receipt. This usually takes up to 24 hours.
            Your listing will be published once payment is approved.
          </p>
          <Button size="sm" className="mt-3" onClick={onSuccess}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-600">Receipt File *</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink disabled:opacity-60"
            />
            <p className="text-xs text-ink-soft">Accepted formats: JPG, PNG, PDF. Maximum size: 5MB.</p>
            {file && (
              <p className="text-xs text-brand-600">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" loading={uploading}>
              {uploading ? "Uploading…" : "Upload Receipt"}
            </Button>
            <Button type="button" variant="ghost" onClick={onSuccess}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function PaymentHistory({ payments, paymentsLoading, paymentsError }) {
  if (paymentsLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <LoadingSpinner centered label="Loading payment history…" />
      </div>
    );
  }

  if (paymentsError) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-6 text-center">
        <p className="text-sm font-medium text-danger">
          {paymentsError?.response?.data?.detail || paymentsError?.message || "Couldn't load payment history."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h4 className="font-display text-lg font-semibold text-ink">Payment History</h4>
      {payments.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">No payment history yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {payments.map((payment) => {
            const badge = badgeFor(payment.status, SUB_STATUS_BADGE);
            return (
              <div key={payment.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">Receipt #{payment.id}</p>
                    <p className="text-xs text-ink-soft">
                      Subscription #{payment.subscription} · {formatDate(payment.created_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
                {payment.status === "REJECTED" && payment.rejection_reason && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-danger/5 px-3 py-2">
                    <span className="text-danger text-xs">Rejection reason:</span>
                    <span className="text-xs text-ink-soft">{payment.rejection_reason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Media Section                                                      */
/* ------------------------------------------------------------------ */

function MediaSection() {
  const [selectedListingId, setSelectedListingId] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [mediaType, setMediaType] = useState("PHOTO");
  const [photoFile, setPhotoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const qc = useQueryClient();

  const { data: listingsData } = useQuery({
    queryKey: ["listings", "mine"],
    queryFn: async () => {
      const { data } = await api.get("/listings/", { params: { mine: "true" } });
      return data;
    },
  });

  const { data: subscriptionsData } = useQuery({
    queryKey: ["mySubscriptions"],
    queryFn: async () => {
      const { data } = await api.get("/seller-subscriptions/");
      return data;
    },
    retry: false,
  });

  const myListings = useMemo(() => {
    const raw = listingsData;
    if (!raw) return [];
    const arr = Array.isArray(raw) ? raw : raw.results ?? [];
    return arr;
  }, [listingsData]);

  const subscriptions = useMemo(() => {
    const raw = subscriptionsData;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : raw.results ?? [];
  }, [subscriptionsData]);

  const selectedListing = myListings.find((l) => String(l.id) === String(selectedListingId));

  const activeSubscriptionForListing = selectedListingId
    ? subscriptions.find(
        (s) =>
          String(s.listing?.id) === String(selectedListingId) &&
          s.status === "ACTIVE"
      )
    : null;

  const mediaLimit = activeSubscriptionForListing?.plan?.media_limit ?? null;
  const currentPhotoCount = mediaItems.filter(
    (m) => m.media_type === "PHOTO" && m.status !== "REJECTED"
  ).length;

  async function loadMedia(listingId) {
    setMediaLoading(true);
    setMediaError("");
    setShowUpload(false);
    setUploadSuccess(false);
    setUploadError("");
    setPhotoFile(null);
    setVideoUrl("");
    try {
      const { data } = await api.get("/media/", { params: { listing: listingId } });
      const arr = Array.isArray(data) ? data : data.results ?? [];
      setMediaItems(arr);
    } catch {
      setMediaError("Couldn't load media.");
      setMediaItems([]);
    } finally {
      setMediaLoading(false);
    }
  }

  function handleSelectListing(listingId) {
    setSelectedListingId(listingId);
    if (listingId) {
      loadMedia(listingId);
    } else {
      setMediaItems([]);
      setShowUpload(false);
    }
  }

  const uploadMutation = useMutation({
    mutationFn: (payload) => {
      const fd = new FormData();
      fd.append("listing", selectedListingId);
      fd.append("subscription", activeSubscriptionForListing.id);
      fd.append("media_type", mediaType);
      if (mediaType === "PHOTO") {
        fd.append("file_path", payload.file);
      } else {
        fd.append("video_url", payload.videoUrl);
      }
      return api.post("/media/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["mySubscriptions"] });
      setUploadSuccess(true);
      setUploadError("");
      setPhotoFile(null);
      setVideoUrl("");
      loadMedia(selectedListingId);
    },
    onError: (err) => {
      setUploadError(err.response?.data?.detail || err.response?.data || "Upload failed.");
    },
  });

  async function handleUpload(e) {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess(false);

    if (!selectedListingId) {
      setUploadError("Please select a listing first.");
      return;
    }

    if (!activeSubscriptionForListing) {
      setUploadError("No active subscription found for this listing. Please subscribe first.");
      return;
    }

    if (mediaType === "PHOTO" && !photoFile) {
      setUploadError("Please select a photo to upload.");
      return;
    }

    if (mediaType === "VIDEO" && !videoUrl.trim()) {
      setUploadError("Please enter a video URL.");
      return;
    }

    setUploading(true);
    try {
      if (mediaType === "PHOTO") {
        await uploadMutation.mutateAsync({ file: photoFile });
      } else {
        await uploadMutation.mutateAsync({ videoUrl });
      }
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setPhotoFile(selected);
    setUploadError("");
  }

  const canUploadPhoto = mediaLimit === null || currentPhotoCount < mediaLimit;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-brand-600">Select Listing</label>
        <select
          value={selectedListingId}
          onChange={(e) => handleSelectListing(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
        >
          <option value="">Choose a listing</option>
          {myListings.map((l) => (
            <option key={l.id} value={l.id}>{l.business_name}</option>
          ))}
        </select>
      </div>

      {selectedListingId && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-lg font-semibold text-ink">Upload Media</h4>
            <Button size="sm" variant="ghost" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
          </div>

          {!activeSubscriptionForListing ? (
            <div className="rounded-xl border border-gold-200 bg-gold-100/40 px-5 py-4">
              <p className="text-sm font-semibold text-ink">No active subscription</p>
              <p className="mt-1 text-sm text-ink-soft">
                You need an active subscription to upload media for this listing.
              </p>
              <Link to="/seller/subscription">
                <Button size="sm" className="mt-3">Go to Subscription</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-ink-soft">
                  Plan: {activeSubscriptionForListing.plan?.name ?? "—"}
                </span>
                {mediaLimit !== null && (
                  <span className={`text-xs font-medium ${canUploadPhoto ? "text-ink-soft" : "text-danger"}`}>
                    Photos: {currentPhotoCount} / {mediaLimit}
                  </span>
                )}
                {!canUploadPhoto && (
                  <span className="text-xs text-danger">Limit reached</span>
                )}
              </div>

              {uploadSuccess && (
                <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-5 py-4">
                  <p className="text-sm font-semibold text-brand-600">Media uploaded successfully!</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    Your media is pending review. It will be visible once approved by an administrator.
                  </p>
                  <Button size="sm" className="mt-3" onClick={() => { setShowUpload(false); setUploadSuccess(false); }}>
                    Done
                  </Button>
                </div>
              )}

              {!uploadSuccess && (
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-brand-600">Media Type</label>
                    <div className="flex gap-3">
                      <label className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 cursor-pointer transition-colors ${mediaType === "PHOTO" ? "border-brand-500 bg-brand-50" : "border-border bg-white"}`}>
                        <input
                          type="radio"
                          name="media_type"
                          value="PHOTO"
                          checked={mediaType === "PHOTO"}
                          onChange={(e) => { setMediaType(e.target.value); setUploadError(""); }}
                          className="accent-brand-600"
                        />
                        <span className="text-sm font-medium text-ink">Photo</span>
                      </label>
                      <label className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 cursor-pointer transition-colors ${mediaType === "VIDEO" ? "border-brand-500 bg-brand-50" : "border-border bg-white"}`}>
                        <input
                          type="radio"
                          name="media_type"
                          value="VIDEO"
                          checked={mediaType === "VIDEO"}
                          onChange={(e) => { setMediaType(e.target.value); setUploadError(""); }}
                          className="accent-brand-600"
                        />
                        <span className="text-sm font-medium text-ink">Video URL</span>
                      </label>
                    </div>
                  </div>

                  {mediaType === "PHOTO" ? (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-brand-600">Photo File *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading || !canUploadPhoto}
                        className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink disabled:opacity-60"
                      />
                      {photoFile && (
                        <p className="text-xs text-ink-soft">Selected: {photoFile.name} ({(photoFile.size / 1024).toFixed(1)} KB)</p>
                      )}
                      {!canUploadPhoto && (
                        <p className="text-xs text-danger">You have reached the maximum number of photos allowed by your plan.</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-brand-600">Video URL *</label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => { setVideoUrl(e.target.value); setUploadError(""); }}
                        placeholder="https://www.youtube.com/watch?v=..."
                        disabled={uploading}
                        className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 disabled:opacity-60"
                      />
                      <p className="text-xs text-ink-soft">Paste a link to your video (YouTube, Vimeo, etc.)</p>
                    </div>
                  )}

                  {uploadError && <p className="text-sm text-danger">{uploadError}</p>}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      loading={uploading}
                      disabled={!canUploadPhoto && mediaType === "PHOTO"}
                    >
                      {uploading ? "Uploading…" : "Upload"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => { setShowUpload(false); setUploadError(""); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {!showUpload && selectedListingId && !mediaLoading && !mediaError && (
        <Button size="sm" onClick={() => setShowUpload(true)} className="mb-2">
          <span aria-hidden="true">➕</span> Upload Media
        </Button>
      )}

      {mediaLoading ? (
        <LoadingSpinner centered label="Loading media…" />
      ) : mediaError ? (
        <p className="text-sm text-danger">{mediaError}</p>
      ) : !selectedListingId ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-ink-soft">Select a listing to view its media.</p>
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
          <p className="text-sm text-ink-soft">No media uploaded for this listing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {mediaItems.map((item) => {
            const badge = badgeFor(item.status, MEDIA_STATUS_BADGE);
            const src = item.file_path || item.video_url;
            return (
              <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                {src ? (
                  item.media_type === "VIDEO" ? (
                    <video src={src} className="h-40 w-full object-cover" />
                  ) : (
                    <img src={src} alt="" className="h-40 w-full object-cover" />
                  )
                ) : (
                  <div className="flex h-40 w-full items-center justify-center text-ink-soft">No preview</div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-ink-soft">{item.media_type}</span>
                  </div>
                  {item.status === "REJECTED" && item.rejection_reason && (
                    <p className="mt-2 text-xs text-danger">{item.rejection_reason}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Messages / Inquiries Section                                        */
/* ------------------------------------------------------------------ */

function MessagesSection() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingReadId, setMarkingReadId] = useState(null);

  const qc = useQueryClient();

  async function loadInquiries() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/inquiries/", { params: { role: "seller" } });
      const arr = Array.isArray(data) ? data : data.results ?? [];
      setInquiries(arr);
    } catch {
      setError("Couldn't load inquiries.");
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(inquiryId) {
    setMarkingReadId(inquiryId);
    try {
      await api.post(`/inquiries/${inquiryId}/read/`);
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === inquiryId ? { ...item, is_read: true } : item
        )
      );
    } catch {
      // keep previous state on failure
    } finally {
      setMarkingReadId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">Messages</h3>
        <Button size="sm" variant="secondary" onClick={loadInquiries}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner centered label="Loading messages…" />
      ) : error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
          <Button size="sm" className="mt-3" onClick={loadInquiries}>
            Retry
          </Button>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-ink">No inquiries yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            When buyers message you about your listings, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => {
            const isUnread = !inquiry.is_read;
            return (
              <div
                key={inquiry.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isUnread
                    ? "border-brand-200 bg-brand-50"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {inquiry.buyer_email || `Buyer #${inquiry.buyer}`}
                      </span>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-brand-500" title="Unread" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      About: <span className="font-medium text-ink">{inquiry.listing_name}</span>
                    </p>
                    <p className="mt-2 text-sm text-ink">{inquiry.message}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {new Date(inquiry.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={markingReadId === inquiry.id}
                        onClick={() => handleMarkRead(inquiry.id)}
                      >
                        Mark read
                      </Button>
                    )}
                    <Link to={`/messages?inquiry=${inquiry.id}`}>
                      <Button size="sm" variant="ghost">
                        Reply
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notifications Section                                              */
/* ------------------------------------------------------------------ */

function NotificationsSection() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingReadId, setMarkingReadId] = useState(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const qc = useQueryClient();

  async function loadNotifications() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/notifications/");
      const arr = Array.isArray(data) ? data : data.results ?? [];
      setNotifications(arr);
    } catch {
      setError("Couldn't load notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notificationId) {
    setMarkingReadId(notificationId);
    try {
      await api.post(`/notifications/${notificationId}/read/`);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item
        )
      );
    } catch {
      // keep previous state on failure
    } finally {
      setMarkingReadId(null);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAllRead(true);
    try {
      await api.post("/notifications/read-all/");
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch {
      setError("Couldn't mark all as read.");
    } finally {
      setMarkingAllRead(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">Notifications</h3>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              loading={markingAllRead}
              onClick={handleMarkAllRead}
            >
              Mark all read ({unreadCount})
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={loadNotifications}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner centered label="Loading notifications…" />
      ) : error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
          <Button size="sm" className="mt-3" onClick={loadNotifications}>
            Retry
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold text-ink">No notifications yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            You will see updates about your listings, subscriptions, and media here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const isUnread = !notification.is_read;
            return (
              <div
                key={notification.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isUnread
                    ? "border-brand-200 bg-brand-50"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isUnread ? "bg-brand-100 text-brand-600" : "bg-surface-sunken text-ink-soft"}`}>
                        {notification.type.replace(/_/g, " ")}
                      </span>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-brand-500" title="Unread" />
                      )}
                    </div>
                    <p className="mt-2 text-sm text-ink">{notification.message}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {new Date(notification.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={markingReadId === notification.id}
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard shell                                               */
/* ------------------------------------------------------------------ */

export default function SellerDashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (activeTab === "add") {
      startCreate();
    }
  }, [activeTab]);

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
          <aside className={`fixed inset-0 z-50 md:static md:block md:w-64 ${sidebarOpen ? "" : "hidden md:block"}`}>
            {sidebarOpen && (
              <div className="absolute inset-0 bg-ink/40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}
            <div className={`relative md:relative  shrink-0 rounded-xl border border-border bg-surface p-4 ${sidebarOpen ? "absolute left-4 top-4 md:static" : ""}`}>
              <div className="hidden md:block mb-4">
                <h2 className="font-display text-lg font-semibold text-ink">Seller Dashboard</h2>
                <p className="text-xs text-ink-soft">{user?.first_name || "Seller"}</p>
              </div>
              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === item.path
                        ? "bg-brand-50 text-brand-600"
                        : "text-ink-soft hover:bg-surface-muted hover:text-ink"
                    }`}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === "overview" ? (
              <div className="hidden md:flex mb-6 items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-ink">Seller Dashboard</h1>
                  <p className="text-sm text-ink-soft">
                    Welcome back, {user?.first_name || "seller"}. Here is how your listings are doing.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("subscription")}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-surface-sunken"
                  >
                    <span aria-hidden="true">📋</span>
                    Subscription Status
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("add")}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    <span aria-hidden="true">+</span>
                    Add Listing
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden md:block mb-6">
                <h1 className="font-display text-2xl font-semibold text-ink">
                  {activeTab === "listings"
                    ? "My Listings"
                    : activeTab === "add"
                      ? "New Listing"
                      : activeTab === "subscription"
                        ? "Subscription"
                        : activeTab === "media"
                          ? "Media"
                          : activeTab === "messages"
                            ? "Messages"
                            : "Notifications"}
                </h1>
                <p className="text-sm text-ink-soft">Welcome back, {user?.first_name || "seller"}.</p>
              </div>
            )}

            {activeTab === "overview" && (
              <OverviewSection onNavigate={setActiveTab} />
            )}

            {activeTab === "listings" && (
              <ListingsSection onNavigate={setActiveTab} />
            )}

            {activeTab === "add" && (
              <ListingsSection onNavigate={setActiveTab} />
            )}

            {activeTab === "subscription" && (
              <SubscriptionSection />
            )}

            {activeTab === "media" && (
              <MediaSection />
            )}

            {activeTab === "messages" && (
              <MessagesSection />
            )}

            {activeTab === "notifications" && (
              <NotificationsSection />
            )}
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