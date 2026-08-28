import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { Card, Badge } from "../../components/common/Card";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    phone_contact: "",
    whatsapp_contact: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        bio: user.profile?.bio || "",
        phone_contact: user.profile?.phone_contact || "",
        whatsapp_contact: user.profile?.whatsapp_contact || "",
      });
    }
  }, [user]);

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
        <h1 className="font-display text-2xl font-semibold">Your profile</h1>
        <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>
          {user.status}
        </Badge>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
          />
          <Input label="Email" value={user.email} disabled />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Bio</label>
            <textarea
              name="bio"
              rows={3}
              value={form.bio}
              onChange={handleChange}
              className="rounded-lg border border-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
              placeholder="Tell buyers or sellers a bit about you"
            />
          </div>
          <Input
            label="Phone contact (optional)"
            name="phone_contact"
            value={form.phone_contact}
            onChange={handleChange}
          />
          <Input
            label="WhatsApp contact (optional)"
            name="whatsapp_contact"
            value={form.whatsapp_contact}
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
