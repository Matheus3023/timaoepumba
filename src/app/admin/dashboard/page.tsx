import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminSection } from "@/lib/admin/access";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Panel } from "@/components/admin/Panel";
import { Stat, StatStrip } from "@/components/admin/StatStrip";
import { DistributionBars, FunnelChart } from "@/components/admin/FunnelChart";
import { PeriodTabs, resolvePeriod, type PeriodKey } from "@/components/admin/PeriodTabs";
import { formatNumber, formatPercent, percentChange } from "@/components/admin/format";
import { ACCESS_LEVEL_LABEL, ACCESS_LEVELS } from "@/components/admin/Badges";

/** Entregas que já saíram do servidor, em qualquer estágio posterior. */
const DELIVERED_STATUSES = ["sent", "delivered", "opened", "clicked"];
const OPENED_STATUSES = ["opened", "clicked"];

interface FunnelCounts {
  visits: number;
  accounts: number;
  clicks: number;
  registrations: number;
  ftds: number;
  pushSent: number;
  pushOpened: number;
  pushClicked: number;
}

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

/**
 * Contagens de uma janela de tempo. Cada etapa é filtrada pelo seu próprio
 * carimbo de data (sessão criada, conta criada, clique, cadastro confirmado,
 * depósito confirmado): é um funil de eventos ocorridos no período, não o
 * acompanhamento de uma mesma coorte ao longo do tempo — a diferença está
 * escrita na tela para ninguém ler a conversão como se fosse coorte.
 */
async function loadCounts(admin: AdminClient, start: string | null, end: string | null): Promise<FunnelCounts> {
  const visitsQuery = () => {
    let query = admin.from("acquisition_sessions").select("id", { count: "exact", head: true });
    if (start) query = query.gte("created_at", start);
    if (end) query = query.lt("created_at", end);
    return query;
  };

  const accountsQuery = () => {
    let query = admin.from("users").select("id", { count: "exact", head: true });
    if (start) query = query.gte("created_at", start);
    if (end) query = query.lt("created_at", end);
    return query;
  };

  const clicksQuery = () => {
    let query = admin.from("affiliate_clicks").select("id", { count: "exact", head: true });
    if (start) query = query.gte("clicked_at", start);
    if (end) query = query.lt("clicked_at", end);
    return query;
  };

  const registrationsQuery = () => {
    let query = admin.from("registrations").select("id", { count: "exact", head: true });
    if (start) query = query.gte("confirmed_at", start);
    if (end) query = query.lt("confirmed_at", end);
    return query;
  };

  const ftdsQuery = () => {
    let query = admin.from("ftds").select("id", { count: "exact", head: true });
    if (start) query = query.gte("confirmed_at", start);
    if (end) query = query.lt("confirmed_at", end);
    return query;
  };

  // `status` guarda o estágio mais avançado alcançado, não o histórico: uma
  // entrega aberta deixa de ter status "sent". Contar só `status = 'sent'`
  // (como o painel antigo fazia) subtraía do total justamente as entregas
  // que deram certo.
  const pushQuery = (statuses: string[]) => {
    let query = admin.from("push_deliveries").select("id", { count: "exact", head: true }).in("status", statuses);
    if (start) query = query.gte("sent_at", start);
    if (end) query = query.lt("sent_at", end);
    return query;
  };

  const [visits, accounts, clicks, registrations, ftds, pushSent, pushOpened, pushClicked] = await Promise.all([
    visitsQuery(),
    accountsQuery(),
    clicksQuery(),
    registrationsQuery(),
    ftdsQuery(),
    pushQuery(DELIVERED_STATUSES),
    pushQuery(OPENED_STATUSES),
    pushQuery(["clicked"]),
  ]);

  return {
    visits: visits.count ?? 0,
    accounts: accounts.count ?? 0,
    clicks: clicks.count ?? 0,
    registrations: registrations.count ?? 0,
    ftds: ftds.count ?? 0,
    pushSent: pushSent.count ?? 0,
    pushOpened: pushOpened.count ?? 0,
    pushClicked: pushClicked.count ?? 0,
  };
}

async function loadBaseComposition(admin: AdminClient): Promise<{ level: string; total: number }[]> {
  const results = await Promise.all(
    ACCESS_LEVELS.map((level) => admin.from("users").select("id", { count: "exact", head: true }).eq("access_level", level))
  );
  return ACCESS_LEVELS.map((level, index) => ({ level, total: results[index].count ?? 0 }));
}

const COMPOSITION_BAR_CLASS: Record<string, string> = {
  FTD_USER: "bg-chart-home",
  RESTRICTED_USER: "bg-error/70",
  ADMIN: "bg-surface-elevated",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  await requireAdminSection("dashboard");
  const admin = createAdminSupabaseClient();
  const period = resolvePeriod(periodo);

  const [current, previous, composition] = await Promise.all([
    loadCounts(admin, period.start, null),
    period.previousStart ? loadCounts(admin, period.previousStart, period.previousEnd) : Promise.resolve(null),
    loadBaseComposition(admin),
  ]);

  const delta = (key: keyof FunnelCounts): number | null | undefined =>
    previous ? percentChange(current[key], previous[key]) : undefined;

  const hint = (key: keyof FunnelCounts): string =>
    previous ? `antes ${formatNumber(previous[key])}` : "todo o período";

  const baseTotal = composition.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="Visão geral"
        title="Painel"
        description="Volume por etapa do funil no período escolhido, comparado com o período anterior de mesmo tamanho."
        actions={
          <PeriodTabs
            current={period.key}
            hrefFor={(key: PeriodKey) => (key === "30d" ? "/admin/dashboard" : `/admin/dashboard?periodo=${key}`)}
          />
        }
      />

      <StatStrip>
        <Stat label="Visitas" value={current.visits} delta={delta("visits")} hint={hint("visits")} />
        <Stat label="Contas criadas" value={current.accounts} delta={delta("accounts")} hint={hint("accounts")} />
        <Stat label="Cliques na casa" value={current.clicks} delta={delta("clicks")} hint={hint("clicks")} />
        <Stat
          label="Cadastros"
          value={current.registrations}
          delta={delta("registrations")}
          hint={hint("registrations")}
        />
        <Stat label="FTDs" value={current.ftds} delta={delta("ftds")} hint={hint("ftds")} tone="accent" />
        <Stat label="Push enviados" value={current.pushSent} delta={delta("pushSent")} hint={hint("pushSent")} />
      </StatStrip>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Funil de conversão"
          description="Cada etapa conta eventos do próprio período. A barra é a fatia sobre o topo do funil; o número à direita é a conversão contra a etapa anterior."
        >
          <FunnelChart
            steps={[
              { label: "Visitas (sessões registradas)", value: current.visits },
              { label: "Contas criadas", value: current.accounts },
              { label: "Cliques na casa parceira", value: current.clicks },
              { label: "Cadastros confirmados", value: current.registrations },
              { label: "FTDs confirmados", value: current.ftds },
            ]}
          />
          <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-muted">
            Visitas contam sessões de aquisição, não pessoas distintas: quem volta em outro dia entra de novo.
            Conversão de ponta a ponta no período:{" "}
            <span className="font-mono tabular-nums text-body">{formatPercent(current.ftds, current.visits, 2)}</span>
          </p>
        </Panel>

        <Panel
          title="Push no período"
          description="Entregas com data de envio dentro da janela."
        >
          <FunnelChart
            accent="away"
            steps={[
              { label: "Enviados", value: current.pushSent },
              { label: "Abertos", value: current.pushOpened },
              { label: "Clicados", value: current.pushClicked },
            ]}
          />
          <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-muted">
            Taxa de abertura:{" "}
            <span className="font-mono tabular-nums text-body">
              {formatPercent(current.pushOpened, current.pushSent, 1)}
            </span>
          </p>
        </Panel>
      </div>

      <Panel
        title="Composição da base"
        description={`Todos os ${formatNumber(baseTotal)} cadastros por nível de acesso, sem recorte de período.`}
      >
        <DistributionBars
          items={composition.map((item) => ({
            label: ACCESS_LEVEL_LABEL[item.level] ?? item.level,
            value: item.total,
            barClass: COMPOSITION_BAR_CLASS[item.level] ?? "bg-surface-highlighted",
          }))}
        />
      </Panel>
    </div>
  );
}
