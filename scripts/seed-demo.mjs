import { execFileSync } from "node:child_process";

const PASSWORD = "Demo-12345678";

const ACCOUNTS = [
  {
    id: "d0f00000-0000-4000-8000-000000000001",
    email: "demo.owner@gamma.test",
    name: "Ghulam Mustafa",
    role: "owner",
  },
  {
    id: "d0f00000-0000-4000-8000-000000000002",
    email: "demo.member1@gamma.test",
    name: "Hamna Khan",
    role: "member",
  },
  {
    id: "d0f00000-0000-4000-8000-000000000003",
    email: "demo.member2@gamma.test",
    name: "Abubakar Ali",
    role: "member",
  },
];

function readLocalEnv() {
  const raw = execFileSync("npx", ["supabase", "status", "-o", "env"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const env = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function dbContainer() {
  const name = execFileSync(
    "docker",
    ["ps", "--filter", "name=supabase_db_", "--format", "{{.Names}}"],
    { encoding: "utf8" },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)[0];

  if (!name) {
    console.error("No local database container. Run `npx supabase start`.");
    process.exit(1);
  }
  return name;
}

function psql(args, input) {
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      DB,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-q",
      "-U",
      "postgres",
      "-d",
      "postgres",
      ...args,
    ],
    { encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] },
  );
}

const env = readLocalEnv();
const BASE = env.API_URL ?? "http://127.0.0.1:54321";
const SECRET = env.SERVICE_ROLE_KEY;

if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(BASE)) {
  console.error(`Refusing to seed a non-local database: ${BASE}`);
  process.exit(1);
}
if (!SECRET) {
  console.error("Could not read the local keys. Run `npx supabase start`.");
  process.exit(1);
}

const DB = dbContainer();

for (const account of ACCOUNTS) {
  const response = await fetch(`${BASE}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SECRET,
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: account.id,
      email: account.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: account.name },
    }),
  });

  if (!response.ok && response.status !== 422) {
    console.error(
      `Could not create ${account.email}: ${await response.text()}`,
    );
    process.exit(1);
  }
}

psql([
  "-c",
  `update public.app_profiles set role = 'owner' where id = '${ACCOUNTS[0].id}';`,
]);

const seed = execFileSync("cat", ["supabase/demo-projects.sql"], {
  encoding: "utf8",
});
const output = psql(["-f", "-"], seed);

console.log(output.trim());
console.log("\nDemo data loaded. Sign in at http://localhost:3000/login\n");
for (const account of ACCOUNTS) {
  console.log(`  ${account.role.padEnd(6)}  ${account.email}  ${PASSWORD}`);
}
console.log("\nThings to try:");
console.log("  Cedar Analytics Launch  → Team tab, restore Abubakar");
console.log(
  "  Northstar Operations    → Milestones, restore Week 5 and 2 items",
);
console.log(
  "  Meridian Loyalty        → Overview, all the missing-info prompts",
);
console.log(
  "  Brightline Legacy       → turn on the Archived filter to find it\n",
);
