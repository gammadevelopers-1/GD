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
  credential: "75000000-0000-4000-8000-000000000001",
  envGroup: "76000000-0000-4000-8000-000000000001",
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
    console.error(
      "No local Supabase database container. Run `npx supabase start`.",
    );
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
  console.error(
    "Could not read local Supabase keys. Run `npx supabase start`.",
  );
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
    throw new Error(
      `Could not sign in ${email}: ${JSON.stringify(response.data)}`,
    );
  }
  return response.data.access_token;
}

async function seed() {
  await createUser(
    ID.owner,
    "chunk2-api-owner@gamma.test",
    "owner",
    "API Owner",
  );
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
    values ('${ID.projectAssigned}', '${ID.assigned}', 'Delivery engineer', '${ID.owner}')
    on conflict (project_id, profile_id) do update
      set responsibility = excluded.responsibility, archived_at = null;

    insert into public.app_milestone_weeks (id, project_id, week_number, starts_on, due_on)
    values ('${ID.week}', '${ID.projectAssigned}', 1, current_date - 6, current_date + 1);

    insert into public.app_milestone_cards
      (id, milestone_week_id, board, status, title, completed_at, created_by)
    values
      ('${ID.itemDone}', '${ID.week}', 'work', 'completed',
       'API finished item', now(), '${ID.owner}'),
      ('${ID.itemOpen}', '${ID.week}', 'idea', 'idea',
       'API open item', null, '${ID.owner}');
  `);
}

async function cleanup() {
  sql(`
    delete from public.app_milestone_cards
      where milestone_week_id = '${ID.week}';
    delete from public.app_milestone_weeks where id = '${ID.week}';
    delete from public.app_project_members
      where project_id in ('${ID.projectAssigned}', '${ID.projectOwnerOnly}', '${ID.projectArchived}');
    delete from public.app_project_financials
      where project_id in ('${ID.projectAssigned}', '${ID.projectOwnerOnly}', '${ID.projectArchived}');
    delete from public.app_project_technical_details
      where project_id in ('${ID.projectAssigned}', '${ID.projectOwnerOnly}', '${ID.projectArchived}');
    delete from public.app_audit_logs
      where resource_type = 'credential' and resource_id = '${ID.credential}';
    delete from public.app_credential_grants where credential_id = '${ID.credential}';
    delete from public.app_credential_secrets where credential_id = '${ID.credential}';
    delete from public.app_project_credentials where id = '${ID.credential}';
    delete from public.app_env_groups where id = '${ID.envGroup}';
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

const HARNESS_PROJECTS = new Set([
  ID.projectAssigned,
  ID.projectOwnerOnly,
  ID.projectArchived,
]);

function ours(response) {
  return (response.data ?? []).filter((row) => HARNESS_PROJECTS.has(row.id));
}

async function run() {
  await cleanup();
  await seed();

  const ownerToken = await signIn("chunk2-api-owner@gamma.test");
  const memberToken = await signIn("chunk2-api-assigned@gamma.test");
  const strangerToken = await signIn("chunk2-api-unassigned@gamma.test");
  const financeToken = await signIn("chunk2-api-finance@gamma.test");

  const ownerRows = await portfolio(ownerToken);
  check(
    "owner receives every active project",
    ours(ownerRows).length === 2,
    `got ${ours(ownerRows).length}`,
  );

  const ownerArchived = await portfolio(ownerToken, { include_archived: true });
  check(
    "owner can request archived projects",
    ours(ownerArchived).length === 3,
    `got ${ours(ownerArchived).length}`,
  );

  check(
    "the portfolio response carries no money field for anyone",
    !hasMoneyKey(ownerRows.data ?? []),
  );

  const ownerProject = ours(ownerRows).find(
    (row) => row.id === ID.projectAssigned,
  );
  check(
    "milestone progress is aggregated server-side",
    ownerProject?.total_items === 2 && ownerProject?.done_items === 1,
    JSON.stringify(ownerProject),
  );

  const ownerSearch = await portfolio(ownerToken, { search_text: "api cedar" });
  check(
    "search matches the client name over the API",
    ownerSearch.data?.length === 1,
    `got ${ownerSearch.data?.length}`,
  );

  const ownerStatus = await portfolio(ownerToken, {
    filter_statuses: ["review"],
  });
  check(
    "status filter is applied by the database",
    ours(ownerStatus).length === 1 &&
      ours(ownerStatus)[0]?.id === ID.projectOwnerOnly,
    `got ${ours(ownerStatus).length}`,
  );

  const ownerValue = await api(
    `/rest/v1/app_project_financials?select=value_amount&project_id=eq.${ID.projectAssigned}`,
    { key: PUBLISHABLE, token: ownerToken },
  );
  check(
    "owner can still read project value from the financial table",
    ownerValue.data?.length === 1,
    JSON.stringify(ownerValue.data),
  );

  const memberRows = await portfolio(memberToken);
  check(
    "member receives only assigned projects",
    memberRows.data?.length === 1,
    `got ${memberRows.data?.length}`,
  );
  check(
    "member portfolio row is the assigned project",
    memberRows.data?.[0]?.id === ID.projectAssigned,
  );
  check(
    "member portfolio response contains no money field",
    !hasMoneyKey(memberRows.data ?? []),
  );

  const memberArchived = await portfolio(memberToken, {
    include_archived: true,
  });
  check(
    "member asking for archived rows still receives only their own",
    memberArchived.data?.length === 1,
    `got ${memberArchived.data?.length}`,
  );

  const memberOtherPerson = await portfolio(memberToken, {
    filter_person_id: ID.owner,
  });
  check(
    "member filtering by another person cannot widen their access",
    memberOtherPerson.data?.length === 0,
    `got ${memberOtherPerson.data?.length}`,
  );

  const memberValue = await api("/rest/v1/app_project_financials?select=*", {
    key: PUBLISHABLE,
    token: memberToken,
  });
  check(
    "member reading the financial table directly gets nothing",
    Array.isArray(memberValue.data) && memberValue.data.length === 0,
    JSON.stringify(memberValue.data),
  );

  const memberGuessesUrl = await api(
    `/rest/v1/app_projects?select=*&id=eq.${ID.projectOwnerOnly}`,
    { key: PUBLISHABLE, token: memberToken },
  );
  check(
    "member guessing an unassigned project id gets nothing",
    Array.isArray(memberGuessesUrl.data) && memberGuessesUrl.data.length === 0,
    JSON.stringify(memberGuessesUrl.data),
  );

  const strangerRows = await portfolio(strangerToken);
  check(
    "unassigned member receives no projects",
    strangerRows.data?.length === 0,
    `got ${strangerRows.data?.length}`,
  );

  const financeRows = await portfolio(financeToken);
  check(
    "finance receives no operational project workspace",
    financeRows.data?.length === 0,
    `got ${financeRows.data?.length}`,
  );

  const memberCreates = await api("/rest/v1/app_projects", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: {
      client_id: ID.clientA,
      name: "Created by a member",
      created_by: ID.assigned,
    },
  });
  check(
    "member cannot create a project over the API",
    !memberCreates.ok,
    `status ${memberCreates.status}`,
  );

  await api(`/rest/v1/app_projects?id=eq.${ID.projectAssigned}`, {
    key: PUBLISHABLE,
    token: memberToken,
    method: "PATCH",
    body: { name: "Renamed by a member" },
  });
  const afterMemberPatch = await portfolio(memberToken);
  check(
    "member cannot rename a project they are assigned to",
    afterMemberPatch.data?.[0]?.name === "API Assigned Platform",
    afterMemberPatch.data?.[0]?.name,
  );

  const memberAudits = await api("/rest/v1/rpc/app_record_project_event", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: {
      target_project_id: ID.projectAssigned,
      action_name: "project.archived",
      event_metadata: {},
    },
  });
  check(
    "member cannot write to the audit log",
    !memberAudits.ok,
    `status ${memberAudits.status}`,
  );

  await api(`/rest/v1/app_projects?id=eq.${ID.projectAssigned}`, {
    key: PUBLISHABLE,
    token: ownerToken,
    method: "PATCH",
    body: { archived_at: new Date().toISOString() },
  });
  const afterArchive = await portfolio(memberToken);
  check(
    "archiving removes member access immediately",
    afterArchive.data?.length === 0,
    `got ${afterArchive.data?.length}`,
  );

  await api(`/rest/v1/app_projects?id=eq.${ID.projectAssigned}`, {
    key: PUBLISHABLE,
    token: ownerToken,
    method: "PATCH",
    body: { archived_at: null },
  });
  const afterRestore = await portfolio(memberToken);
  check(
    "restoring gives member access back",
    afterRestore.data?.length === 1,
    `got ${afterRestore.data?.length}`,
  );

  const ownerAdds = await api("/rest/v1/app_project_members", {
    key: PUBLISHABLE,
    token: ownerToken,
    method: "POST",
    body: {
      project_id: ID.projectAssigned,
      profile_id: ID.unassigned,
      responsibility: "Added over the API",
      added_by: ID.owner,
    },
  });
  check(
    "owner can add someone to a project",
    ownerAdds.ok,
    `status ${ownerAdds.status}`,
  );

  const strangerAfterAdd = await portfolio(strangerToken);
  check(
    "being added grants the project immediately",
    strangerAfterAdd.data?.length === 1,
    `got ${strangerAfterAdd.data?.length}`,
  );

  const memberAdds = await api("/rest/v1/app_project_members", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: {
      project_id: ID.projectAssigned,
      profile_id: ID.finance,
      responsibility: "Added by a member",
      added_by: ID.assigned,
    },
  });
  check(
    "member cannot add anyone to a project",
    !memberAdds.ok,
    `status ${memberAdds.status}`,
  );

  await api(
    `/rest/v1/app_project_members?project_id=eq.${ID.projectAssigned}&profile_id=eq.${ID.unassigned}`,
    {
      key: PUBLISHABLE,
      token: ownerToken,
      method: "PATCH",
      body: { archived_at: new Date().toISOString(), archived_by: ID.owner },
    },
  );
  const strangerAfterRemoval = await portfolio(strangerToken);
  check(
    "removing someone revokes access on their next request",
    strangerAfterRemoval.data?.length === 0,
    `got ${strangerAfterRemoval.data?.length}`,
  );

  const leadMovesCard = await api(
    "/rest/v1/rpc/app_set_milestone_card_status",
    {
      key: PUBLISHABLE,
      token: memberToken,
      method: "POST",
      body: {
        target_card_id: ID.itemOpen,
        next_status: "completed",
        reason: null,
      },
    },
  );
  check(
    "the project lead can move a card",
    leadMovesCard.ok,
    `status ${leadMovesCard.status}`,
  );

  const memberReadsBoard = await api(
    `/rest/v1/app_milestone_cards?select=id,title&milestone_week_id=eq.${ID.week}`,
    { key: PUBLISHABLE, token: memberToken },
  );
  check(
    "an assigned member can read the board",
    memberReadsBoard.ok && (memberReadsBoard.data?.length ?? 0) > 0,
    `status ${memberReadsBoard.status}`,
  );

  sql(
    `update public.app_projects set lead_id = null where id = '${ID.projectAssigned}';`,
  );

  const exLeadAddsCard = await api("/rest/v1/app_milestone_cards", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: {
      milestone_week_id: ID.week,
      board: "idea",
      status: "idea",
      title: "Added by a plain member",
      created_by: ID.assigned,
    },
  });
  check(
    "a member who is not the lead cannot add a card",
    !exLeadAddsCard.ok,
    `status ${exLeadAddsCard.status}`,
  );

  const memberMovesCard = await api(
    "/rest/v1/rpc/app_set_milestone_card_status",
    {
      key: PUBLISHABLE,
      token: memberToken,
      method: "POST",
      body: {
        target_card_id: ID.itemDone,
        next_status: "in_progress",
        reason: null,
      },
    },
  );
  check(
    "an assigned member can change a task's status",
    memberMovesCard.ok,
    `status ${memberMovesCard.status}`,
  );

  const memberReorders = await api("/rest/v1/rpc/app_reorder_milestone_cards", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: {
      target_week_id: ID.week,
      target_board: "idea",
      ordered_ids: [ID.itemOpen],
    },
  });
  check(
    "a member who is not the lead cannot reorder the board",
    !memberReorders.ok,
    `status ${memberReorders.status}`,
  );

  await api(`/rest/v1/app_milestone_cards?id=eq.${ID.itemOpen}`, {
    key: PUBLISHABLE,
    token: memberToken,
    method: "PATCH",
    body: { title: "Patched by a member" },
  });
  const afterPatch = await api(
    `/rest/v1/app_milestone_cards?select=title&id=eq.${ID.itemOpen}`,
    { key: PUBLISHABLE, token: memberToken },
  );
  check(
    "member cannot patch a card directly",
    afterPatch.data?.[0]?.title === "API open item",
    `title is ${afterPatch.data?.[0]?.title}`,
  );

  const memberPlansWeek = await api("/rest/v1/app_milestone_weeks", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: {
      project_id: ID.projectAssigned,
      week_number: 9,
      due_on: new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10),
    },
  });
  check(
    "member cannot plan a milestone week",
    !memberPlansWeek.ok,
    `status ${memberPlansWeek.status}`,
  );

  const saveTechnical = (token, overrides = {}) =>
    api("/rest/v1/rpc/app_save_technical_details", {
      key: PUBLISHABLE,
      token,
      method: "POST",
      body: {
        target_project_id: ID.projectAssigned,
        new_repository_url: "https://github.com/gamma/api-check",
        new_live_domain: "api-check.test",
        new_stack_notes: "Next.js and Supabase.",
        ...overrides,
      },
    });

  const memberSavesTechnical = await saveTechnical(memberToken);
  check(
    "assigned member can save non-sensitive technical details",
    memberSavesTechnical.ok,
    `status ${memberSavesTechnical.status}`,
  );

  const memberReadsTechnical = await api(
    `/rest/v1/app_project_technical_details?select=repository_url&project_id=eq.${ID.projectAssigned}`,
    { key: PUBLISHABLE, token: memberToken },
  );
  check(
    "assigned member can read the technical details back",
    memberReadsTechnical.ok && memberReadsTechnical.data?.length === 1,
    JSON.stringify(memberReadsTechnical.data),
  );

  const memberPatchesTechnical = await api(
    `/rest/v1/app_project_technical_details?project_id=eq.${ID.projectAssigned}`,
    {
      key: PUBLISHABLE,
      token: memberToken,
      method: "PATCH",
      body: { stack_notes: "written directly" },
    },
  );
  check(
    "nobody can PATCH technical details directly — the RPC is the write path",
    !memberPatchesTechnical.ok,
    `status ${memberPatchesTechnical.status}`,
  );

  const secretRejected = await saveTechnical(memberToken, {
    new_repository_url: "postgresql://admin:hunter2@db.example.com:5432/app",
  });
  check(
    "a database connection string is rejected from technical details",
    !secretRejected.ok,
    `status ${secretRejected.status}`,
  );

  const strangerReadsTechnical = await api(
    "/rest/v1/app_project_technical_details?select=*",
    { key: PUBLISHABLE, token: strangerToken },
  );
  check(
    "unassigned member cannot read technical details",
    strangerReadsTechnical.ok &&
      Array.isArray(strangerReadsTechnical.data) &&
      !strangerReadsTechnical.data.length,
    JSON.stringify(strangerReadsTechnical.data),
  );

  const strangerSavesTechnical = await saveTechnical(strangerToken);
  check(
    "unassigned member cannot write technical details",
    !strangerSavesTechnical.ok,
    `status ${strangerSavesTechnical.status}`,
  );

  const financeReadsTechnical = await api(
    "/rest/v1/app_project_technical_details?select=*",
    { key: PUBLISHABLE, token: financeToken },
  );
  check(
    "finance cannot read technical details",
    financeReadsTechnical.ok &&
      Array.isArray(financeReadsTechnical.data) &&
      !financeReadsTechnical.data.length,
    JSON.stringify(financeReadsTechnical.data),
  );

  const anonTechnical = await api(
    "/rest/v1/app_project_technical_details?select=*",
    { key: PUBLISHABLE },
  );
  check(
    "anonymous callers cannot read technical details",
    !anonTechnical.ok ||
      (Array.isArray(anonTechnical.data) && !anonTechnical.data.length),
    JSON.stringify(anonTechnical.data),
  );

  const credentialId = ID.credential;
  const readSecret = (token) =>
    api("/rest/v1/rpc/app_read_credential_secret", {
      key: PUBLISHABLE,
      token,
      method: "POST",
      body: { target_credential_id: credentialId },
    });
  const firstRow = (result) =>
    Array.isArray(result.data) ? result.data[0] : result.data;

  const ownerCreatesGroup = await api("/rest/v1/app_env_groups", {
    key: PUBLISHABLE,
    token: ownerToken,
    method: "POST",
    body: {
      id: ID.envGroup,
      project_id: ID.projectAssigned,
      name: "API check group",
      created_by: ID.owner,
    },
  });
  check(
    "owner can create a group",
    ownerCreatesGroup.ok,
    `status ${ownerCreatesGroup.status}`,
  );

  const ownerCreates = await api("/rest/v1/rpc/app_create_credential", {
    key: PUBLISHABLE,
    token: ownerToken,
    method: "POST",
    body: {
      new_id: credentialId,
      target_project_id: ID.projectAssigned,
      new_name: "API_CHECK_KEY",
      new_service: null,
      new_environment: "other",
      new_description: null,
      new_ciphertext: "Y2lwaGVydGV4dA==",
      new_nonce: "bm9uY2U=",
      new_auth_tag: "dGFn",
      new_key_version: 1,
      target_env_group_id: ID.envGroup,
    },
  });
  check(
    "owner can store a variable",
    ownerCreates.ok,
    `status ${ownerCreates.status}`,
  );

  const memberSeesName = await api(
    `/rest/v1/app_project_credentials?select=name&id=eq.${credentialId}`,
    { key: PUBLISHABLE, token: memberToken },
  );
  check(
    "being on the project does not reveal a variable",
    memberSeesName.ok && memberSeesName.data?.length === 0,
    JSON.stringify(memberSeesName.data),
  );

  const memberReadsTable = await api(
    "/rest/v1/app_credential_secrets?select=*",
    { key: PUBLISHABLE, token: memberToken },
  );
  check(
    "no signed-in role can read the encrypted values table",
    !memberReadsTable.ok,
    `status ${memberReadsTable.status}`,
  );

  const memberWithoutGrant = await readSecret(memberToken);
  check(
    "being on the project does not grant the secret",
    memberWithoutGrant.ok && firstRow(memberWithoutGrant)?.allowed === false,
    JSON.stringify(memberWithoutGrant.data),
  );

  const memberGrantsItself = await api(
    "/rest/v1/rpc/app_grant_credential_access",
    {
      key: PUBLISHABLE,
      token: memberToken,
      method: "POST",
      body: {
        target_credential_id: credentialId,
        target_profile_id: ID.assigned,
        access_level: "manage",
      },
    },
  );
  check(
    "a member cannot grant themselves a variable",
    !memberGrantsItself.ok,
    `status ${memberGrantsItself.status}`,
  );

  const ownerGrants = await api("/rest/v1/rpc/app_grant_credential_access", {
    key: PUBLISHABLE,
    token: ownerToken,
    method: "POST",
    body: {
      target_credential_id: credentialId,
      target_profile_id: ID.assigned,
      access_level: "use",
    },
  });
  check(
    "owner can grant use access",
    ownerGrants.ok,
    `status ${ownerGrants.status}`,
  );

  const grantedRead = await readSecret(memberToken);
  const grantedRow = firstRow(grantedRead);
  check(
    "a granted member receives ciphertext, never plaintext",
    grantedRow?.allowed === true &&
      grantedRow?.ciphertext === "Y2lwaGVydGV4dA==",
    JSON.stringify(grantedRead.data),
  );

  const useCannotReplace = await api(
    "/rest/v1/rpc/app_replace_credential_secret",
    {
      key: PUBLISHABLE,
      token: memberToken,
      method: "POST",
      body: {
        target_credential_id: credentialId,
        new_ciphertext: "bmV3",
        new_nonce: "bm9uY2U=",
        new_auth_tag: "dGFn",
        new_key_version: 1,
      },
    },
  );
  check(
    "use access cannot replace a value",
    useCannotReplace.ok && useCannotReplace.data === false,
    JSON.stringify(useCannotReplace.data),
  );

  const ownerRevokes = await api("/rest/v1/rpc/app_revoke_credential_access", {
    key: PUBLISHABLE,
    token: ownerToken,
    method: "POST",
    body: {
      target_credential_id: credentialId,
      target_profile_id: ID.assigned,
    },
  });
  check(
    "owner can revoke access",
    ownerRevokes.ok,
    `status ${ownerRevokes.status}`,
  );

  const afterRevoke = await readSecret(memberToken);
  check(
    "revocation takes effect on the next request",
    firstRow(afterRevoke)?.allowed === false,
    JSON.stringify(afterRevoke.data),
  );

  const strangerSeesCredential = await api(
    "/rest/v1/app_project_credentials?select=*",
    { key: PUBLISHABLE, token: strangerToken },
  );
  check(
    "an unassigned member cannot see that a credential exists",
    strangerSeesCredential.ok &&
      Array.isArray(strangerSeesCredential.data) &&
      !strangerSeesCredential.data.length,
    JSON.stringify(strangerSeesCredential.data),
  );

  const financeSeesCredential = await api(
    "/rest/v1/app_project_credentials?select=*",
    { key: PUBLISHABLE, token: financeToken },
  );
  check(
    "finance never sees project credentials",
    financeSeesCredential.ok &&
      Array.isArray(financeSeesCredential.data) &&
      !financeSeesCredential.data.length,
    JSON.stringify(financeSeesCredential.data),
  );

  const anonReadsSecret = await readSecret(undefined);
  check(
    "anonymous callers cannot execute the credential read function",
    !anonReadsSecret.ok,
    `status ${anonReadsSecret.status}`,
  );

  const anonCredentials = await api(
    "/rest/v1/app_project_credentials?select=*",
    { key: PUBLISHABLE },
  );
  check(
    "anonymous callers cannot read credential metadata",
    !anonCredentials.ok ||
      (Array.isArray(anonCredentials.data) && !anonCredentials.data.length),
    JSON.stringify(anonCredentials.data),
  );

  const anonRpc = await portfolio(undefined);
  check(
    "anonymous callers cannot execute the portfolio function",
    !anonRpc.ok,
    `status ${anonRpc.status}`,
  );

  const anonTable = await api("/rest/v1/app_projects?select=*", {
    key: PUBLISHABLE,
  });
  check(
    "anonymous callers cannot read internal project rows",
    !anonTable.ok || (Array.isArray(anonTable.data) && !anonTable.data.length),
    JSON.stringify(anonTable.data),
  );

  const anonFinancials = await api("/rest/v1/app_project_financials?select=*", {
    key: PUBLISHABLE,
  });
  check(
    "anonymous callers cannot read project value",
    !anonFinancials.ok ||
      (Array.isArray(anonFinancials.data) && !anonFinancials.data.length),
    JSON.stringify(anonFinancials.data),
  );
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

console.log("\nProject module — direct API permission check\n");
console.log(results.join("\n"));
console.log(
  `\n${results.length - failures}/${results.length} checks passed.\n`,
);
process.exit(failures ? 1 : 0);
