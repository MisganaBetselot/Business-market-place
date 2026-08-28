import { useState } from "react";
import Button from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { getCategories } from "../../api/categories";
import { mockCategories as staticCategories } from "../../data/mockData";
import { mockSellerListings } from "../../data/mockData";

export default function SellerProducts() {
  const [listings, setListings] = useState(mockSellerListings);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    location: "",
    condition: "",
    description: "",
    contact: "",
  });

  useState(() => {
    getCategories().then(setCategories).catch(() => setCategories(staticCategories));
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const newListing = {
      id: Date.now(),
      title: form.title,
      price: Number(form.price),
      status: "Active",
      views: 0,
      date: new Date().toISOString().split("T")[0],
      image: "",
      categoryId: Number(form.category),
      seller: "You",
    };
    setListings([newListing, ...listings]);
    setForm({ title: "", price: "", category: "", location: "", condition: "", description: "", contact: "" });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setListings(listings.filter((l) => l.id !== id));
  };

  const handleMarkSold = (id) => {
    setListings(listings.map((l) => (l.id === id ? { ...l, status: "Sold" } : l)));
  };

  if (showForm) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Add New Listing</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-ink-soft">Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="mt-1.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-ink-soft">Price (ETB)</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                  className="mt-1.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="mt-1.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                >
                  <option value="">Select category</option>
                  {(categories.length ? categories : staticCategories).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-ink-soft">Location</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="mt-1.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-soft">Condition</label>
                <select
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className="mt-1.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                >
                  <option value="">Select condition</option>
                  <option value="New">New</option>
                  <option value="Used - Excellent">Used - Excellent</option>
                  <option value="Used - Good">Used - Good</option>
                  <option value="Used - Fair">Used - Fair</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-soft">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="mt-1.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-soft">Contact</label>
              <input
                type="text"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                className="mt-1.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Create Listing</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">My Listings</h1>
          <p className="mt-1 text-sm text-ink-soft">{listings.length} total</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add Listing</Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-soft">
              <th className="p-4 font-medium">Image</th>
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Views</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                <td className="p-4">
                  <img src={listing.image} alt={listing.title} className="h-12 w-12 rounded-lg object-cover" />
                </td>
                <td className="p-4 font-medium text-ink">{listing.title}</td>
                <td className="p-4 text-ink-soft">{listing.price.toLocaleString()} ETB</td>
                <td className="p-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${listing.status === "Active" ? "bg-green-50 text-success" : "bg-brand-50 text-brand-600"}`}>
                    {listing.status}
                  </span>
                </td>
                <td className="p-4 text-ink-soft">{listing.views}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="text-xs font-medium text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => handleMarkSold(listing.id)} className="text-xs font-medium text-ink-soft hover:text-ink">
                      Mark Sold
                    </button>
                    <button onClick={() => handleDelete(listing.id)} className="text-xs font-medium text-danger hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-3">
        {listings.map((listing) => (
          <Card key={listing.id} className="p-4">
            <div className="flex gap-3">
              <img src={listing.image} alt={listing.title} className="h-16 w-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-ink line-clamp-1">{listing.title}</h3>
                <p className="text-sm font-semibold text-brand-600">{listing.price.toLocaleString()} ETB</p>
                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium mt-1 ${listing.status === "Active" ? "bg-green-50 text-success" : "bg-brand-50 text-brand-600"}`}>
                  {listing.status}
                </span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="text-xs font-medium text-brand-600 hover:underline">Edit</button>
              <button onClick={() => handleMarkSold(listing.id)} className="text-xs font-medium text-ink-soft hover:text-ink">
                Mark Sold
              </button>
              <button onClick={() => handleDelete(listing.id)} className="text-xs font-medium text-danger hover:underline">
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="mt-8 text-center text-sm text-ink-soft">
          You haven't created any listings yet.
        </div>
      )}
    </div>
  );
}
