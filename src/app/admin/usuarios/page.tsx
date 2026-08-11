import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { sinceDaysAgo } from "@/lib/admin/period";
import { logAudit } from "@/lib/admin/audit";
import { computeAndSaveUserScore, recalculateAllScores } from "@/lib/scoring/compute";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { UsersFilters } from "@/components/admin/UsersFilters";
import { UsersTable, type UserRowView, type UsersSortColumn } from "@/components/admin/UsersTable";
import { AccessLevelBadge, ScoreBadge } from "@/components/admin/Badges";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDateShort, formatDateTime, formatRelative } from "@/components/admin/format";
import type { AccessLevel } from "@/types/database";

const PAGE_SIZE = 25;

const VALID_LEVELS = new Set<string>([
  "VISITOR",
  "APP_USER",
  "REGISTERED_USER",
  "FTD_USER",
  "RESTRICTED_USER",
  "ADMIN",
]);

const VALID_STATUS = new Set<string>(["active", "restricted", "suspended", "deleted"]);

const SIGNUP_PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

/**
 * Ordenações servidas pelo banco.
 *
 * A lista vem da view `admin_users_list` (migration 0011), que já traz o
 * `total_score` junto. Antes a consulta era em `users` e ordenar por score
 * era impossível sem trazer a base inteira para a memória — o que quebraria
 * a paginação, porque a contagem passaria a ser a da página em vez da do
 * filtro.
 *
 * `nullsFirst: false` no score: quem ainda não teve score calculado tem
 * `null`, não zero, e precisa cair no fim da lista em vez de disputar
 * posição com quem realmente pontuou baixo.
 */
const SORTS: Record<
  string,
  {
    column: "created_at" | "full_name" | "access_level" | "total_score";
    ascending: boolean;
    group: UsersSortColumn;
  }
> = {
  recentes: { column: "created_at", ascending: false, group: "cadastro" },
  antigos: { column: "created_at", ascending: true, group: "cadastro" },
  nome: { column: "full_name", ascending: true, group: "nome" },
  nome_desc: { column: "full_name", ascending: false, group: "nome" },
  nivel: { column: "access_level", ascending: true, group: "nivel" },
  nivel_desc: { column: "access_level", ascending: false, group: "nivel" },
  score: { column: "total_score", ascending: false, group: "score" },
  score_asc: { column: "total_score", ascending: true, group: "score" },
};

interface UsersSearchParams {
  q?: string;
  nivel?: string;
  situacao?: string;
  periodo?: string;
  ordem?: string;
  pagina?: string;
}

async function recalculateScores() {
  "use server";
  const access = await requireAdminSection("usuarios");
  if (!canWrite(access, "usuarios")) redirect("/admin/usuarios");
  const count = await recalculateAllScores();
  await logAudit({ actorId: access.adminId, action: "scores_recalculated", metadata: { count } });
  revalidatePath("/admin/usuarios");
}

/**
 * Ação em massa da página. Limitada aos IDs enviados pelo formulário (no
 * máximo uma página) e recalculada em série: é trabalho de escrita, não vale
 * disparar cem cálculos simultâneos contra o banco por causa de um clique.
 */
async function recalculateSelectedScores(formData: FormData) {
  "use server";
  const access = await requireAdminSection("usuarios");
  if (!canWrite(access, "usuarios")) redirect("/admin/usuarios");

  const ids = formData.getAll("user_ids").map(String).filter(Boolean).slice(0, PAGE_SIZE);
  for (const id of ids) {
    await computeAndSaveUserScore(id);
  }

  await logAudit({
    actorId: access.adminId,
    action: "scores_recalculated_bulk",
    entityType: "user",
    metadata: { count: ids.length },
  });
  revalidatePath("/admin/usuarios");
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<UsersSearchParams> }) {
  const params = await searchParams;
  const access = await requireAdminSection("usuarios");
  const writable = canWrite(access, "usuarios");
  const admin = createAdminSupabaseClient();

  // A busca vai para dentro de um filtro `or` do PostgREST, onde vírgula e
  // parênteses são separadores de sintaxe e `*` é curinga. Removê-los aqui
  // impede que um termo digitado altere a estrutura do filtro.
  const rawQuery = (params.q ?? "").trim().slice(0, 80);
  const searchTerm = rawQuery.replace(/[,()*%\\"']/g, " ").replace(/\s+/g, " ").trim();

  const levelFilter = params.nivel && VALID_LEVELS.has(params.nivel) ? params.nivel : "";
  const statusFilter = params.situacao && VALID_STATUS.has(params.situacao) ? params.situacao : "";
  const periodFilter = params.periodo && SIGNUP_PERIOD_DAYS[params.periodo] ? params.periodo : "";
  const sortKey = params.ordem && SORTS[params.ordem] ? params.ordem : "recentes";
  const sort = SORTS[sortKey];
  const page = Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = admin
    .from("admin_users_list")
    .select("id, lead_id, full_name, email, access_level, status, created_at, total_score", {
      count: "exact",
    });

  if (searchTerm) {
    query = query.or(
      `full_name.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*,lead_id.ilike.*${searchTerm}*`
    );
  }
  if (levelFilter) query = query.eq("access_level", levelFilter as AccessLevel);
  if (statusFilter) query = query.eq("status", statusFilter);
  if (periodFilter) {
    query = query.gte("created_at", sinceDaysAgo(SIGNUP_PERIOD_DAYS[periodFilter]));
  }

  const {
    data: users,
    count,
    error,
  } = await query
    // Desempate por id: sem uma segunda chave estável, dois cadastros no
    // mesmo instante podem trocar de lugar entre uma página e outra e o
    // admin vê a mesma pessoa duas vezes (ou nenhuma).
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .order("id", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  const rows = users ?? [];
  const total = count ?? 0;
  const userIds = rows.map((user) => user.id);
  const leadIds = rows.map((user) => user.lead_id);

  // Complementos buscados só para a página visível (no máximo 25 IDs), o
  // que mantém a consulta barata e a URL do PostgREST dentro do limite.
  const [profileRows, attributionRows] = await Promise.all([
    userIds.length ? admin.from("user_profiles").select("user_id, last_seen_at").in("user_id", userIds) : null,
    leadIds.length
      ? admin
          .from("attribution_data")
          .select("lead_id, utm_source, utm_medium, utm_campaign")
          .eq("touch_type", "first")
          .in("lead_id", leadIds)
      : null,
  ]);

  const lastSeenById = new Map((profileRows?.data ?? []).map((row) => [row.user_id, row.last_seen_at]));
  const attributionByLead = new Map((attributionRows?.data ?? []).map((row) => [row.lead_id, row]));

  const tableRows: UserRowView[] = rows.map((user) => {
    const attribution = attributionByLead.get(user.lead_id);
    const lastSeen = lastSeenById.get(user.id) ?? null;
    const origin = attribution
      ? [attribution.utm_source ?? "sem UTM", attribution.utm_medium].filter(Boolean).join(" · ")
      : "—";

    return {
      id: user.id,
      name: user.full_name?.trim() || "Sem nome",
      email: user.email,
      leadId: user.lead_id,
      accessLevel: user.access_level,
      status: user.status,
      score: user.total_score,
      origin,
      originTitle: attribution?.utm_campaign ? `Campanha: ${attribution.utm_campaign}` : "Primeiro toque",
      lastSeen: lastSeen ? formatRelative(lastSeen) : "nunca",
      lastSeenTitle: formatDateTime(lastSeen),
      createdAt: formatDateShort(user.created_at),
      createdAtTitle: formatDateTime(user.created_at),
    };
  });

  const priority = await loadPriorityQueue(admin);

  function hrefWith(patch: UsersSearchParams): string {
    const next = new URLSearchParams();
    const merged: UsersSearchParams = {
      q: searchTerm || undefined,
      nivel: levelFilter || undefined,
      situacao: statusFilter || undefined,
      periodo: periodFilter || undefined,
      ordem: sortKey !== "recentes" ? sortKey : undefined,
      pagina: page > 1 ? String(page) : undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const queryString = next.toString();
    return queryString ? `/admin/usuarios?${queryString}` : "/admin/usuarios";
  }

  // Clicar de novo no mesmo cabeçalho inverte a direção; clicar em outro
  // começa pela direção mais útil daquela coluna (nome de A a Z, cadastro do
  // mais recente para o mais antigo).
  const sortHref: Record<UsersSortColumn, string> = {
    cadastro: hrefWith({ ordem: sortKey === "recentes" ? "antigos" : "recentes", pagina: undefined }),
    nome: hrefWith({ ordem: sortKey === "nome" ? "nome_desc" : "nome", pagina: undefined }),
    nivel: hrefWith({ ordem: sortKey === "nivel" ? "nivel_desc" : "nivel", pagina: undefined }),
    score: hrefWith({ ordem: sortKey === "score" ? "score_asc" : "score", pagina: undefined }),
  };

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="Pessoas"
        title="Usuários / CRM"
        description="Base completa com busca, filtro, ordenação e paginação no servidor. Cada linha leva à ficha com histórico, atribuição e tarefas."
        actions={
          writable ? (
            <form action={recalculateScores}>
              <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                Recalcular todos os scores
              </button>
            </form>
          ) : (
            <span className="badge bg-surface-elevated text-muted">Somente leitura</span>
          )
        }
      />

      {priority.length > 0 && (
        <section aria-labelledby="fila-prioridade">
          <h2
            id="fila-prioridade"
            className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-faint"
          >
            Precisa de atenção · maior score ainda sem FTD
          </h2>
          <ul className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
            {priority.map((lead) => (
              <li key={lead.id} className="shrink-0">
                <Link
                  href={`/admin/usuarios/${lead.id}`}
                  className="flex w-56 items-center justify-between gap-3 rounded-none border border-white/[0.06] bg-surface/40 px-3 py-2.5 transition-colors hover:border-white/[0.12] hover:bg-surface"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-strong">{lead.name}</span>
                    <span className="mt-1 block">
                      <AccessLevelBadge level={lead.accessLevel} short />
                    </span>
                  </span>
                  <ScoreBadge score={lead.score} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <UsersFilters
        state={{
          q: rawQuery,
          nivel: levelFilter,
          situacao: statusFilter,
          periodo: periodFilter,
          ordem: sortKey,
        }}
        total={total}
      />

      {error ? (
        <ErrorState
          title="Não foi possível carregar a base"
          description="A consulta de usuários falhou. Verifique a chave de service role e tente de novo."
        />
      ) : tableRows.length === 0 ? (
        <EmptyState
          title="Nenhum usuário encontrado"
          description={
            searchTerm || levelFilter || statusFilter || periodFilter
              ? "Nenhum cadastro combina com os filtros aplicados."
              : "A base ainda não tem cadastros."
          }
        />
      ) : (
        <div>
          <UsersTable
            rows={tableRows}
            writable={writable}
            bulkAction={recalculateSelectedScores}
            sortHref={sortHref}
            activeSort={sort.group}
            ascending={sort.ascending}
          />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            label="usuários"
            hrefForPage={(target) => hrefWith({ pagina: target > 1 ? String(target) : undefined })}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Fila de prioridade comercial: os maiores scores que ainda não depositaram.
 * Limitada a 24 candidatos justamente para caber numa consulta barata — é um
 * atalho para o começo do dia, não um relatório.
 */
async function loadPriorityQueue(
  admin: ReturnType<typeof createAdminSupabaseClient>
): Promise<{ id: string; name: string; accessLevel: string; score: number }[]> {
  const { data: topScores } = await admin
    .from("user_scores")
    .select("user_id, total_score")
    .order("total_score", { ascending: false })
    .limit(24);

  const candidateIds = (topScores ?? []).map((row) => row.user_id);
  if (candidateIds.length === 0) return [];

  const [{ data: candidates }, { data: ftds }] = await Promise.all([
    admin.from("users").select("id, full_name, email, access_level").in("id", candidateIds),
    admin.from("ftds").select("user_id").in("user_id", candidateIds),
  ]);

  const withFtd = new Set((ftds ?? []).map((row) => row.user_id));
  const userById = new Map((candidates ?? []).map((row) => [row.id, row]));

  return (topScores ?? [])
    .filter((row) => {
      const user = userById.get(row.user_id);
      if (!user) return false;
      if (withFtd.has(row.user_id)) return false;
      return user.access_level !== "ADMIN" && user.access_level !== "FTD_USER";
    })
    .slice(0, 6)
    .map((row) => {
      const user = userById.get(row.user_id);
      return {
        id: row.user_id,
        name: user?.full_name?.trim() || user?.email || "Sem nome",
        accessLevel: user?.access_level ?? "VISITOR",
        score: row.total_score,
      };
    });
}
