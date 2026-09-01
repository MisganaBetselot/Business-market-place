import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { Card, Badge } from "../../components/common/Card";

export default function Profile() {
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
      setError(err.response?.data?.detail || "Couldn't save your changes, try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 flex items-center gap-4 animate-fade-up">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 font-display text-lg font-semibold text-white shadow-sm">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold">Your profile</h1>
            <Badge tone={user.is_admin ? "success" : "neutral"}>
              {user.is_admin ? "Admin" : "User"}
            </Badge>
          </div>
          <p className="text-sm text-ink-soft">{user.email}</p>
        </div>
      </div>

      <Card className="animate-fade-up stagger-1">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
          <Input label="Email" value={user.email} disabled />
          <Input
            label="Phone (optional)"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          {error && <p className="text-sm text-danger animate-fade-in">{error}</p>}

          <div className="mt-2 flex items-center gap-3">
            <Button type="submit" loading={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && <span className="text-sm text-brand-600 animate-fade-in">Saved.</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
