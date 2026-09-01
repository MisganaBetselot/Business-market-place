import { Card } from "../components/common/Card";

// Owned by Dre (landing & search). Stubbed here only so the shared layout
// and routing have a landing page to render during Week 1 build.
export default function Home() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Browse businesses</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Listings and search UI go here (Dev B's module).
      </p>
      <Card className="mt-6 text-sm text-ink-soft">Listings grid placeholder.</Card>
    </div>
  );
}
