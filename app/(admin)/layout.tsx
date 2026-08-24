import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/admin-shell";
import { RouteNotice } from "@/components/admin/route-notice";
import { ShellAccount, ShellBell } from "@/components/admin/shell-header";
import { requireViewer } from "@/data/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [viewer, cookieStore] = await Promise.all([requireViewer(), cookies()]);
  const defaultSidebarOpen =
    cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <AdminShell
      viewer={viewer}
      bell={<ShellBell viewer={viewer} />}
      account={<ShellAccount viewer={viewer} />}
      defaultSidebarOpen={defaultSidebarOpen}
    >
      <RouteNotice />
      {children}
    </AdminShell>
  );
}
