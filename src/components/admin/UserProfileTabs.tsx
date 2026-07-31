"use client";

import { useState } from "react";

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

const TABS = ["Resumo", "Timeline", "Aquisicao", "Conversao", "Comunidade", "Comunicacoes", "Privacidade", "Notas e tarefas", "Auditoria"] as const;

const SCORE_CLASS = (v: number) =>
  v >= 80 ? "text-emerald-300" : v >= 60 ? "text-yellow-300" : v >= 40 ? "text-orange-300" : "text-neutral-400";

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
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resumo");

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-1 border-b border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-3 py-2 text-sm transition ${
              tab === t ? "border-b-2 border-yellow-400 text-yellow-300" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "Resumo" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="card">
              <h2 className="text-sm font-semibold text-neutral-200">Conta</h2>
              <dl className="mt-2 flex flex-col gap-1 text-sm text-neutral-400">
                <Row label="Lead ID" value={user.lead_id} />
                <Row label="Nivel de acesso" value={user.access_level} />
                <Row label="Status" value={user.status} />
                <Row label="Etapa (pipeline)" value={stageName ?? "—"} />
                <Row label="Cadastrado em" value={new Date(user.created_at).toLocaleString("pt-BR")} />
                <Row label="Instalou o app" value={profile?.pwa_install_status ?? "not_requested"} />
                <Row label="Notificacoes" value={profile?.notification_permission ?? "not_requested"} />
                <Row label="Ultimo acesso" value={profile?.last_seen_at ? new Date(profile.last_seen_at).toLocaleString("pt-BR") : "—"} />
                <Row label="Dispositivo" value={[profile?.last_device, profile?.last_os, profile?.last_browser].filter(Boolean).join(" • ") || "—"} />
              </dl>
            </section>

            <section className="card">
              <h2 className="text-sm font-semibold text-neutral-200">Lead score</h2>
              {score ? (
                <>
                  <p className={`mt-1 text-3xl font-bold ${SCORE_CLASS(score.total_score)}`}>{score.total_score}</p>
                  <dl className="mt-3 flex flex-col gap-1 text-sm text-neutral-400">
                    <Row label="Intencao comercial" value={String(score.intent_score)} />
                    <Row label="Engajamento" value={String(score.engagement_score)} />
                    <Row label="Relacionamento" value={String(score.relationship_score)} />
                  </dl>
                  {score.risk_blocked && (
                    <p className="mt-2 text-xs text-red-400">
                      Comunicacoes promocionais bloqueadas ({score.risk_reason})
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-neutral-500">Ainda nao calculado.</p>
              )}
            </section>
          </div>
        )}

        {tab === "Timeline" && (
          <section className="card">
            <ul className="flex flex-col gap-2 text-sm">
              {timeline.map((t) => (
                <li key={t.id} className="border-b border-neutral-800 pb-2">
                  <p className="text-neutral-200">{t.description}</p>
                  <p className="text-xs text-neutral-500">{new Date(t.occurred_at).toLocaleString("pt-BR")}</p>
                </li>
              ))}
              {timeline.length === 0 && <p className="text-neutral-500">Sem eventos ainda.</p>}
            </ul>
          </section>
        )}

        {tab === "Aquisicao" && (
          <section className="card">
            <h2 className="text-sm font-semibold text-neutral-200">Atribuicao</h2>
            <dl className="mt-2 flex flex-col gap-1 text-sm text-neutral-400">
              <Row label="Origem (1o toque)" value={firstTouch?.utm_source ?? "—"} />
              <Row label="Campanha (1o toque)" value={firstTouch?.utm_campaign ?? "—"} />
              <Row label="Origem (ultimo toque)" value={lastTouch?.utm_source ?? "—"} />
              <Row label="Campanha (ultimo toque)" value={lastTouch?.utm_campaign ?? "—"} />
              <Row label="Meio (ultimo toque)" value={lastTouch?.utm_medium ?? "—"} />
            </dl>
          </section>
        )}

        {tab === "Conversao" && (
          <section className="card">
            <h2 className="text-sm font-semibold text-neutral-200">Casa parceira</h2>
            <dl className="mt-2 flex flex-col gap-1 text-sm text-neutral-400">
              <Row label="Cliques" value={String(conversion.clicks.length)} />
              <Row
                label="Cadastro confirmado"
                value={conversion.registrationConfirmedAt ? new Date(conversion.registrationConfirmedAt).toLocaleString("pt-BR") : "Nao"}
              />
              <Row label="FTD confirmado" value={conversion.ftdConfirmedAt ? new Date(conversion.ftdConfirmedAt).toLocaleString("pt-BR") : "Nao"} />
            </dl>
          </section>
        )}

        {tab === "Comunidade" && (
          <section className="card">
            <h2 className="text-sm font-semibold text-neutral-200">Salas</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-300">
              {community.rooms.map((r, i) => (
                <li key={i} className="flex justify-between border-b border-neutral-800 pb-1">
                  <span>{r.room_name}</span>
                  <span className="text-neutral-500">{r.role}</span>
                </li>
              ))}
              {community.rooms.length === 0 && <p className="text-neutral-500">Nenhuma sala.</p>}
            </ul>

            <h2 className="mt-4 text-sm font-semibold text-neutral-200">Ultimas mensagens</h2>
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {community.messages.map((m) => (
                <li key={m.id} className="border-b border-neutral-800 pb-2">
                  <p className="text-neutral-200">{m.content}</p>
                  <p className="text-xs text-neutral-500">{new Date(m.created_at).toLocaleString("pt-BR")}</p>
                </li>
              ))}
              {community.messages.length === 0 && <p className="text-neutral-500">Sem mensagens.</p>}
            </ul>
          </section>
        )}

        {tab === "Comunicacoes" && (
          <section className="card">
            <ul className="flex flex-col gap-2 text-sm">
              {pushDeliveries.map((d) => (
                <li key={d.id} className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-300">
                    {d.status}
                    {d.failure_reason ? ` — ${d.failure_reason}` : ""}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {d.sent_at ? new Date(d.sent_at).toLocaleString("pt-BR") : "—"}
                  </span>
                </li>
              ))}
              {pushDeliveries.length === 0 && <p className="text-neutral-500">Nenhum envio registrado.</p>}
            </ul>
          </section>
        )}

        {tab === "Privacidade" && (
          <section className="card">
            <h2 className="text-sm font-semibold text-neutral-200">Consentimentos</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-300">
              {privacy.consents.map((c, i) => (
                <li key={i} className="flex justify-between border-b border-neutral-800 pb-1">
                  <span>{c.consent_type}</span>
                  <span className={c.granted ? "text-emerald-300" : "text-red-400"}>{c.granted ? "concedido" : "negado"}</span>
                </li>
              ))}
              {privacy.consents.length === 0 && <p className="text-neutral-500">Sem registros.</p>}
            </ul>
            <p className="mt-3 text-sm text-neutral-400">
              Opt-out de marketing:{" "}
              {privacy.optedOutAt ? (
                <span className="text-red-400">{new Date(privacy.optedOutAt).toLocaleString("pt-BR")}</span>
              ) : (
                <span className="text-emerald-300">nao</span>
              )}
            </p>
          </section>
        )}

        {tab === "Notas e tarefas" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="card">
              <h2 className="text-sm font-semibold text-neutral-200">Notas internas</h2>
              {writable && (
                <form action={addNoteAction} className="mt-2 flex flex-col gap-2">
                  <textarea name="note" rows={3} className="input" placeholder="Adicionar nota..." />
                  <button type="submit" className="btn-secondary self-start">
                    Salvar nota
                  </button>
                </form>
              )}
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {notes.map((n) => (
                  <li key={n.id} className="border-b border-neutral-800 pb-2 text-neutral-300">
                    <p>{n.note}</p>
                    <p className="text-xs text-neutral-500">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                  </li>
                ))}
                {notes.length === 0 && <p className="text-neutral-500">Sem notas.</p>}
              </ul>
            </section>

            <section className="card">
              <h2 className="text-sm font-semibold text-neutral-200">Tarefas</h2>
              {writable && (
                <form action={addTaskAction} className="mt-2 flex flex-col gap-2">
                  <input name="title" className="input" placeholder="Titulo da tarefa" />
                  <input name="due_at" type="datetime-local" className="input" />
                  <button type="submit" className="btn-secondary self-start">
                    Criar tarefa
                  </button>
                </form>
              )}
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <div>
                      <p className={t.status === "done" ? "text-neutral-500 line-through" : "text-neutral-200"}>{t.title}</p>
                      {t.due_at && <p className="text-xs text-neutral-500">{new Date(t.due_at).toLocaleString("pt-BR")}</p>}
                    </div>
                    {writable && t.status !== "done" && (
                      <form action={completeTaskAction.bind(null, t.id)}>
                        <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                          Concluir
                        </button>
                      </form>
                    )}
                  </li>
                ))}
                {tasks.length === 0 && <p className="text-neutral-500">Sem tarefas.</p>}
              </ul>
            </section>
          </div>
        )}

        {tab === "Auditoria" && (
          <section className="card">
            <ul className="flex flex-col gap-2 text-sm">
              {auditLogs.map((a) => (
                <li key={a.id} className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-mono text-xs text-yellow-300">{a.action}</span>
                  <span className="text-xs text-neutral-500">{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                </li>
              ))}
              {auditLogs.length === 0 && <p className="text-neutral-500">Nenhuma acao registrada para este usuario.</p>}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right text-neutral-200">{value}</dd>
    </div>
  );
}
