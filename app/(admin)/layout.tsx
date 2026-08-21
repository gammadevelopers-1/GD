import { connection } from "next/server";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireViewer } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const viewer = await requireViewer();
  const cookieStore = await cookies();
  const defaultSidebarOpen =
    cookieStore.get("sidebar_state")?.value !== "false";

  let avatarUrl: string | null = null;
  if (viewer.avatarPath) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("app-avatars")
      .createSignedUrl(viewer.avatarPath, 60 * 60);
    avatarUrl = data?.signedUrl ?? null;
  }

  return (
    <AdminShell
      viewer={viewer}
      avatarUrl={avatarUrl}
      defaultSidebarOpen={defaultSidebarOpen}
    >
      {children}
    </AdminShell>
  );
}
