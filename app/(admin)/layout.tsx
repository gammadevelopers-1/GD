import { connection } from "next/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireViewer } from "@/data/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Force dynamic rendering so authenticated pages are never shared.
  await connection();
  const viewer = await requireViewer();
  return <AdminShell viewer={viewer}>{children}</AdminShell>;
}
