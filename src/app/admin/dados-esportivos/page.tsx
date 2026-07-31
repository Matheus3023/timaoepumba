import { canWrite, requireAdminSection } from "@/lib/admin/access";
import { SportsDataDebugClient } from "@/components/admin/SportsDataDebugClient";

export default async function SportsDataDebugPage() {
  const access = await requireAdminSection("dados_esportivos");
  return <SportsDataDebugClient canWrite={canWrite(access, "dados_esportivos")} />;
}
