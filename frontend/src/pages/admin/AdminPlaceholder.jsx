import { Card } from "../../components/common/Card";

export default function AdminPlaceholder({ title, description }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <Card className="mt-6 text-sm text-ink-soft">
        This section is scaffolded and ready to build. Wire it up to its
        backend endpoint once available.
      </Card>
    </div>
  );
}
