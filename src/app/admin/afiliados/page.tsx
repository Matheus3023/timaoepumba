import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function saveConfig(formData: FormData) {
  "use server";

  const admin = createAdminSupabaseClient();
  const id = String(formData.get("id") ?? "");

  const payload = {
    name: String(formData.get("name") ?? ""),
    domain: String(formData.get("domain") ?? ""),
    registration_url: String(formData.get("registration_url") ?? ""),
    subid_parameter: String(formData.get("subid_parameter") ?? "subid"),
    status: "active",
  };

  if (id) {
    await admin.from("affiliate_configurations").update(payload).eq("id", id);
  } else {
    await admin.from("affiliate_configurations").insert(payload);
  }

  revalidatePath("/admin/afiliados");
}

export default async function AdminAffiliatePage() {
  const admin = createAdminSupabaseClient();
  const { data: config } = await admin
    .from("affiliate_configurations")
    .select("*")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-white">Casa parceira</h1>
      <p className="text-sm text-neutral-400">
        O link de cadastro e gerado dinamicamente com o Lead ID do usuario como subid.
      </p>

      <form action={saveConfig} className="card mt-4 flex flex-col gap-3">
        <input type="hidden" name="id" defaultValue={config?.id ?? ""} />
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Nome da casa
          <input name="name" defaultValue={config?.name} required className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Dominio
          <input name="domain" defaultValue={config?.domain} required className="input" placeholder="casa-parceira.bet.br" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          URL de cadastro
          <input
            name="registration_url"
            defaultValue={config?.registration_url}
            required
            className="input"
            placeholder="https://casa-parceira.bet.br/cadastro"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Parametro do identificador
          <input name="subid_parameter" defaultValue={config?.subid_parameter ?? "subid"} required className="input" />
        </label>

        <button type="submit" className="btn-primary mt-2 self-start px-6">
          Salvar
        </button>
      </form>

      {config && (
        <section className="card mt-4">
          <h2 className="text-sm font-semibold text-neutral-200">Configuracao do webhook</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Configure a casa parceira para enviar postbacks para{" "}
            <code className="text-yellow-300">/api/webhooks/affiliate</code> com os headers:
          </p>
          <dl className="mt-2 flex flex-col gap-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-500">X-Webhook-Key</dt>
              <dd className="font-mono text-neutral-200">{config.webhook_key}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-500">X-Webhook-Signature</dt>
              <dd className="text-neutral-200">HMAC-SHA256(body, segredo)</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-neutral-600">
            O segredo (webhook_secret) fica armazenado no banco e nunca e exibido aqui. Consulte a
            tabela affiliate_configurations diretamente no Supabase para configura-lo na casa
            parceira.
          </p>
        </section>
      )}
    </div>
  );
}
