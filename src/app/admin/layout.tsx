import { getAdminAccess, allowedSections } from "@/lib/admin/access";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccess();
  const sections = allowedSections(access);

  return (
    <div className="flex min-h-dvh flex-col sm:flex-row">
      <AdminSidebar adminName={access.adminName} profile={access.profile} allowedSections={sections} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav adminName={access.adminName} profile={access.profile} allowedSections={sections} />
        <main className="flex-1 overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
