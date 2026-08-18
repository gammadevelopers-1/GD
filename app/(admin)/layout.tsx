import { connection } from "next/server";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireViewer } from "@/data/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const viewer = await requireViewer();
  const cookieStore = await cookies();
  const defaultSidebarOpen =
    cookieStore.get("sidebar_state")?.value !== "false";
  return (
    <AdminShell viewer={viewer} defaultSidebarOpen={defaultSidebarOpen}>
      {children}
    </AdminShell>
  );
}
