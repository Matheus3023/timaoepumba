import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminSection } from "@/lib/admin/access";

export default async function AdminDashboardPage() {
  await requireAdminSection("dashboard");
  const admin = createAdminSupabaseClient();
  const [visitors, accounts, clicks, registrations, ftds, pushSent, pushOpened] = await Promise.all([
    admin.from("acquisition_sessions").select("lead_id", { count: "exact", head: true }),
    admin.from("users").select("id", { count: "exact", head: true }),
    admin.from("affiliate_clicks").select("id", { count: "exact", head: true }),
    admin.from("registrations").select("id", { count: "exact", head: true }),
    admin.from("ftds").select("id", { count: "exact", head: true }),
    admin.from("push_deliveries").select("id", { count: "exact", head: true }).eq("status", "sent"),
    admin.from("push_deliveries").select("id", { count: "exact", head: true }).eq("status", "opened"),
  ]);

  const accountsCount = accounts.count ?? 0;
  const clicksCount = clicks.count ?? 0;
  const registrationsCount = registrations.count ?? 0;
  const ftdsCount = ftds.count ?? 0;
  const pushSentCount = pushSent.count ?? 0;
  const pushOpenedCount = pushOpened.count ?? 0;

  const pct = (part: number, total: number) => (total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "—");

  return (
    <div>
      <h1 className="text-xl font-bold text-white">Dashboard</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Visitantes" value={visitors.count ?? 0} />
        <Metric label="Contas criadas" value={accountsCount} />
        <Metric label="Cliques na casa" value={clicksCount} />
        <Metric label="Cadastros confirmados" value={registrationsCount} />
        <Metric label="FTDs" value={ftdsCount} />
        <Metric label="Pushes enviados" value={pushSentCount} />
      </div>

      <section className="card mt-6">
        <h2 className="text-sm font-semibold text-neutral-200">Funil de conversao</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <FunnelRow label="Visitantes -> Contas" value={pct(accountsCount, visitors.count ?? 0)} />
          <FunnelRow label="Contas -> Cliques na casa" value={pct(clicksCount, accountsCount)} />
          <FunnelRow label="Cliques -> Cadastros confirmados" value={pct(registrationsCount, clicksCount)} />
          <FunnelRow label="Cadastros -> FTDs" value={pct(ftdsCount, registrationsCount)} />
          <FunnelRow label="Push enviados -> abertos" value={pct(pushOpenedCount, pushSentCount)} />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-neutral-400">{label}</p>
    </div>
  );
}

function FunnelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
      <span className="text-neutral-300">{label}</span>
      <span className="font-semibold text-yellow-300">{value}</span>
    </div>
  );
}
