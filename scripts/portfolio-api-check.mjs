// Chunk 2 — direct API permission check.
//
// pgTAP proves the database rules. This proves the same rules survive the
// PostgREST layer: real accounts, real access tokens, real HTTP requests, no
// interface involved. It creates its own accounts and data and removes them
// again.
//
// Local only. It refuses to run against a hosted Supabase project because it
// writes data and deletes accounts.
//
//   npx supabase start && npm run test:api

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const ID = {
  owner: "70000000-0000-4000-8000-000000000001",
  assigned: "70000000-0000-4000-8000-000000000002",
  unassigned: "70000000-0000-4000-8000-000000000003",
  finance: "70000000-0000-4000-8000-000000000004",
  clientA: "71000000-0000-4000-8000-000000000001",
  clientB: "71000000-0000-4000-8000-000000000002",
  projectAssigned: "72000000-0000-4000-8000-000000000001",
  projectOwnerOnly: "72000000-0000-4000-8000-000000000002",
  projectArchived: "72000000-0000-4000-8000-000000000003",
  week: "73000000-0000-4000-8000-000000000001",
  itemDone: "74000000-0000-4000-8000-000000000001",
  itemOpen: "74000000-0000-4000-8000-000000000002",
};

const PASSWORD = `Chunk2-${randomUUID()}`;
const results = [];
let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    results.push(`  ok   ${name}`);
  } else {
    failures += 1;
    results.push(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// Seeding runs as postgres inside the local database container rather than
// through the service role. The service role deliberately has no privileges on
// the internal tables, so even a leaked service key cannot read them — that is
// worth keeping, so the harness does not grant itself a way around it.
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
    console.error("No local Supabase database container. Run `npx supabase start`.");
    process.exit(1);
  }
  return name;
}

function sql(statement) {
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      DB_CONTAINER,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-q",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-c",
      statement,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
}

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

async function api(path, { token, key, method = "GET", body, prefer } = {}) {
  const headers = { apikey: key, Authorization: `Bearer ${token ?? key}` };
  if (body) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, ok: response.ok, data };
}

const DB_CONTAINER = dbContainer();
const env = readLocalEnv();
const BASE = env.API_URL ?? "http://127.0.0.1:54321";
const SECRET = env.SERVICE_ROLE_KEY;
const PUBLISHABLE = env.ANON_KEY;

if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(BASE)) {
  console.error(`Refusing to run against a non-local API URL: ${BASE}`);
  process.exit(1);
}
if (!SECRET || !PUBLISHABLE) {
  console.error("Could not read local Supabase keys. Run `npx supabase start`.");
  process.exit(1);
}

const admin = (path, options) => api(path, { key: SECRET, ...options });

async function createUser(id, email, role, fullName) {
  const created = await admin("/auth/v1/admin/users", {
    method: "POST",
    body: {
      id,
      email,
      password: PASSWORD,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { full_name: fullName },
    },
  });
  if (!created.ok) {
    throw new Error(
      `Could not create ${email}: ${JSON.stringify(created.data)}`,
    );
  }
}

async function signIn(email) {
  const response = await api("/auth/v1/token?grant_type=password", {
    key: PUBLISHABLE,
    method: "POST",
    body: { email, password: PASSWORD },
  });
  if (!response.ok) {
    throw new Error(`Could not sign in ${email}: ${JSON.stringify(response.data)}`);
  }
  return response.data.access_token;
}

async function seed() {
  await createUser(ID.owner, "chunk2-api-owner@gamma.test", "owner", "API Owner");
  await createUser(
    ID.assigned,
    "chunk2-api-assigned@gamma.test",
    "member",
    "API Assigned",
  );
  await createUser(
    ID.unassigned,
    "chunk2-api-unassigned@gamma.test",
    "member",
    "API Unassigned",
  );
  await createUser(
    ID.finance,
    "chunk2-api-finance@gamma.test",
    "finance",
    "API Finance",
  );

  // GoTrue writes custom app_metadata after the row is inserted, so the profile
  // trigger has already defaulted every new account to 'member'. The platform
  // role is set on the profile afterwards — the same thing an owner does when
  // they onboard somebody.
  sql(`
    update public.app_profiles set role = 'owner' where id = '${ID.owner}';
    update public.app_profiles set role = 'finance' where id = '${ID.finance}';
  `);

  sql(`
    insert into public.app_clients (id, name) values
      ('${ID.clientA}', 'API Northstar'),
      ('${ID.clientB}', 'API Cedar');

    insert into public.app_projects
      (id, client_id, name, status, lead_id, starts_on, due_on, created_by, archived_at)
    values
      ('${ID.projectAssigned}', '${ID.clientA}', 'API Assigned Platform', 'building',
       '${ID.assigned}', current_date - 14, current_date + 30, '${ID.owner}', null),
      ('${ID.projectOwnerOnly}', '${ID.clientB}', 'API Owner Only Launch', 'review',
       '${ID.owner}', current_date - 40, current_date + 60, '${ID.owner}', null),
      ('${ID.projectArchived}', '${ID.clientA}', 'API Archived Rebuild', 'closed',
       null, current_date - 400, current_date - 200, '${ID.owner}', now());

    insert into public.app_project_financials
      (project_id, value_amount, value_currency, exchange_rate_to_pkr, booked_on)
    values ('${ID.projectAssigned}', 18000, 'USD', 280, current_date);

    insert into public.app_project_members
      (project_id, profile_id, responsibility, added_by)
    values ('${ID.projectAssigned}', '${ID.assigned}', 'Delivery engineer', '${ID.owner}');

    insert into public.app_milestone_weeks (id, project_id, week_number, starts_on, due_on)
    values ('${ID.week}', '${ID.projectAssigned}', 1, current_date - 6, current_date + 1);

    insert into public.app_milestone_items
      (id, milestone_week_id, label, is_done, completed_at, completed_by)
    values
      ('${ID.itemDone}', '${ID.week}', 'API finished item', true, now(), '${ID.owner}'),
      ('${ID.itemOpen}', '${ID.week}', 'API open item', false, null, null);
  `);
}

async function cleanup() {
  sql(`
    delete from public.app_milestone_items
      where id in ('${ID.itemDone}', '${ID.itemOpen}');
    delete from public.app_milestone_weeks where id = '${ID.week}';
    delete from public.app_project_members where project_id = '${ID.projectAssigned}';
    delete from public.app_project_financials where project_id = '${ID.projectAssigned}';
    delete from public.app_projects
      where id in ('${ID.projectAssigned}', '${ID.projectOwnerOnly}', '${ID.projectArchived}');
    delete from public.app_clients where id in ('${ID.clientA}', '${ID.clientB}');
    delete from public.app_profiles
      where id in ('${ID.owner}', '${ID.assigned}', '${ID.unassigned}', '${ID.finance}');
  `);

  for (const id of [ID.owner, ID.assigned, ID.unassigned, ID.finance]) {
    await admin(`/auth/v1/admin/users/${id}`, { method: "DELETE" });
  }
}

function portfolio(token, body = {}) {
  return api("/rest/v1/rpc/app_project_portfolio", {
    key: PUBLISHABLE,
    token,
    method: "POST",
    body,
  });
}

function hasMoneyKey(rows) {
  return rows.some((row) =>
    Object.keys(row).some((key) => /value|amount|price|salary/i.test(key)),
  );
}

/**
 * Owner responses legitimately contain every project in the database, which on
 * a working environment includes real or demo data. Owner assertions therefore
 * count only the rows this harness created.
 */
const HARNESS_PROJECTS = new Set([
  ID.projectAssigned,
  ID.projectOwnerOnly,
  ID.projectArchived,
]);

function ours(response) {
  return (response.data ?? []).filter((row) => HARNESS_PROJECTS.has(row.id));
}

async function run() {
  // Clear anything a previous interrupted run left behind. The profile row has
  // to go before the auth user, because the platform never permits a cascade
  // delete of an account that still owns records.
  await cleanup();
  await seed();

  const ownerToken = await signIn("chunk2-api-owner@gamma.test");
  const memberToken = await signIn("chunk2-api-assigned@gamma.test");
  const strangerToken = await signIn("chunk2-api-unassigned@gamma.test");
  const financeToken = await signIn("chunk2-api-finance@gamma.test");

  // Owner ------------------------------------------------------------------
  const ownerRows = await portfolio(ownerToken);
  check("owner receives every active project", ours(ownerRows).length === 2,
    `got ${ours(ownerRows).length}`);

  const ownerArchived = await portfolio(ownerToken, { include_archived: true });
  check("owner can request archived projects", ours(ownerArchived).length === 3,
    `got ${ours(ownerArchived).length}`);

  check(
    "the portfolio response carries no money field for anyone",
    !hasMoneyKey(ownerRows.data ?? []),
  );

  const ownerProject = ours(ownerRows).find(
    (row) => row.id === ID.projectAssigned,
  );
  check("milestone progress is aggregated server-side",
    ownerProject?.total_items === 2 && ownerProject?.done_items === 1,
    JSON.stringify(ownerProject));

  const ownerSearch = await portfolio(ownerToken, { search_text: "api cedar" });
  check("search matches the client name over the API",
    ownerSearch.data?.length === 1, `got ${ownerSearch.data?.length}`);

  const ownerStatus = await portfolio(ownerToken, {
    filter_statuses: ["review"],
  });
  check("status filter is applied by the database",
    ours(ownerStatus).length === 1 &&
      ours(ownerStatus)[0]?.id === ID.projectOwnerOnly,
    `got ${ours(ownerStatus).length}`);

  const ownerValue = await api(
    `/rest/v1/app_project_financials?select=value_amount&project_id=eq.${ID.projectAssigned}`,
    { key: PUBLISHABLE, token: ownerToken },
  );
  check("owner can still read project value from the financial table",
    ownerValue.data?.length === 1, JSON.stringify(ownerValue.data));

  // Assigned member --------------------------------------------------------
  const memberRows = await portfolio(memberToken);
  check("member receives only assigned projects", memberRows.data?.length === 1,
    `got ${memberRows.data?.length}`);
  check("member portfolio row is the assigned project",
    memberRows.data?.[0]?.id === ID.projectAssigned);
  check("member portfolio response contains no money field",
    !hasMoneyKey(memberRows.data ?? []));

  const memberArchived = await portfolio(memberToken, {
    include_archived: true,
  });
  check("member asking for archived rows still receives only their own",
    memberArchived.data?.length === 1, `got ${memberArchived.data?.length}`);

  const memberOtherPerson = await portfolio(memberToken, {
    filter_person_id: ID.owner,
  });
  check("member filtering by another person cannot widen their access",
    memberOtherPerson.data?.length === 0,
    `got ${memberOtherPerson.data?.length}`);

  const memberValue = await api(
    "/rest/v1/app_project_financials?select=*",
    { key: PUBLISHABLE, token: memberToken },
  );
  check("member reading the financial table directly gets nothing",
    Array.isArray(memberValue.data) && memberValue.data.length === 0,
    JSON.stringify(memberValue.data));

  const memberGuessesUrl = await api(
    `/rest/v1/app_projects?select=*&id=eq.${ID.projectOwnerOnly}`,
    { key: PUBLISHABLE, token: memberToken },
  );
  check("member guessing an unassigned project id gets nothing",
    Array.isArray(memberGuessesUrl.data) && memberGuessesUrl.data.length === 0,
    JSON.stringify(memberGuessesUrl.data));

  // Unassigned member and finance -------------------------------------------
  const strangerRows = await portfolio(strangerToken);
  check("unassigned member receives no projects",
    strangerRows.data?.length === 0, `got ${strangerRows.data?.length}`);

  const financeRows = await portfolio(financeToken);
  check("finance receives no operational project workspace",
    financeRows.data?.length === 0, `got ${financeRows.data?.length}`);

  // Anonymous ---------------------------------------------------------------
  const anonRpc = await portfolio(undefined);
  check("anonymous callers cannot execute the portfolio function",
    !anonRpc.ok, `status ${anonRpc.status}`);

  const anonTable = await api("/rest/v1/app_projects?select=*", {
    key: PUBLISHABLE,
  });
  check("anonymous callers cannot read internal project rows",
    !anonTable.ok || (Array.isArray(anonTable.data) && !anonTable.data.length),
    JSON.stringify(anonTable.data));

  const anonFinancials = await api("/rest/v1/app_project_financials?select=*", {
    key: PUBLISHABLE,
  });
  check("anonymous callers cannot read project value",
    !anonFinancials.ok ||
      (Array.isArray(anonFinancials.data) && !anonFinancials.data.length),
    JSON.stringify(anonFinancials.data));
}

try {
  await run();
} catch (error) {
  failures += 1;
  results.push(`  FAIL harness — ${error.message}`);
} finally {
  await cleanup().catch((error) => {
    console.error(`Cleanup warning: ${error.message}`);
  });
}

console.log("\nChunk 2 — direct API permission check\n");
console.log(results.join("\n"));
console.log(
  `\n${results.length - failures}/${results.length} checks passed.\n`,
);
process.exit(failures ? 1 : 0);
