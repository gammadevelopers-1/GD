import { connection } from "next/server";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireViewer } from "@/data/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Render per request, so a signed-in page is never cached and shared.
  await connection();
  const viewer = await requireViewer();
  // The sidebar writes its collapsed state to this cookie; reading it here
  // keeps the chosen state across reloads without a flash of the default.
  const cookieStore = await cookies();
  const defaultSidebarOpen =
    cookieStore.get("sidebar_state")?.value !== "false";
  return (
    <AdminShell viewer={viewer} defaultSidebarOpen={defaultSidebarOpen}>
      {children}
    </AdminShell>
  );
}
