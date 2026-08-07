import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { logAudit } from "@/lib/admin/audit";
import { purgeSportsCache } from "@/lib/sports/cache";
import type { AllowedCompetitionRow } from "@/types/database";

/** Shared guard for every action on this page. */
async function requireCompetitionWrite() {
  const access = await requireAdminSection("competicoes");
  if (!canWrite(access, "competicoes")) redirect("/admin/competicoes");
  return access;
}

/**
 * Every mutation purges the sports cache: cached payloads are stored
 * already filtered by this allowlist, so without it a toggle wouldn't
 * reach users until each TTL expired.
 */
async function afterMutation() {
  await purgeSportsCache();
  revalidatePath("/admin/competicoes");
  revalidatePath("/jogos");
  revalidatePath("/home");
}

/**
 * Available even when the allowlist query failed — it's what lets an admin
 * force the app to re-fetch right after running the pending migration,
 * instead of waiting out the cache TTL.
 */
async function refreshSportsData() {
  "use server";
  const access = await requireCompetitionWrite();
  await purgeSportsCache();
  await logAudit({ actorId: access.adminId, action: "sports_cache_purged" });
  revalidatePath("/admin/competicoes");
  revalidatePath("/jogos");
  revalidatePath("/home");
}

async function setActive(id: string, active: boolean) {
  "use server";
  const access = await requireCompetitionWrite();
  const admin = createAdminSupabaseClient();

  await admin
    .from("allowed_competitions")
    .update({ is_active: active, requires_manual_review: false })
    .eq("id", id);

  await logAudit({
    actorId: access.adminId,
    action: active ? "competition_activated" : "competition_deactivated",
    entityType: "allowed_competition",
    entityId: id,
  });
  await afterMutation();
}

async function updateCompetition(id: string, formData: FormData) {
  "use server";
  const access = await requireCompetitionWrite();
  const admin = createAdminSupabaseClient();

  const displayName = String(formData.get("display_name") ?? "").trim();
  const priority = Number(formData.get("priority") ?? 3);

  await admin
    .from("allowed_competitions")
    .update({
      display_name: displayName || null,
      priority: Number.isFinite(priority) ? Math.min(Math.max(priority, 1), 3) : 3,
      show_on_home: formData.get("show_on_home") === "on",
      show_live: formData.get("show_live") === "on",
      notifications_enabled: formData.get("notifications_enabled") === "on",
    })
    .eq("id", id);

  await logAudit({
    actorId: access.adminId,
    action: "competition_updated",
    entityType: "allowed_competition",
    entityId: id,
  });
  await afterMutation();
}

const GENDER_LABEL: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  unknown: "Nao identificado",
};

export default async function AdminCompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const access = await requireAdminSection("competicoes");
  const writable = canWrite(access, "competicoes");

  const admin = createAdminSupabaseClient();
  const { data: competitions, error } = await admin
    .from("allowed_competitions")
    .select("*")
    .order("priority")
    .order("canonical_name");

  const query = (q ?? "").trim().toLowerCase();
  const filtered = (competitions ?? []).filter((c) =>
    query
      ? c.canonical_name.toLowerCase().includes(query) ||
        c.provider_name.toLowerCase().includes(query) ||
        c.provider_competition_id.toLowerCase().includes(query)
      : true
  );

  const pending = filtered.filter((c) => c.requires_manual_review);
  const active = filtered.filter((c) => c.is_active && !c.requires_manual_review);
  const blocked = filtered.filter((c) => !c.is_active && !c.requires_manual_review);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-white">Competicoes permitidas</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Somente competicoes ativas aparecem no aplicativo. A lista se preenche sozinha conforme a API
        e consultada — competicoes novas entram bloqueadas, aguardando sua liberacao.
      </p>
      {!writable && <p className="mt-1 text-xs text-neutral-500">Modo somente leitura para o seu perfil.</p>}

      {error && (
        <div className="card mt-4 border-yellow-400/30 bg-yellow-400/5">
          <p className="text-sm font-semibold text-yellow-300">Modo de emergencia ativo</p>
          <p className="mt-1 text-sm text-neutral-300">
            Nao consegui ler a tabela de competicoes, entao o aplicativo esta usando o filtro antigo (por
            nome) para continuar mostrando os jogos normalmente. A curadoria desta tela so funciona depois
            que a migration <span className="font-mono">0009_allowed_competitions.sql</span> for executada no
            SQL Editor do Supabase.
          </p>
          <p className="mt-2 font-mono text-xs text-neutral-500">{error.message}</p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <form className="flex flex-1 gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome ou ID da competicao"
            className="input flex-1"
          />
          <button type="submit" className="btn-secondary px-4">
            Buscar
          </button>
        </form>

        {writable && (
          <form action={refreshSportsData}>
            <button type="submit" className="btn-secondary whitespace-nowrap px-4" title="Limpa o cache de jogos">
              Atualizar dados
            </button>
          </form>
        )}
      </div>

      {!error && (competitions ?? []).length === 0 && (
        <p className="card mt-4 text-sm text-neutral-500">
          Nenhuma competicao catalogada ainda. Abra a tela de Jogos para o app consultar a API — as
          competicoes encontradas aparecem aqui.
        </p>
      )}

      <Section
        title={`Pendentes de revisao (${pending.length})`}
        description="Competicoes novas que a API trouxe e o app ainda nao mostra. Ative as que fizerem sentido."
        competitions={pending}
        writable={writable}
      />
      <Section
        title={`Ativas (${active.length})`}
        description="Aparecem no aplicativo agora."
        competitions={active}
        writable={writable}
      />
      <Section
        title={`Bloqueadas (${blocked.length})`}
        description="Nao aparecem no aplicativo. Femininas, base, reservas e virtuais sao bloqueadas automaticamente."
        competitions={blocked}
        writable={writable}
      />
    </div>
  );
}

function Section({
  title,
  description,
  competitions,
  writable,
}: {
  title: string;
  description: string;
  competitions: AllowedCompetitionRow[];
  writable: boolean;
}) {
  if (competitions.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-neutral-200">{title}</h2>
      <p className="mb-2 text-xs text-neutral-500">{description}</p>

      <div className="flex flex-col gap-2">
        {competitions.map((competition) => (
          <div key={competition.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-white">
                  {competition.display_name || competition.canonical_name}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {competition.provider_name}
                  {competition.country_name ? ` • ${competition.country_name}` : ""}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="badge bg-neutral-800 font-mono text-[10px] text-neutral-400">
                    ID {competition.provider_competition_id}
                  </span>
                  <span className="badge bg-neutral-800 text-[10px] text-neutral-400">
                    {GENDER_LABEL[competition.gender] ?? competition.gender}
                  </span>
                  <span className="badge bg-neutral-800 text-[10px] text-neutral-400">
                    Prioridade {competition.priority}
                  </span>
                  {competition.blocked_reason && (
                    <span className="badge bg-red-500/15 text-[10px] text-red-300">
                      {competition.blocked_reason}
                    </span>
                  )}
                </p>
              </div>

              {writable && (
                <form action={setActive.bind(null, competition.id, !competition.is_active)}>
                  <button
                    type="submit"
                    className={`btn-secondary shrink-0 px-3 py-1.5 text-xs ${
                      competition.is_active ? "text-red-400" : "text-emerald-300"
                    }`}
                  >
                    {competition.is_active ? "Desativar" : "Ativar"}
                  </button>
                </form>
              )}
            </div>

            {writable && (
              <form action={updateCompetition.bind(null, competition.id)} className="mt-3 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    name="display_name"
                    defaultValue={competition.display_name ?? ""}
                    placeholder="Nome exibido no app"
                    className="input flex-1 py-2 text-sm"
                  />
                  <select name="priority" defaultValue={String(competition.priority)} className="input py-2 text-sm">
                    <option value="1">Prioridade 1</option>
                    <option value="2">Prioridade 2</option>
                    <option value="3">Prioridade 3</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-neutral-300">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="show_on_home" defaultChecked={competition.show_on_home} />
                    Tela inicial
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="show_live" defaultChecked={competition.show_live} />
                    Ao vivo
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      name="notifications_enabled"
                      defaultChecked={competition.notifications_enabled}
                    />
                    Notificacoes
                  </label>
                  <button type="submit" className="btn-secondary ml-auto px-3 py-1.5 text-xs">
                    Salvar
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
