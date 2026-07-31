import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const DEFAULT_PIPELINE_ID = "00000000-0000-0000-0000-000000000001";

/** Stage names as seeded in supabase/migrations/0003_seed.sql (PRD sec. 15.2). */
export type PipelineStageName =
  | "Novo visitante"
  | "Conta criada"
  | "Clicou na casa"
  | "Cadastro confirmado"
  | "Comunidade liberada"
  | "FTD confirmado"
  | "Usuario ativo"
  | "Usuario inativo"
  | "Em reativacao"
  | "Opt-out"
  | "Bloqueado";

/** Moves a user to a pipeline stage by name, creating the crm_user_status row if needed. */
export async function moveUserToStage(userId: string, stageName: PipelineStageName) {
  const supabase = createAdminSupabaseClient();

  const { data: stage, error: stageError } = await supabase
    .from("crm_stages")
    .select("id")
    .eq("pipeline_id", DEFAULT_PIPELINE_ID)
    .eq("name", stageName)
    .maybeSingle();

  if (stageError || !stage) {
    console.error(`[crm] pipeline stage not found: ${stageName}`, stageError);
    return;
  }

  const { error } = await supabase.from("crm_user_status").upsert(
    {
      user_id: userId,
      pipeline_id: DEFAULT_PIPELINE_ID,
      stage_id: stage.id,
      moved_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[crm] failed to move user to stage", error);
  }
}
