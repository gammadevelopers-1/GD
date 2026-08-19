import "server-only";

type AdminConfig = { url: string; key: string };

function config(): AdminConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

export function adminConfigured() {
  return config() !== null;
}

async function call(
  path: string,
  init: { method: string; body?: unknown },
): Promise<{ ok: true; data: unknown } | { ok: false; message: string }> {
  const settings = config();
  if (!settings) {
    return {
      ok: false,
      message:
        "SUPABASE_SECRET_KEY is not set, so client accounts cannot be created.",
    };
  }

  try {
    const response = await fetch(`${settings.url}${path}`, {
      method: init.method,
      headers: {
        apikey: settings.key,
        Authorization: `Bearer ${settings.key}`,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (data as { msg?: string; message?: string } | null)?.msg ??
        (data as { message?: string } | null)?.message ??
        `Auth returned ${response.status}.`;
      return { ok: false, message };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, message: "The auth service could not be reached." };
  }
}

export async function createClientAuthUser(input: {
  email: string;
  fullName: string;
  password: string;
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const result = await call("/auth/v1/admin/users", {
    method: "POST",
    body: {
      email: input.email,
      password: input.password,
      email_confirm: true,
      app_metadata: { role: "client" },
      user_metadata: { full_name: input.fullName },
    },
  });

  if (!result.ok) return result;

  const id = (result.data as { id?: string } | null)?.id;
  if (!id) return { ok: false, message: "Auth did not return an account id." };
  return { ok: true, id };
}

export async function setAuthPassword(
  userId: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const result = await call(`/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    body: { password },
  });
  return result.ok ? { ok: true } : result;
}

export async function deleteAuthUser(userId: string) {
  await call(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
}

export async function signStoragePaths(
  bucket: string,
  paths: string[],
  expiresIn = 60 * 60,
): Promise<Record<string, string>> {
  const settings = config();
  if (!settings || !paths.length) return {};

  const result = await call(`/storage/v1/object/sign/${bucket}`, {
    method: "POST",
    body: { expiresIn, paths },
  });

  if (!result.ok || !Array.isArray(result.data)) return {};

  const signed: Record<string, string> = {};
  for (const entry of result.data as Array<{
    path?: string | null;
    signedURL?: string | null;
  }>) {
    if (entry?.path && entry.signedURL) {
      signed[entry.path] = `${settings.url}/storage/v1${entry.signedURL}`;
    }
  }
  return signed;
}
