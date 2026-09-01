import { useState } from "react";
import { loginWithGoogle } from "../../api/auth";

/**
 * NOT LIVE YET, see the big comment on loginWithGoogle in api/auth.js.
 * Clicking this currently calls a backend endpoint that doesn't exist,
 * so it will show the "couldn't sign in" error until someone:
 *   1. Sets up a real OAuth client in Google Cloud Console
 *   2. Adds a /users/google/ endpoint on the backend that verifies the
 *      Google ID token and returns { access, refresh } like login() does
 *   3. Wires up Google Identity Services here to actually get a real
 *      ID token to send, instead of the placeholder below
 */
export default function GoogleButton({ onSuccess, label = "Continue with Google" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setError("");
    setLoading(true);
    try {
      // Placeholder: real integration needs Google Identity Services
      // to produce an actual ID token here before this call can work.
      const idToken = null;
      const data = await loginWithGoogle(idToken);
      onSuccess?.(data);
    } catch {
      setError("Google sign-in isn't set up yet, use email and password for now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-border bg-white px-4 py-2.5 text-sm font-medium text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm disabled:opacity-50 disabled:translate-y-0"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.55-1.84.87-3.06.87-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.95 10.71A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.27-1.71V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.04l3-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.96l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        {label}
      </button>
      {error && <p className="text-xs text-danger animate-fade-in">{error}</p>}
    </div>
  );
}
