import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: appUser } = await supabase.from("users").select("access_level, full_name").eq("id", user.id).single();

  if (appUser?.access_level !== "ADMIN") redirect("/home");

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar adminName={appUser.full_name ?? "Admin"} />
      <main className="flex-1 overflow-x-hidden px-6 py-6">{children}</main>
    </div>
  );
}
