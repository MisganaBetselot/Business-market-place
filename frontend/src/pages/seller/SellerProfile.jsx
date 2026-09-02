import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { Card, Badge } from "../../components/common/Card";

export default function SellerProfile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState(() => ({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
  }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateProfile(form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't save your changes — try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-display text-2xl font-semibold">Seller profile</h1>
        <Badge tone={user.is_admin ? "success" : "neutral"}>
          {user.is_admin ? "Admin" : "User"}
        </Badge>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="First name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
          />
          <Input
            label="Last name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
          />
          <Input label="Email" value={user.email} disabled />
          <Input
            label="Phone (optional)"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-2 flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && <span className="text-sm text-success">Saved.</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
