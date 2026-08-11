import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdminSection } from "@/lib/admin/access";
import { sinceDaysAgo } from "@/lib/admin/period";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Panel, TABLE_HEAD_CLASS, TableShell } from "@/components/admin/Panel";
import { Pagination } from "@/components/admin/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/components/admin/format";

const PAGE_SIZE = 50;

const ACTOR_TYPE_LABEL: Record<string, string> = {
  admin: "Administrador",
  system: "Sistema",
  user: "Usuário",
};

/**
 * Tradução das ações registradas. A chave técnica continua visível embaixo
 * (é o que se procura num incidente), mas quem audita não deveria precisar
 * decorar `funil_strategy_flag_toggled` para saber o que aconteceu.
 */
const ACTION_LABEL: Record<string, string> = {
  account_deletion_requested: "Exclusão de conta solicitada",
  admin_role_assigned: "Perfil administrativo atribuído",
  admin_role_removed: "Perfil administrativo removido",
  affiliate_config_saved: "Configuração da casa parceira salva",
  analysis_created: "Análise criada",
  banned_word_added: "Palavra bloqueada adicionada",
  banned_word_removed: "Palavra bloqueada removida",
  competition_activated: "Competição ativada",
  competition_deactivated: "Competição desativada",
  competition_updated: "Competição atualizada",
  crm_note_added: "Nota interna adicionada",
  crm_task_created: "Tarefa criada",
  funil_strategy_cooldown_updated: "Cooldown da estratégia alterado",
  funil_strategy_flag_toggled: "Estratégia ligada ou desligada",
  funil_strategy_version_created: "Nova versão de estratégia",
  live_chat_force_unlocked: "Bate-papo liberado manualmente",
  message_deleted: "Mensagem excluída",
  onboarding_config_updated: "Onboarding atualizado",
  push_campaign_sent: "Campanha de push enviada",
  report_dismissed: "Denúncia descartada",
  score_recalculated: "Score recalculado",
  scores_recalculated: "Scores recalculados (base inteira)",
  scores_recalculated_bulk: "Scores recalculados (seleção)",
  segment_created: "Segmento criado",
  segment_deleted: "Segmento excluído",
  sports_cache_purged: "Cache esportivo limpo",
  user_muted: "Usuário silenciado",
  user_restricted: "Conta restringida",
};

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

const PERIOD_OPTIONS = [
  { value: "", label: "Qualquer data" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
];

interface AuditSearchParams {
  q?: string;
  tipo?: string;
  periodo?: string;
  pagina?: string;
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<AuditSearchParams>;
}) {
  const params = await searchParams;
  await requireAdminSection("auditoria");
  const admin = createAdminSupabaseClient();

  const rawQuery = (params.q ?? "").trim().slice(0, 60);
  const searchTerm = rawQuery.replace(/[,()*%\\"']/g, " ").replace(/\s+/g, " ").trim();
  const actorType = params.tipo && ACTOR_TYPE_LABEL[params.tipo] ? params.tipo : "";
  const periodKey = params.periodo && PERIOD_DAYS[params.periodo] ? params.periodo : "";
  const page = Math.max(1, Number.parseInt(params.pagina ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = admin.from("audit_logs").select("*", { count: "exact" });
  if (searchTerm) query = query.ilike("action", `%${searchTerm}%`);
  if (actorType) query = query.eq("actor_type", actorType);
  if (periodKey) {
    query = query.gte("created_at", sinceDaysAgo(PERIOD_DAYS[periodKey]));
  }

  const { data: logs, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  const rows = logs ?? [];
  const total = count ?? 0;

  const actorIds = [...new Set(rows.map((log) => log.actor_id).filter((id): id is string => !!id))];
  const { data: actors } = actorIds.length
    ? await admin.from("users").select("id, full_name, email").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };
  const actorById = new Map((actors ?? []).map((actor) => [actor.id, actor.full_name ?? actor.email]));

  function hrefWith(patch: AuditSearchParams): string {
    const next = new URLSearchParams();
    const merged: AuditSearchParams = {
      q: searchTerm || undefined,
      tipo: actorType || undefined,
      periodo: periodKey || undefined,
      pagina: page > 1 ? String(page) : undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    const queryString = next.toString();
    return queryString ? `/admin/auditoria?${queryString}` : "/admin/auditoria";
  }

  const hasFilters = Boolean(searchTerm || actorType || periodKey);

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="Sistema"
        title="Auditoria"
        description="Registro de quem fez o quê no painel. Toda ação de escrita passa por aqui."
      />

      {/* Formulário GET puro: a tela segue Server Component e o filtro fica
          na URL, então um achado pode ser mandado por link para outra
          pessoa da equipe. */}
      <form className="flex flex-col gap-2 rounded-none border border-white/[0.06] bg-surface/40 p-3 lg:flex-row lg:items-center">
        <input
          name="q"
          defaultValue={rawQuery}
          placeholder="Buscar por ação (ex.: score, push, competition)"
          aria-label="Buscar por ação"
          className="input flex-1 py-2.5 text-sm"
        />
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <select name="tipo" defaultValue={actorType} aria-label="Tipo de autor" className="input py-2.5 text-sm">
            <option value="">Qualquer autor</option>
            {Object.entries(ACTOR_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select name="periodo" defaultValue={periodKey} aria-label="Período" className="input py-2.5 text-sm">
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary px-4 py-2.5 text-sm">
            Filtrar
          </button>
          {hasFilters && (
            <Link
              href="/admin/auditoria"
              className="flex items-center justify-center px-2 text-xs font-semibold text-secondary hover:text-body"
            >
              Limpar
            </Link>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma ação encontrada"
          description={hasFilters ? "Nenhum registro combina com os filtros." : "Nada foi registrado ainda."}
        />
      ) : (
        <div>
          <Panel bodyClassName="">
            <TableShell minWidth={820}>
              <thead className={TABLE_HEAD_CLASS}>
                <tr>
                  <th scope="col" className="px-3 py-2.5">
                    Quando
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Quem
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Ação
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Registro afetado
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((log) => (
                  <tr key={log.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs tabular-nums text-muted">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-3 py-2 text-[13px] text-body">
                      {log.actor_id
                        ? actorById.get(log.actor_id) ?? log.actor_id.slice(0, 8)
                        : ACTOR_TYPE_LABEL[log.actor_type] ?? log.actor_type}
                    </td>
                    <td className="px-3 py-2">
                      <span className="block text-[13px] text-strong">{ACTION_LABEL[log.action] ?? log.action}</span>
                      {ACTION_LABEL[log.action] && (
                        <span className="block font-mono text-[10px] text-faint">{log.action}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted">
                      {log.entity_type ?? "—"}
                      {log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </Panel>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            label="registros"
            hrefForPage={(target) => hrefWith({ pagina: target > 1 ? String(target) : undefined })}
          />
        </div>
      )}
    </div>
  );
}
