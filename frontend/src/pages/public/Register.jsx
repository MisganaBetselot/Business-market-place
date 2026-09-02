import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import GoogleButton from "../../components/common/GoogleButton";
import AuthLayout from "../../components/layout/AuthLayout";

const passwordRules = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One symbol (!@#$...)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const failedRules = passwordRules.filter((rule) => !rule.test(form.password));
  const passwordsMatch = form.confirmPassword.length === 0 || form.password === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (failedRules.length > 0) {
      setError("Your password doesn't meet all the requirements below yet.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Couldn't create your account, check the details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle="One account for browsing, buying, and selling."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            required
          />
          <Input
            label="Last name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            required
          />
        </div>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Phone (optional)"
          name="phone"
          value={form.phone}
          onChange={handleChange}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          onFocus={() => setPasswordFocused(true)}
          required
        />

        {(passwordFocused || form.password) && (
          <ul className="-mt-2 flex flex-col gap-1 rounded-lg bg-surface-sunken p-3 animate-fade-in">
            {passwordRules.map((rule) => {
              const passed = rule.test(form.password);
              return (
                <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${passed ? "text-brand-600" : "text-ink-soft"}`}>
                  {passed ? (
                    <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  )}
                  {rule.label}
                </li>
              );
            })}
          </ul>
        )}

        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={!passwordsMatch ? "Passwords don't match." : undefined}
          required
        />

        {error && <p className="text-sm text-danger animate-fade-in">{error}</p>}

        <Button type="submit" loading={submitting} className="mt-2 w-full">
          {submitting ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-ink-soft">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton
        label="Sign up with Google"
        onSuccess={() => navigate("/", { replace: true })}
      />

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
