import { Suspense } from "react";
import { AccountMenu } from "@/components/admin/account-menu";
import { NotificationBell } from "@/components/admin/notification-bell";
import { getMyNotifications } from "@/data/notifications";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/data/auth";

const EMPTY_INBOX = { items: [], unread: 0 };

async function InboxBell({ viewer }: { viewer: Viewer }) {
  const inbox = await getMyNotifications(viewer);
  return <NotificationBell inbox={inbox} />;
}

async function AccountFace({ viewer }: { viewer: Viewer }) {
  if (!viewer.avatarPath) return <AccountMenu viewer={viewer} avatarUrl={null} />;

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("app-avatars")
    .createSignedUrl(viewer.avatarPath, 60 * 60);

  return <AccountMenu viewer={viewer} avatarUrl={data?.signedUrl ?? null} />;
}

export function ShellBell({ viewer }: { viewer: Viewer }) {
  return (
    <Suspense fallback={<NotificationBell inbox={EMPTY_INBOX} />}>
      <InboxBell viewer={viewer} />
    </Suspense>
  );
}

export function ShellAccount({ viewer }: { viewer: Viewer }) {
  return (
    <Suspense fallback={<AccountMenu viewer={viewer} avatarUrl={null} />}>
      <AccountFace viewer={viewer} />
    </Suspense>
  );
}
