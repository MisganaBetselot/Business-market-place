import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import GoogleButton from "../../components/common/GoogleButton";
import AuthLayout from "../../components/layout/AuthLayout";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Couldn't log you in, check your email and password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in"
      subtitle="Pick up where you left off."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <div className="flex justify-end">
          <Link to="/reset-password" className="text-xs font-medium text-brand-600 hover:underline">
            Forgot your password?
          </Link>
        </div>

        {error && <p className="text-sm text-danger animate-fade-in">{error}</p>}

        <Button type="submit" loading={submitting} className="mt-2 w-full">
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-ink-soft">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton
        onSuccess={() => {
          const redirectTo = location.state?.from?.pathname || "/";
          navigate(redirectTo, { replace: true });
        }}
      />

      <p className="mt-6 text-center text-sm text-ink-soft">
        Don't have an account?{" "}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
