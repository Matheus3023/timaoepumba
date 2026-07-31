import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/fcm";

async function createAndSendCampaign(formData: FormData) {
  "use server";

  const admin = createAdminSupabaseClient();
  const category = String(formData.get("category") ?? "content");
  const title = String(formData.get("title") ?? "");
  const message = String(formData.get("message") ?? "");
  const internalLink = String(formData.get("internal_link") ?? "") || null;

  const { data: campaign } = await admin
    .from("push_campaigns")
    .insert({
      internal_name: String(formData.get("internal_name") ?? title),
      category,
      title,
      message,
      internal_link: internalLink,
      status: "sending",
    })
    .select("id")
    .single();

  if (!campaign) redirect("/admin/push");

  // Consent gating: promotional pushes must exclude users who opted out
  // (PRD sec. 17.4 "Usuarios sem consentimento nao deverao receber
  // comunicacoes promocionais"). Transactional/content/community are exempt.
  let userIds: string[];
  if (category === "promotional") {
    const [{ data: optedOut }, { data: allUsers }] = await Promise.all([
      admin.from("marketing_optouts").select("user_id"),
      admin.from("users").select("id").eq("status", "active"),
    ]);
    const optedOutIds = new Set((optedOut ?? []).map((o) => o.user_id));
    userIds = (allUsers ?? []).map((u) => u.id).filter((id) => !optedOutIds.has(id));
  } else {
    const { data: allUsers } = await admin.from("users").select("id").eq("status", "active");
    userIds = (allUsers ?? []).map((u) => u.id);
  }

  await Promise.all(
    userIds.map(async (userId) => {
      const result = await sendPushToUser(userId, { title, body: message, link: internalLink ?? undefined });
      await admin.from("push_deliveries").insert({
        push_campaign_id: campaign.id,
        user_id: userId,
        status: result.sent > 0 ? "sent" : "failed",
        sent_at: result.sent > 0 ? new Date().toISOString() : null,
        failure_reason: result.sent > 0 ? null : "no_active_subscription_or_send_failed",
      });
    })
  );

  await admin.from("push_campaigns").update({ status: "sent" }).eq("id", campaign.id);

  redirect("/admin/push");
}

export default function NewPushCampaignPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-white">Nova campanha de push</h1>

      <form action={createAndSendCampaign} className="mt-4 flex flex-col gap-3">
        <input name="internal_name" placeholder="Nome interno" required className="input" />

        <select name="category" defaultValue="content" className="input">
          <option value="transactional">Transacional</option>
          <option value="content">Conteudo</option>
          <option value="community">Comunidade</option>
          <option value="promotional">Promocional</option>
        </select>

        <input name="title" placeholder="Titulo da notificacao" required className="input" />
        <textarea name="message" placeholder="Mensagem" required rows={3} className="input" />
        <input name="internal_link" placeholder="Link interno (ex: /analises/123)" className="input" />

        <button type="submit" className="btn-primary mt-2 self-start px-6">
          Enviar agora
        </button>
      </form>
    </div>
  );
}
