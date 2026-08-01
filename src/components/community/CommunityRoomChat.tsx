"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/ToastProvider";

const REPORT_REASONS = ["Spam", "Discurso de odio", "Assedio", "Conteudo inadequado", "Outro"];

function mapMessageError(message: string): string {
  if (message.includes("links_not_allowed")) return "Links nao sao permitidos para usuarios comuns.";
  if (message.includes("user_muted")) return "Voce foi silenciado nesta sala.";
  if (message.includes("user_restricted")) return "Sua conta esta restrita e nao pode enviar mensagens.";
  return "Nao foi possivel enviar a mensagem.";
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

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(presenceChannel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ name: currentUserName });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
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
  }

  async function handleReport(messageId: string, reason: string) {
    setReportTarget(null);
    const { error: reportError } = await supabase.from("message_reports").insert({
      message_id: messageId,
      reported_by: currentUserId,
      reason,
    });

    if (reportError) {
      showToast("Nao foi possivel enviar a denuncia.", "error");
      return;
    }

    showToast("Denuncia enviada. A moderacao vai revisar.", "success");
    setReportedIds((prev) => new Set(prev).add(messageId));
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 px-4 py-1.5">
        <h1 className="truncate text-sm font-semibold text-white">{roomName}</h1>
        <div className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-400">
          <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-emerald-400" />
          {onlineCount}
        </div>
      </div>

      <div className="scrollbar-none flex-1 overflow-y-auto px-4">
        <div className="flex min-h-full flex-col justify-end gap-2 pb-4">
          {messages.map((message) => {
            const isOwn = message.user_id === currentUserId;
            const isStaff = isStaffRole(message.author_role);

            return (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  isOwn
                    ? "self-end bg-yellow-400 text-neutral-900"
                    : isStaff
                      ? "self-start border border-emerald-500/30 bg-emerald-500/10 text-neutral-100"
                      : "self-start bg-neutral-800 text-neutral-100"
                }`}
              >
                <p className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold opacity-90">
                  <span className={isOwn ? "text-neutral-900/70" : isStaff ? "text-emerald-300" : "opacity-70"}>
                    {isOwn ? "Voce" : message.author_name}
                  </span>
                  {isStaff && !isOwn && (
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">
                      {STAFF_ROLE_LABEL[message.author_role]}
                    </span>
                  )}
                </p>
                <p>{message.content}</p>
                {!isOwn && (
                  <button
                    type="button"
                    onClick={() => setReportTarget(message.id)}
                    disabled={reportedIds.has(message.id)}
                    className="mt-1 text-[10px] text-neutral-500 hover:text-red-400 disabled:text-neutral-600"
                  >
                    {reportedIds.has(message.id) ? "Denunciado" : "🚩 Denunciar"}
                  </button>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-neutral-800 px-4 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="input flex-1"
          maxLength={1000}
        />
        <button type="submit" disabled={sending || !draft.trim()} className="btn-primary px-4">
          Enviar
        </button>
      </form>

      <BottomSheet open={reportTarget !== null} onClose={() => setReportTarget(null)} title="Denunciar mensagem">
        <p className="mb-3 text-sm text-neutral-400">Qual o motivo da denuncia?</p>
        <div className="flex flex-col gap-1.5 pb-2">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => reportTarget && handleReport(reportTarget, reason)}
              className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-left text-sm text-neutral-200 transition hover:border-red-400/40 hover:bg-red-500/5 hover:text-red-300"
            >
              {reason}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
