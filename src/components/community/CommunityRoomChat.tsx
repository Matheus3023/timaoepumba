"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/ToastProvider";
import { Avatar } from "@/components/ui/Avatar";

const PRESENCE_HEARTBEAT_MS = 25_000;

const REPORT_REASONS = ["Spam", "Discurso de ódio", "Assédio", "Conteúdo inadequado", "Outro"];

function mapMessageError(message: string): string {
  if (message.includes("links_not_allowed")) return "Links não são permitidos para usuários comuns.";
  if (message.includes("user_muted")) return "Você foi silenciado nesta sala.";
  if (message.includes("user_restricted")) return "Sua conta está restrita e não pode enviar mensagens.";
  return "Não foi possível enviar a mensagem.";
}

const STAFF_ROLE_LABEL: Record<string, string> = {
  administrador: "Admin",
  gestor: "Gestor",
  analista: "Analista",
  moderador: "Moderador",
  suporte: "Suporte",
};

function isStaffRole(role: string): boolean {
  return role in STAFF_ROLE_LABEL;
}

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  author_name: string;
  author_role: string;
}

/** Só a hora, no fuso de quem está lendo. Data não cabe numa linha de chat. */
function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Mensagens seguidas do mesmo autor, dentro de uma janela curta, formam um
 * bloco visual. A janela evita colar mensagens separadas por meia hora só
 * porque ninguém falou no meio.
 */
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

function isGroupedWithPrevious(
  message: { user_id: string; created_at: string },
  previous: { user_id: string; created_at: string } | undefined
): boolean {
  if (!previous || previous.user_id !== message.user_id) return false;
  const gap = new Date(message.created_at).getTime() - new Date(previous.created_at).getTime();
  return gap >= 0 && gap < GROUPING_WINDOW_MS;
}

/**
 * Community room message list + composer. Reads/writes go straight through
 * the browser Supabase client so Row Level Security (community_messages
 * policies) is the actual access-control boundary — a non-member can't
 * read or post here even if they hit this component directly.
 */
export function CommunityRoomChat({
  roomId,
  roomName,
  currentUserId,
  currentUserName,
  initialMessages,
}: {
  roomId: string;
  roomName: string;
  currentUserId: string;
  currentUserName: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [supabase] = useState<SupabaseClient<Database>>(() => createClient());
  const { showToast } = useToast();

  useEffect(() => {
    const presenceChannel = supabase.channel(`community_presence:${roomId}`, {
      config: { presence: { key: currentUserId } },
    });

    // Marks this user "online" in user_presence (RLS lets a user write only
    // their own row) so the server can tell who's actually online right now
    // vs offline when deciding who to push-notify about a new message —
    // this table previously existed but nothing ever wrote to it.
    async function markOnline() {
      await supabase.from("user_presence").upsert(
        { user_id: currentUserId, status: "online", current_page: "comunidade", last_activity_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    }

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(presenceChannel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ name: currentUserName });
          await markOnline();
        }
      });

    const heartbeat = setInterval(markOnline, PRESENCE_HEARTBEAT_MS);

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(presenceChannel);
      // Best-effort — tab close won't reliably run this, which is fine:
      // the notify endpoint also treats a stale last_activity_at as offline.
      void supabase.from("user_presence").update({ status: "offline" }).eq("user_id", currentUserId);
    };
  }, [roomId, currentUserId, currentUserName, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`community_messages:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const row = payload.new as { id: string; user_id: string; content: string; created_at: string; is_pinned: boolean };

          // The sender's own message is appended optimistically in
          // handleSubmit already (Realtime broadcasts inserts back to the
          // author too, not just other members) — no need to re-fetch and
          // re-add it here.
          if (row.user_id === currentUserId) return;

          const [{ data: author }, { data: membership }] = await Promise.all([
            supabase.from("users").select("full_name").eq("id", row.user_id).maybeSingle(),
            supabase
              .from("community_members")
              .select("role")
              .eq("room_id", roomId)
              .eq("user_id", row.user_id)
              .maybeSingle(),
          ]);
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                user_id: row.user_id,
                content: row.content,
                created_at: row.created_at,
                is_pinned: row.is_pinned,
                author_name: author?.full_name ?? "Torcedor",
                author_role: membership?.role ?? "usuario",
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    setError(null);
    const { data: inserted, error: insertError } = await supabase
      .from("community_messages")
      .insert({ room_id: roomId, user_id: currentUserId, content })
      .select("id, content, created_at, is_pinned")
      .single();
    setSending(false);

    if (insertError || !inserted) {
      setError(mapMessageError(insertError?.message ?? ""));
      return;
    }

    setDraft("");
    // Appended locally instead of waiting for the Realtime echo — the
    // moderation trigger can rewrite `content` (masking banned words), so
    // this uses what actually got saved rather than the raw draft.
    setMessages((prev) => [
      ...prev,
      {
        id: inserted.id,
        user_id: currentUserId,
        content: inserted.content,
        created_at: inserted.created_at,
        is_pinned: inserted.is_pinned,
        author_name: currentUserName,
        author_role: "usuario",
      },
    ]);

    // Fire-and-forget: nudges offline members via push. Best-effort — a
    // failure here shouldn't surface as a "message failed to send" error,
    // since it already sent successfully.
    fetch("/api/community/notify-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, messageId: inserted.id }),
    }).catch(() => {});
  }

  async function handleReport(messageId: string, reason: string) {
    setReportTarget(null);
    const { error: reportError } = await supabase.from("message_reports").insert({
      message_id: messageId,
      reported_by: currentUserId,
      reason,
    });

    if (reportError) {
      showToast("Não foi possível enviar a denúncia.", "error");
      return;
    }

    showToast("Denúncia enviada. A moderação vai revisar.", "success");
    setReportedIds((prev) => new Set(prev).add(messageId));
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-surface-elevated px-4 py-1.5">
        <h1 className="truncate text-sm font-semibold text-white">{roomName}</h1>
        <div className="flex shrink-0 items-center gap-1 text-[11px] text-secondary">
          <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-emerald-400" />
          {onlineCount}
        </div>
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto px-3">
        <div className="flex min-h-full flex-col justify-end gap-0.5 pb-3">
          {messages.map((message, index) => {
            const isOwn = message.user_id === currentUserId;
            const isStaff = isStaffRole(message.author_role);
            // Mensagens seguidas da mesma pessoa viram um bloco só: o nome e
            // a foto aparecem uma vez, no topo. Repetir os dois a cada linha
            // enche a tela de moldura e deixa pouco espaço para o que
            // importa, que é o texto.
            const grouped = isGroupedWithPrevious(message, messages[index - 1]);

            return (
              <div
                key={message.id}
                className={`flex items-start gap-2.5 ${grouped ? "mt-0.5" : "mt-3 first:mt-0"} ${
                  isOwn ? "flex-row-reverse self-end" : "self-start"
                }`}
              >
                {/* Espaçador do mesmo tamanho do avatar mantém as mensagens
                    agrupadas alinhadas com a primeira do bloco. */}
                {grouped ? (
                  <span className="w-8 shrink-0" aria-hidden />
                ) : (
                  <Avatar name={message.author_name} size={32} className="shrink-0" />
                )}

                <div className={`flex max-w-[76%] min-w-0 flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {!grouped && (
                    <p
                      className={`mb-1 flex items-baseline gap-1.5 px-0.5 text-xs ${
                        isOwn ? "flex-row-reverse" : ""
                      }`}
                    >
                      {/* O nome aparece para todo mundo, inclusive para quem
                          escreveu — antes a própria mensagem saía anônima. */}
                      <span className={`font-semibold ${isStaff ? "text-emerald-300" : "text-strong"}`}>
                        {isOwn ? currentUserName : message.author_name}
                      </span>
                      {isStaff && (
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">
                          {STAFF_ROLE_LABEL[message.author_role]}
                        </span>
                      )}
                      <time
                        dateTime={message.created_at}
                        className="text-[10px] font-normal tabular-nums text-faint"
                      >
                        {formatMessageTime(message.created_at)}
                      </time>
                    </p>
                  )}

                  <div className={`group flex items-center gap-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`min-w-0 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${
                        isOwn
                          ? "bg-primary text-surface"
                          : isStaff
                            ? "border border-emerald-500/25 bg-emerald-500/10 text-neutral-100"
                            : "bg-surface-elevated text-neutral-100"
                      }`}
                    >
                      {message.content}
                    </div>

                    {/* Denúncia sai de baixo da bolha e vira um ícone ao lado.
                        Uma linha de "🚩 Denunciar" embaixo de cada mensagem
                        dobrava a altura da conversa por uma ação rara. */}
                    {!isOwn && (
                      <button
                        type="button"
                        onClick={() => setReportTarget(message.id)}
                        disabled={reportedIds.has(message.id)}
                        aria-label={reportedIds.has(message.id) ? "Mensagem denunciada" : "Denunciar mensagem"}
                        title={reportedIds.has(message.id) ? "Mensagem denunciada" : "Denunciar mensagem"}
                        className="shrink-0 rounded-full p-1 text-[11px] leading-none text-faint opacity-0 transition-opacity hover:text-red-400 focus-visible:opacity-100 disabled:text-faint group-hover:opacity-100 max-sm:opacity-60"
                      >
                        {reportedIds.has(message.id) ? "✓" : "⚑"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-400">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-white/[0.06] bg-sunken/60 px-3 py-2.5"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Mensagem"
          aria-label="Escreva uma mensagem"
          className="input min-w-0 flex-1 rounded-full py-2.5"
          maxLength={1000}
        />
        {/* Botão redondo com o ícone de enviar: em tela de celular, "Enviar"
            escrito come largura que faz falta para o campo de texto. */}
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Enviar mensagem"
          className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0 text-lg leading-none disabled:opacity-40"
        >
          ↑
        </button>
      </form>

      <BottomSheet open={reportTarget !== null} onClose={() => setReportTarget(null)} title="Denunciar mensagem">
        <p className="mb-3 text-sm text-secondary">Qual o motivo da denúncia?</p>
        <div className="flex flex-col gap-1.5 pb-2">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => reportTarget && handleReport(reportTarget, reason)}
              className="rounded-xl border border-surface-elevated bg-surface/60 px-4 py-3 text-left text-sm text-strong transition hover:border-red-400/40 hover:bg-red-500/5 hover:text-red-300"
            >
              {reason}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
