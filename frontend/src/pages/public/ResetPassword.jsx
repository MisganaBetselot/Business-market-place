import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as authApi from "../../api/auth";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import AuthLayout from "../../components/layout/AuthLayout";

/**
 * Two steps in one page:
 *  1. No token in the URL  -> request a reset email (enter your email).
 *  2. ?uid=..&token=..     -> the link from that email, set a new password.
 *
 * NOTE: /auth/password-reset/ and /auth/password-reset/confirm/ are not
 * documented in the backend progress report yet, confirm the real paths
 * and payload shape with the backend dev before this goes live.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const isConfirmStep = Boolean(uid && token);

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title={isConfirmStep ? "Choose a new password" : "Reset your password"}
      subtitle={isConfirmStep ? undefined : "Enter your email and we'll send you a link to reset it."}
    >
      {isConfirmStep ? <ConfirmStep uid={uid} token={token} /> : <RequestStep />}
    </AuthLayout>
  );
}

function RequestStep() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | sent | error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      await authApi.requestPasswordReset(email);
      setStatus("sent");
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't send the reset email, try again.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="animate-fade-up">
        <p className="text-sm text-ink-soft">
          If an account exists for <strong className="text-ink">{email}</strong>, we've sent a
          link to reset your password.
        </p>
        <Link to="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {error && <p className="text-sm text-danger animate-fade-in">{error}</p>}

      <Button type="submit" loading={status === "submitting"} className="mt-2 w-full">
        {status === "submitting" ? "Sending…" : "Send reset link"}
      </Button>

      <p className="mt-2 text-center text-sm text-ink-soft">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}

function ConfirmStep({ uid, token }) {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [status, setStatus] = useState("idle"); // idle | submitting | done | error
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      await authApi.confirmPasswordReset({ uid, token, password: form.password });
      setStatus("done");
    } catch (err) {
      setError(
        err.response?.data?.detail || "That reset link may have expired, request a new one."
      );
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="animate-fade-up">
        <p className="text-sm text-ink-soft">You can now log in with your new password.</p>
        <Link to="/login" className="mt-6 inline-block">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="New password"
        type="password"
        name="password"
        autoComplete="new-password"
        value={form.password}
        onChange={handleChange}
        required
      />
      <Input
        label="Confirm new password"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        value={form.confirmPassword}
        onChange={handleChange}
        required
      />

      {error && <p className="text-sm text-danger animate-fade-in">{error}</p>}

      <Button type="submit" loading={status === "submitting"} className="mt-2 w-full">
        {status === "submitting" ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
