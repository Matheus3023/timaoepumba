"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  author_name: string;
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
          const { data: author } = await supabase.from("users").select("full_name").eq("id", row.user_id).maybeSingle();
          setMessages((prev) => [
            ...prev,
            {
              id: row.id,
              user_id: row.user_id,
              content: row.content,
              created_at: row.created_at,
              is_pinned: row.is_pinned,
              author_name: author?.full_name ?? "Torcedor",
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
    const { error } = await supabase.from("community_messages").insert({
      room_id: roomId,
      user_id: currentUserId,
      content,
    });
    setSending(false);

    if (!error) setDraft("");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-2 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                message.user_id === currentUserId
                  ? "self-end bg-yellow-400 text-neutral-900"
                  : "self-start bg-neutral-800 text-neutral-100"
              }`}
            >
              {message.user_id !== currentUserId && (
                <p className="mb-0.5 text-xs font-semibold opacity-70">{message.author_name}</p>
              )}
              <p>{message.content}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

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
