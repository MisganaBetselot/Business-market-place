import { Link, useRouteError } from "react-router-dom";
import { Compass, Home, SearchX } from "lucide-react";
import Button from "../../components/common/Button";
import Logo from "../../components/layout/Logo";

/**
 * Used two ways:
 *  - as the router's errorElement, for both real render errors and
 *    unmatched routes (React Router can't tell them apart here, so we
 *    keep the copy generic rather than guessing which one happened).
 *  - directly, if a page wants to render a 404 itself.
 */
export default function NotFound() {
  const error = useRouteError?.();
  const isRealError = Boolean(error) && error?.status !== 404;

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-100 opacity-50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-gold-100 opacity-50 blur-3xl"
        style={{ animationDelay: "3s" }}
      />

      <div className="relative w-full max-w-md animate-fade-up text-center">
        <Link to="/" className="mb-8 inline-block">
          <Logo />
        </Link>

        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {isRealError ? <Compass className="h-7 w-7" strokeWidth={1.75} /> : <SearchX className="h-7 w-7" strokeWidth={1.75} />}
        </span>

        <h1 className="mt-5 font-display text-2xl font-semibold text-ink sm:text-3xl">
          {isRealError ? "Something went wrong" : "Page not found"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {isRealError
            ? "That wasn't supposed to happen. Try heading back home."
            : "That page doesn't exist, or isn't live yet."}
        </p>

        <Link to="/" className="mt-8 inline-block">
          <Button>
            <Home className="h-4 w-4" strokeWidth={1.75} />
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
