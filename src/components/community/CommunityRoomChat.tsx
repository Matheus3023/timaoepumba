"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

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
  currentUserId,
  initialMessages,
}: {
  roomId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const [supabase] = useState<SupabaseClient<Database>>(() => createClient());

  useEffect(() => {
    const channel = supabase
      .channel(`community_messages:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const row = payload.new as { id: string; user_id: string; content: string; created_at: string; is_pinned: boolean };
          const [{ data: author }, { data: membership }] = await Promise.all([
            supabase.from("users").select("full_name").eq("id", row.user_id).maybeSingle(),
            supabase
              .from("community_members")
              .select("role")
              .eq("room_id", roomId)
              .eq("user_id", row.user_id)
              .maybeSingle(),
          ]);
          setMessages((prev) => [
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
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    setError(null);
    const { error: insertError } = await supabase.from("community_messages").insert({
      room_id: roomId,
      user_id: currentUserId,
      content,
    });
    setSending(false);

    if (!insertError) {
      setDraft("");
      return;
    }

    setError(mapMessageError(insertError.message));
  }

  async function handleReport(messageId: string) {
    await supabase.from("message_reports").insert({
      message_id: messageId,
      reported_by: currentUserId,
      reason: "Conteudo inadequado",
    });
    setReportedIds((prev) => new Set(prev).add(messageId));
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-2 pb-4">
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
                {!isOwn && (
                  <p className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold opacity-90">
                    <span className={isStaff ? "text-emerald-300" : "opacity-70"}>{message.author_name}</span>
                    {isStaff && (
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">
                        {STAFF_ROLE_LABEL[message.author_role]}
                      </span>
                    )}
                  </p>
                )}
                <p>{message.content}</p>
                {!isOwn && (
                  <button
                    type="button"
                    onClick={() => handleReport(message.id)}
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
    </div>
  );
}
