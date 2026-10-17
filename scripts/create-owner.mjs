/**
 * Create an owner (superadmin) account.
 *
 *   npm run create:owner -- someone@example.com
 *
 * The password is read from stdin, not from the arguments, so it never lands
 * in your shell history. SUPABASE_SECRET_KEY is read from the environment or
 * .env and never printed.
 *
 * The role is set through app_metadata, because private.handle_new_auth_user()
 * reads it from there when it creates the matching app_profiles row. Creating
 * the user any other way — the dashboard's "Add user", for instance — gets you
 * a 'member', and you then have to fix the role by hand.
 */
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

function fromEnvFile(key) {
  for (const file of [".env.local", ".env"]) {
    try {
      const match = readFileSync(file, "utf8").match(
        new RegExp(`^${key}=(.*)$`, "m"),
      );
      const value = match?.[1]?.trim().replace(/^["']|["']$/g, "");
      if (value) return value;
    } catch {
      // No such file. Try the next one.
    }
  }
  return "";
}

function need(key) {
  const value = process.env[key]?.trim() || fromEnvFile(key);
  if (!value) {
    console.error(`Missing ${key}. Put it in .env or export it, then retry.`);
    process.exit(1);
  }
  return value;
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const output = rl.output;
    let shown = false;
    // Echo nothing back while the password is typed.
    output.write(question);
    const onData = (chunk) => {
      if (!shown) output.write("\u001b[2K\u001b[G" + question);
      shown = true;
      void chunk;
    };
    process.stdin.on("data", onData);
    rl.question("", (answer) => {
      process.stdin.off("data", onData);
      output.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

const email = process.argv[2]?.trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage: npm run create:owner -- someone@example.com");
  process.exit(1);
}

const url = need("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
const secret = need("SUPABASE_SECRET_KEY");

const password = (await askHidden(`Password for ${email}: `)).trim();
if (password.length < 10) {
  console.error("Use at least 10 characters.");
  process.exit(1);
}

const fullName = process.argv[3]?.trim() || email.split("@")[0];

const response = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    apikey: secret,
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "owner" },
    user_metadata: { full_name: fullName },
  }),
});

const body = await response.json().catch(() => null);

if (!response.ok) {
  console.error(`Failed (${response.status}):`, body?.msg || body?.message || body);
  process.exit(1);
}

console.log(`Created owner ${email}`);
console.log(`  auth id: ${body?.id}`);
console.log("");
console.log("Check the profile row picked up the role:");
console.log(
  `  select id, full_name, role from public.app_profiles where id = '${body?.id}';`,
);
