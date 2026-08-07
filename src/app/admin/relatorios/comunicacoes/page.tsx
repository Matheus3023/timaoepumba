import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminSection } from "@/lib/admin/access";

const SUPPRESSION_REASONS = ["NO_CONSENT", "USER_RESTRICTED", "USER_SUSPENDED", "FREQUENCY_LIMIT", "QUIET_HOURS"];

export default async function CommunicationsDashboardPage() {
  await requireAdminSection("relatorios");
  const admin = createAdminSupabaseClient();

  const [{ data: deliveries }, { data: campaigns }] = await Promise.all([
    admin.from("push_deliveries").select("push_campaign_id, status, failure_reason"),
    admin.from("push_campaigns").select("id, internal_name, category, status, created_at").order("created_at", { ascending: false }),
  ]);

  const rows = deliveries ?? [];
  const suppressed = rows.filter((d) => d.failure_reason && SUPPRESSION_REASONS.includes(d.failure_reason));
  const totals = {
    total: rows.length,
    suppressed: suppressed.length,
    sent: rows.filter((d) => ["sent", "delivered", "opened", "clicked"].includes(d.status)).length,
    opened: rows.filter((d) => ["opened", "clicked"].includes(d.status)).length,
    clicked: rows.filter((d) => d.status === "clicked").length,
    failed: rows.filter((d) => d.status === "failed" && !suppressed.includes(d)).length,
  };

  const byCampaignId = new Map<string, { total: number; sent: number; opened: number; clicked: number; suppressed: number }>();
  for (const d of rows) {
    if (!d.push_campaign_id) continue;
    const entry = byCampaignId.get(d.push_campaign_id) ?? { total: 0, sent: 0, opened: 0, clicked: 0, suppressed: 0 };
    entry.total += 1;
    if (["sent", "delivered", "opened", "clicked"].includes(d.status)) entry.sent += 1;
    if (["opened", "clicked"].includes(d.status)) entry.opened += 1;
    if (d.status === "clicked") entry.clicked += 1;
    if (d.failure_reason && SUPPRESSION_REASONS.includes(d.failure_reason)) entry.suppressed += 1;
    byCampaignId.set(d.push_campaign_id, entry);
  }

  const suppressionByReason = new Map<string, number>();
  for (const d of suppressed) {
    if (!d.failure_reason) continue;
    suppressionByReason.set(d.failure_reason, (suppressionByReason.get(d.failure_reason) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Comunicacoes</h1>
      <p className="text-sm text-secondary">Envios de push, por status e por campanha (PRD sec. 28).</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Total" value={totals.total} />
        <Metric label="Enviados" value={totals.sent} />
        <Metric label="Abertos" value={totals.opened} />
        <Metric label="Clicados" value={totals.clicked} />
        <Metric label="Falhas" value={totals.failed} />
        <Metric label="Suprimidos" value={totals.suppressed} />
      </div>

      {suppressionByReason.size > 0 && (
        <section className="card mt-6">
          <h2 className="text-sm font-semibold text-strong">Motivos de supressao</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            {[...suppressionByReason.entries()].map(([reason, count]) => (
              <div key={reason} className="flex items-center justify-between border-b border-surface-elevated pb-2">
                <span className="font-mono text-xs text-body">{reason}</span>
                <span className="text-muted">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card mt-6">
        <h2 className="text-sm font-semibold text-strong">Por campanha</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-1 pr-4">Campanha</th>
                <th className="py-1 pr-4">Categoria</th>
                <th className="py-1 pr-4">Enviados</th>
                <th className="py-1 pr-4">Abertos</th>
                <th className="py-1 pr-4">Clicados</th>
                <th className="py-1 pr-4">Suprimidos</th>
              </tr>
            </thead>
            <tbody>
              {campaigns?.map((c) => {
                const stats = byCampaignId.get(c.id);
                return (
                  <tr key={c.id} className="border-t border-surface-elevated">
                    <td className="py-2 pr-4 text-strong">{c.internal_name}</td>
                    <td className="py-2 pr-4 text-muted">{c.category}</td>
                    <td className="py-2 pr-4 text-body">{stats?.sent ?? 0}</td>
                    <td className="py-2 pr-4 text-body">{stats?.opened ?? 0}</td>
                    <td className="py-2 pr-4 text-body">{stats?.clicked ?? 0}</td>
                    <td className="py-2 pr-4 text-body">{stats?.suppressed ?? 0}</td>
                  </tr>
                );
              })}
              {(!campaigns || campaigns.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-muted">
                    Nenhuma campanha criada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-secondary">{label}</p>
    </div>
  );
}
