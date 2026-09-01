import { Card } from "../../components/common/Card";

/**
 * Temporary placeholder for routes owned by other modules (Dre, Muni,
 * msgana) so this branch renders a complete app on its own. Delete each
 * usage as the real page lands on main — don't build these out yourself.
 */
export default function ComingSoon({ title, owner }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <Card className="mt-6 text-sm text-ink-soft">
        This is {owner}'s module — placeholder only, wired up here so routing
        and the shared layout work end to end.
      </Card>
    </div>
  );
}
