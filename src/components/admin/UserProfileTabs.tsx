"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/Panel";
import { AccessLevelBadge, UserStatusBadge } from "@/components/admin/Badges";
import { formatDateTime } from "@/components/admin/format";
import { EmptyState } from "@/components/ui/EmptyState";

interface UserSummary {
  lead_id: string;
  access_level: string;
  status: string;
  created_at: string;
  date_of_birth: string | null;
}

interface ProfileSummary {
  pwa_install_status: string;
  pwa_installed_at: string | null;
  notification_permission: string;
  last_seen_at: string | null;
  last_device: string | null;
  last_browser: string | null;
  last_os: string | null;
  onboarding_completed: boolean;
  favorite_team_id: string | null;
}

interface ScoreSummary {
  intent_score: number;
  engagement_score: number;
  relationship_score: number;
  total_score: number;
  risk_blocked: boolean;
  risk_reason: string | null;
  calculated_at: string | null;
}

interface AttributionTouch {
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
}

interface TimelineEntry {
  id: string;
  description: string;
  occurred_at: string;
}

interface ConversionSummary {
  clicks: { id: string; clicked_at: string }[];
  registrationConfirmedAt: string | null;
  ftdConfirmedAt: string | null;
}

interface CommunitySummary {
  rooms: { room_name: string; role: string; joined_at: string }[];
  messages: { id: string; content: string; created_at: string }[];
}

interface PushDelivery {
  id: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  failure_reason: string | null;
}

interface PrivacySummary {
  consents: { consent_type: string; granted: boolean; version: string | null; granted_at: string }[];
  optedOutAt: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  created_at: string;
}

interface NoteEntry {
  id: string;
  note: string;
  created_at: string;
}

interface TaskEntry {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
}

/**
 * Rótulos dos valores gravados no banco. O painel mostrava `not_requested`,
 * `subscription_failed` e `FTD_USER` crus para quem trabalha com o cliente
 * do outro lado da linha — traduzir aqui é o mínimo para a ficha ser
 * legível por quem faz suporte, não só por quem escreveu a migration.
 */
const PWA_LABEL: Record<string, string> = {
  not_requested: "Não solicitado",
  prompt_viewed: "Viu o convite",
  accepted: "Aceitou instalar",
  dismissed: "Dispensou o convite",
  installed: "Instalado",
  unavailable: "Indisponível no aparelho",
};

const NOTIFICATION_LABEL: Record<string, string> = {
  not_requested: "Não solicitada",
  default: "Ainda não decidiu",
  granted: "Autorizada",
  denied: "Negada",
  unsupported: "Não suportada",
  subscription_failed: "Falha ao registrar",
};

const DELIVERY_LABEL: Record<string, string> = {
  pending: "Na fila",
  sent: "Enviado",
  delivered: "Entregue",
  opened: "Aberto",
  clicked: "Clicado",
  failed: "Falhou",
};

const DELIVERY_CLASS: Record<string, string> = {
  opened: "bg-success-soft text-success",
  clicked: "bg-success-soft text-success",
  failed: "bg-error-soft text-error",
};

const CONSENT_LABEL: Record<string, string> = {
  terms: "Termos de uso",
  privacy: "Política de privacidade",
  marketing: "Comunicações de marketing",
};

const RISK_REASON_LABEL: Record<string, string> = {
  restricted: "conta restrita",
  suspended: "conta suspensa",
  opted_out: "pediu para não receber marketing",
};

const SCORE_DIMENSIONS = [
  { key: "intent_score", label: "Intenção comercial", weight: "peso 50%" },
  { key: "engagement_score", label: "Engajamento no app", weight: "peso 30%" },
  { key: "relationship_score", label: "Relacionamento", weight: "peso 20%" },
] as const;

type TabKey =
  | "Resumo"
  | "Linha do tempo"
  | "Aquisição"
  | "Conversão"
  | "Comunidade"
  | "Comunicações"
  | "Privacidade"
  | "Notas e tarefas"
  | "Auditoria";

export function UserProfileTabs({
  user,
  profile,
  score,
  stageName,
  firstTouch,
  lastTouch,
  timeline,
  conversion,
  community,
  pushDeliveries,
  privacy,
  auditLogs,
  notes,
  tasks,
  writable,
  addNoteAction,
  addTaskAction,
  completeTaskAction,
}: {
  user: UserSummary;
  profile: ProfileSummary | null;
  score: ScoreSummary | null;
  stageName: string | null;
  firstTouch: AttributionTouch | null;
  lastTouch: AttributionTouch | null;
  timeline: TimelineEntry[];
  conversion: ConversionSummary;
  community: CommunitySummary;
  pushDeliveries: PushDelivery[];
  privacy: PrivacySummary;
  auditLogs: AuditEntry[];
  notes: NoteEntry[];
  tasks: TaskEntry[];
  writable: boolean;
  addNoteAction: (formData: FormData) => void;
  addTaskAction: (formData: FormData) => void;
  completeTaskAction: (taskId: string) => void;
}) {
  const [tab, setTab] = useState<TabKey>("Resumo");
  const openTasks = tasks.filter((task) => task.status !== "done").length;

  const tabs: { key: TabKey; count?: number }[] = [
    { key: "Resumo" },
    { key: "Linha do tempo", count: timeline.length },
    { key: "Aquisição" },
    { key: "Conversão", count: conversion.clicks.length },
    { key: "Comunidade", count: community.messages.length },
    { key: "Comunicações", count: pushDeliveries.length },
    { key: "Privacidade" },
    { key: "Notas e tarefas", count: notes.length + openTasks },
    { key: "Auditoria", count: auditLogs.length },
  ];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Seções da ficha"
        className="scrollbar-none -mb-px flex gap-1 overflow-x-auto border-b border-white/[0.06]"
      >
        {tabs.map(({ key, count }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] transition-colors ${
                active
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent text-muted hover:text-body"
              }`}
            >
              {key}
              {count !== undefined && count > 0 && (
                <span className="rounded-full bg-surface-elevated px-1.5 font-mono text-[10px] tabular-nums text-secondary">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-4">
        {tab === "Resumo" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Conta">
              <dl className="flex flex-col">
                <Row label="Lead ID" value={user.lead_id} mono />
                <Row label="Etapa do funil" value={<AccessLevelBadge level={user.access_level} />} />
                <Row label="Situação" value={<UserStatusBadge status={user.status} />} />
                <Row label="Etapa no pipeline" value={stageName ?? "—"} />
                <Row label="Cadastrado em" value={formatDateTime(user.created_at)} />
                <Row label="Nascimento" value={user.date_of_birth ? formatDateTime(user.date_of_birth) : "—"} />
                <Row label="Onboarding" value={profile?.onboarding_completed ? "Concluído" : "Não concluído"} />
                <Row
                  label="Instalação do app"
                  value={PWA_LABEL[profile?.pwa_install_status ?? "not_requested"] ?? profile?.pwa_install_status ?? "—"}
                />
                <Row
                  label="Notificações"
                  value={
                    NOTIFICATION_LABEL[profile?.notification_permission ?? "not_requested"] ??
                    profile?.notification_permission ??
                    "—"
                  }
                />
                <Row label="Último acesso" value={formatDateTime(profile?.last_seen_at)} />
                <Row
                  label="Aparelho"
                  value={[profile?.last_device, profile?.last_os, profile?.last_browser].filter(Boolean).join(" · ") || "—"}
                />
              </dl>
            </Panel>

            <Panel
              title="Lead score"
              description={score?.calculated_at ? `Calculado em ${formatDateTime(score.calculated_at)}` : undefined}
            >
              {score ? (
                <>
                  <div className="flex items-end gap-3">
                    <p className="text-5xl font-bold leading-none tabular-nums text-white">{score.total_score}</p>
                    <p className="pb-1 text-xs text-muted">de 100</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {SCORE_DIMENSIONS.map((dimension) => {
                      const value = score[dimension.key];
                      return (
                        <div key={dimension.key}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[13px] text-body">
                              {dimension.label}{" "}
                              <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
                                {dimension.weight}
                              </span>
                            </span>
                            <span className="text-sm font-semibold tabular-nums text-strong">{value}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                            <div className="h-full rounded-full bg-chart-home" style={{ width: `${value}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {score.risk_blocked && (
                    <p className="mt-4 rounded-none border border-error/25 bg-error-soft px-3 py-2 text-xs text-error">
                      Comunicações promocionais bloqueadas
                      {score.risk_reason ? `: ${RISK_REASON_LABEL[score.risk_reason] ?? score.risk_reason}` : ""}.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted">
                  Score ainda não calculado. Use &quot;Recalcular score&quot; acima.
                </p>
              )}
            </Panel>
          </div>
        )}

        {tab === "Linha do tempo" && (
          <Panel>
            {timeline.length === 0 ? (
              <EmptyState title="Sem eventos ainda" description="A linha do tempo é preenchida conforme a pessoa usa o aplicativo." />
            ) : (
              <ol className="relative flex flex-col gap-4 border-l border-white/[0.08] pl-4">
                {timeline.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span
                      aria-hidden
                      className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-sunken bg-surface-highlighted"
                    />
                    <p className="text-[13px] text-strong">{entry.description}</p>
                    <p className="font-mono text-[11px] tabular-nums text-faint">{formatDateTime(entry.occurred_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        )}

        {tab === "Aquisição" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Primeiro toque" description="Como essa pessoa conheceu o aplicativo.">
              <dl className="flex flex-col">
                <Row label="Origem" value={firstTouch?.utm_source ?? "—"} />
                <Row label="Meio" value={firstTouch?.utm_medium ?? "—"} />
                <Row label="Campanha" value={firstTouch?.utm_campaign ?? "—"} />
              </dl>
            </Panel>
            <Panel title="Último toque" description="O que trouxe essa pessoa de volta por último.">
              <dl className="flex flex-col">
                <Row label="Origem" value={lastTouch?.utm_source ?? "—"} />
                <Row label="Meio" value={lastTouch?.utm_medium ?? "—"} />
                <Row label="Campanha" value={lastTouch?.utm_campaign ?? "—"} />
              </dl>
            </Panel>
          </div>
        )}

        {tab === "Conversão" && (
          <Panel title="Casa parceira">
            <dl className="flex flex-col">
              <Row label="Cliques no link" value={String(conversion.clicks.length)} />
              <Row
                label="Cadastro confirmado"
                value={
                  conversion.registrationConfirmedAt ? (
                    formatDateTime(conversion.registrationConfirmedAt)
                  ) : (
                    <span className="text-muted">Não</span>
                  )
                }
              />
              <Row
                label="FTD confirmado"
                value={
                  conversion.ftdConfirmedAt ? (
                    <span className="text-success">{formatDateTime(conversion.ftdConfirmedAt)}</span>
                  ) : (
                    <span className="text-muted">Não</span>
                  )
                }
              />
            </dl>

            {conversion.clicks.length > 0 && (
              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                  Histórico de cliques
                </p>
                <ul className="flex flex-col gap-1">
                  {conversion.clicks.map((click) => (
                    <li key={click.id} className="font-mono text-[11px] tabular-nums text-secondary">
                      {formatDateTime(click.clicked_at)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        )}

        {tab === "Comunidade" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Salas">
              {community.rooms.length === 0 ? (
                <p className="text-sm text-muted">Não participa de nenhuma sala.</p>
              ) : (
                <ul className="flex flex-col">
                  {community.rooms.map((room, index) => (
                    <li
                      key={`${room.room_name}-${index}`}
                      className="flex items-center justify-between gap-2 border-b border-white/[0.04] py-2 last:border-b-0"
                    >
                      <span className="text-[13px] text-body">{room.room_name}</span>
                      <span className="badge bg-surface-elevated text-secondary">{room.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Últimas mensagens">
              {community.messages.length === 0 ? (
                <p className="text-sm text-muted">Nenhuma mensagem enviada.</p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {community.messages.map((message) => (
                    <li key={message.id} className="border-b border-white/[0.04] pb-2 last:border-b-0">
                      <p className="text-[13px] text-strong">{message.content}</p>
                      <p className="font-mono text-[11px] tabular-nums text-faint">
                        {formatDateTime(message.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}

        {tab === "Comunicações" && (
          <Panel title="Envios de push" description="Últimos 30 registros de entrega.">
            {pushDeliveries.length === 0 ? (
              <p className="text-sm text-muted">Nenhum envio registrado.</p>
            ) : (
              <ul className="flex flex-col">
                {pushDeliveries.map((delivery) => (
                  <li
                    key={delivery.id}
                    className="flex items-center justify-between gap-3 border-b border-white/[0.04] py-2 last:border-b-0"
                  >
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className={`badge ${DELIVERY_CLASS[delivery.status] ?? "bg-surface-elevated text-body"}`}>
                        {DELIVERY_LABEL[delivery.status] ?? delivery.status}
                      </span>
                      {delivery.failure_reason && (
                        <span className="truncate font-mono text-[11px] text-muted">{delivery.failure_reason}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-faint">
                      {formatDateTime(delivery.sent_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {tab === "Privacidade" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Consentimentos">
              {privacy.consents.length === 0 ? (
                <p className="text-sm text-muted">Sem registros.</p>
              ) : (
                <ul className="flex flex-col">
                  {privacy.consents.map((consent, index) => (
                    <li
                      key={`${consent.consent_type}-${index}`}
                      className="flex items-center justify-between gap-2 border-b border-white/[0.04] py-2 last:border-b-0"
                    >
                      <span className="text-[13px] text-body">
                        {CONSENT_LABEL[consent.consent_type] ?? consent.consent_type}
                        {consent.version && (
                          <span className="ml-1.5 font-mono text-[10px] text-faint">v{consent.version}</span>
                        )}
                      </span>
                      <span className={`badge ${consent.granted ? "bg-success-soft text-success" : "bg-error-soft text-error"}`}>
                        {consent.granted ? "Concedido" : "Negado"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Marketing">
              <p className="text-sm text-secondary">
                {privacy.optedOutAt ? (
                  <>
                    Pediu para não receber comunicações de marketing em{" "}
                    <span className="text-error">{formatDateTime(privacy.optedOutAt)}</span>.
                  </>
                ) : (
                  <>Sem pedido de opt-out registrado.</>
                )}
              </p>
            </Panel>
          </div>
        )}

        {tab === "Notas e tarefas" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Notas internas">
              {writable && (
                <form action={addNoteAction} className="mb-4 flex flex-col gap-2">
                  <textarea name="note" rows={3} className="input text-sm" placeholder="Registrar contato, combinado, observação..." />
                  <button type="submit" className="btn-secondary self-start px-4 py-2 text-xs">
                    Salvar nota
                  </button>
                </form>
              )}
              {notes.length === 0 ? (
                <p className="text-sm text-muted">Sem notas.</p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {notes.map((note) => (
                    <li key={note.id} className="border-b border-white/[0.04] pb-2 last:border-b-0">
                      <p className="text-[13px] text-body">{note.note}</p>
                      <p className="font-mono text-[11px] tabular-nums text-faint">{formatDateTime(note.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Tarefas">
              {writable && (
                <form action={addTaskAction} className="mb-4 flex flex-col gap-2">
                  <input name="title" className="input text-sm" placeholder="Título da tarefa" />
                  <input name="due_at" type="datetime-local" className="input text-sm" aria-label="Prazo" />
                  <button type="submit" className="btn-secondary self-start px-4 py-2 text-xs">
                    Criar tarefa
                  </button>
                </form>
              )}
              {tasks.length === 0 ? (
                <p className="text-sm text-muted">Sem tarefas.</p>
              ) : (
                <ul className="flex flex-col">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 border-b border-white/[0.04] py-2 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className={task.status === "done" ? "text-[13px] text-muted line-through" : "text-[13px] text-strong"}>
                          {task.title}
                        </p>
                        {task.due_at && (
                          <p className="font-mono text-[11px] tabular-nums text-faint">
                            prazo {formatDateTime(task.due_at)}
                          </p>
                        )}
                      </div>
                      {writable && task.status !== "done" && (
                        <form action={completeTaskAction.bind(null, task.id)}>
                          <button type="submit" className="btn-secondary shrink-0 px-3 py-1.5 text-xs">
                            Concluir
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}

        {tab === "Auditoria" && (
          <Panel title="Ações administrativas" description="O que a equipe fez nesta conta.">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma ação registrada para este usuário.</p>
            ) : (
              <ul className="flex flex-col">
                {auditLogs.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 border-b border-white/[0.04] py-2 last:border-b-0"
                  >
                    <span className="truncate font-mono text-xs text-primary">{entry.action}</span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-faint">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] py-1.5 last:border-b-0">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className={`min-w-0 truncate text-right text-[13px] text-strong ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
