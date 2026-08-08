import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminSection } from "@/lib/admin/access";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Panel, TABLE_HEAD_CLASS, TableShell } from "@/components/admin/Panel";
import { Stat, StatStrip } from "@/components/admin/StatStrip";
import { DistributionBars } from "@/components/admin/FunnelChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateShort, formatNumber, formatPercent } from "@/components/admin/format";

const SUPPRESSION_REASONS = ["NO_CONSENT", "USER_RESTRICTED", "USER_SUSPENDED", "FREQUENCY_LIMIT", "QUIET_HOURS"];

const SUPPRESSION_LABEL: Record<string, string> = {
  NO_CONSENT: "Sem consentimento",
  USER_RESTRICTED: "Conta restrita",
  USER_SUSPENDED: "Conta suspensa",
  FREQUENCY_LIMIT: "Limite de frequência",
  QUIET_HOURS: "Fora do horário permitido",
};

const CATEGORY_LABEL: Record<string, string> = {
  transactional: "Transacional",
  content: "Conteúdo",
  community: "Comunidade",
  promotional: "Promocional",
};

const DELIVERED_STATUSES = ["sent", "delivered", "opened", "clicked"];
const OPENED_STATUSES = ["opened", "clicked"];

export default async function CommunicationsDashboardPage() {
  await requireAdminSection("relatorios");
  const admin = createAdminSupabaseClient();

  const [{ data: deliveries }, { data: campaigns }] = await Promise.all([
    admin.from("push_deliveries").select("push_campaign_id, status, failure_reason"),
    admin
      .from("push_campaigns")
      .select("id, internal_name, category, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const rows = deliveries ?? [];
  const suppressed = rows.filter((row) => row.failure_reason && SUPPRESSION_REASONS.includes(row.failure_reason));
  // Conjunto por referência de linha: uma entrega suprimida também tem
  // status "failed", e contá-la nos dois lugares inflaria as falhas
  // técnicas com bloqueios que funcionaram como deveriam.
  const suppressedSet = new Set(suppressed);

  const totals = {
    total: rows.length,
    suppressed: suppressed.length,
    sent: rows.filter((row) => DELIVERED_STATUSES.includes(row.status)).length,
    opened: rows.filter((row) => OPENED_STATUSES.includes(row.status)).length,
    clicked: rows.filter((row) => row.status === "clicked").length,
    failed: rows.filter((row) => row.status === "failed" && !suppressedSet.has(row)).length,
  };

  const byCampaignId = new Map<string, { total: number; sent: number; opened: number; clicked: number; suppressed: number }>();
  for (const row of rows) {
    if (!row.push_campaign_id) continue;
    const entry = byCampaignId.get(row.push_campaign_id) ?? { total: 0, sent: 0, opened: 0, clicked: 0, suppressed: 0 };
    entry.total += 1;
    if (DELIVERED_STATUSES.includes(row.status)) entry.sent += 1;
    if (OPENED_STATUSES.includes(row.status)) entry.opened += 1;
    if (row.status === "clicked") entry.clicked += 1;
    if (row.failure_reason && SUPPRESSION_REASONS.includes(row.failure_reason)) entry.suppressed += 1;
    byCampaignId.set(row.push_campaign_id, entry);
  }

  const suppressionByReason = new Map<string, number>();
  for (const row of suppressed) {
    if (!row.failure_reason) continue;
    suppressionByReason.set(row.failure_reason, (suppressionByReason.get(row.failure_reason) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="Visão geral"
        title="Comunicações"
        description="Entregas de push por status e por campanha. Supressão não é falha: é o motor de elegibilidade impedindo um envio que não deveria acontecer."
      />

      <StatStrip>
        <Stat label="Destinatários" value={totals.total} />
        <Stat label="Enviados" value={totals.sent} hint={formatPercent(totals.sent, totals.total, 0)} />
        <Stat label="Abertos" value={totals.opened} hint={`${formatPercent(totals.opened, totals.sent, 1)} dos enviados`} />
        <Stat
          label="Clicados"
          value={totals.clicked}
          hint={`${formatPercent(totals.clicked, totals.opened, 1)} dos abertos`}
          tone="accent"
        />
        <Stat label="Falhas técnicas" value={totals.failed} />
        <Stat label="Suprimidos" value={totals.suppressed} hint="bloqueio por regra" />
      </StatStrip>

      <div className="grid gap-4 xl:grid-cols-3">
        {suppressionByReason.size > 0 && (
          <Panel title="Por que deixamos de enviar" description="Motivos registrados pelo motor de elegibilidade.">
            <DistributionBars
              items={[...suppressionByReason.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => ({
                  label: SUPPRESSION_LABEL[reason] ?? reason,
                  value: count,
                  barClass: reason === "QUIET_HOURS" || reason === "FREQUENCY_LIMIT" ? "bg-chart-away" : "bg-error/70",
                }))}
            />
          </Panel>
        )}

        <Panel
          className={suppressionByReason.size > 0 ? "xl:col-span-2" : "xl:col-span-3"}
          title="Desempenho por campanha"
          bodyClassName=""
        >
          {!campaigns || campaigns.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Nenhuma campanha criada" description="Crie uma campanha na tela de Push." />
            </div>
          ) : (
            <TableShell minWidth={720}>
              <thead className={TABLE_HEAD_CLASS}>
                <tr>
                  <th scope="col" className="px-4 py-2.5">
                    Campanha
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Categoria
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Enviados
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Abertura
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Cliques
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Suprimidos
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Criada em
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const stats = byCampaignId.get(campaign.id);
                  return (
                    <tr key={campaign.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-2 text-[13px] font-medium text-strong">{campaign.internal_name}</td>
                      <td className="px-4 py-2 text-xs text-secondary">
                        {CATEGORY_LABEL[campaign.category] ?? campaign.category}
                      </td>
                      <td className="px-4 py-2 text-right text-[13px] tabular-nums text-body">
                        {formatNumber(stats?.sent ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-[13px] tabular-nums text-white">
                        {formatPercent(stats?.opened ?? 0, stats?.sent ?? 0, 0)}
                      </td>
                      <td className="px-4 py-2 text-right text-[13px] tabular-nums text-body">
                        {formatNumber(stats?.clicked ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-right text-[13px] tabular-nums text-muted">
                        {formatNumber(stats?.suppressed ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs tabular-nums text-muted">
                        {formatDateShort(campaign.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
          )}
        </Panel>
      </div>
    </div>
  );
}
