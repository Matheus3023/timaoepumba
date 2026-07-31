import { getAdminAccess, allowedSections } from "@/lib/admin/access";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccess();

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar adminName={access.adminName} profile={access.profile} allowedSections={allowedSections(access)} />
      <main className="flex-1 overflow-x-hidden px-6 py-6">{children}</main>
    </div>
  );
}
