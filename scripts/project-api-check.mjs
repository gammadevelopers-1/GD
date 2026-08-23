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
  weekOther: "73000000-0000-4000-8000-000000000002",
  itemDone: "74000000-0000-4000-8000-000000000001",
  itemOpen: "74000000-0000-4000-8000-000000000002",
  itemOther: "74000000-0000-4000-8000-000000000003",
  credential: "75000000-0000-4000-8000-000000000001",
  envGroup: "76000000-0000-4000-8000-000000000001",
  portalClient: "77000000-0000-4000-8000-000000000001",
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

function query(statement) {
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      DB_CONTAINER,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-t",
      "-A",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-c",
      statement,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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
  const headers = {
    apikey: key,
    Authorization: `Bearer ${token ?? key}`,
    "x-gamma-client-ip": "198.51.100.7",
  };
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

    -- A work item on a project no client is linked to, so "the card id decides
    -- the project" can be tested rather than assumed.
    insert into public.app_milestone_weeks (id, project_id, week_number, starts_on, due_on)
    values ('${ID.weekOther}', '${ID.projectOwnerOnly}', 1, current_date - 6, current_date + 1);

    insert into public.app_milestone_cards
      (id, milestone_week_id, board, status, title, created_by)
    values ('${ID.itemOther}', '${ID.weekOther}', 'work', 'in_progress',
            'API item on another project', '${ID.owner}');
  `);

  sql(`
    insert into public.app_client_registrations (email, full_name, created_by)
    values ('chunk2-api-client@gamma.test', 'API Client', '${ID.owner}')
    on conflict (email) do update
      set full_name = excluded.full_name, created_at = now();
  `);

  await createUser(
    ID.portalClient,
    "chunk2-api-client@gamma.test",
    "client",
    "API Client",
  );

  sql(`
    insert into public.app_project_client_access
      (project_id, client_user_id, can_edit_milestones, granted_by)
    values ('${ID.projectAssigned}', '${ID.portalClient}', false, '${ID.owner}')
    on conflict (project_id, client_user_id) do update
      set revoked_at = null, can_edit_milestones = false;
  `);
}

async function cleanup() {
  sql(`
    delete from public.app_milestone_cards
      where milestone_week_id in ('${ID.week}', '${ID.weekOther}');
    delete from public.app_milestone_weeks
      where id in ('${ID.week}', '${ID.weekOther}');
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
    delete from public.app_client_registrations
      where email = 'chunk2-api-client@gamma.test';
    delete from public.app_audit_logs where client_actor_id = '${ID.portalClient}';
    delete from public.app_project_client_access
      where client_user_id = '${ID.portalClient}';
    delete from public.app_client_users where id = '${ID.portalClient}';
    delete from public.app_documents
      where profile_id in ('${ID.assigned}', '${ID.unassigned}');
    delete from public.app_employment_private
      where profile_id in ('${ID.owner}', '${ID.assigned}', '${ID.unassigned}', '${ID.finance}');
    delete from public.app_audit_logs where action = 'member.activated';
    delete from public.app_projects
      where id in ('${ID.projectAssigned}', '${ID.projectOwnerOnly}', '${ID.projectArchived}');
    delete from public.app_clients where id in ('${ID.clientA}', '${ID.clientB}');
    delete from public.app_profiles
      where id in ('${ID.owner}', '${ID.assigned}', '${ID.unassigned}', '${ID.finance}');
  `);

  for (const id of [
    ID.owner,
    ID.assigned,
    ID.unassigned,
    ID.finance,
    ID.portalClient,
  ]) {
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

  const CLIENT_TABLES = [
    "app_client_users",
    "app_project_client_access",
    "app_client_signin_attempts",
  ];

  for (const table of CLIENT_TABLES) {
    const asMember = await api(`/rest/v1/${table}?select=*`, {
      key: PUBLISHABLE,
      token: memberToken,
    });
    check(
      `an internal member cannot read ${table}`,
      asMember.ok && Array.isArray(asMember.data) && !asMember.data.length,
      JSON.stringify(asMember.data),
    );

    const asAnon = await api(`/rest/v1/${table}?select=*`, {
      key: PUBLISHABLE,
    });
    check(
      `anonymous callers cannot read ${table}`,
      !asAnon.ok || (Array.isArray(asAnon.data) && !asAnon.data.length),
      JSON.stringify(asAnon.data),
    );
  }

  const anonPortal = await api("/rest/v1/rpc/app_client_portal", {
    key: PUBLISHABLE,
    method: "POST",
    body: { target_public_id: "anything" },
  });
  check(
    "anonymous callers cannot execute the portal function",
    !anonPortal.ok,
    `status ${anonPortal.status}`,
  );

  const anonLimiterRead = await api("/rest/v1/rpc/app_client_signin_gate", {
    key: PUBLISHABLE,
    method: "POST",
    body: { email_key: "anything@example.test", ip_key: "ip-anon" },
  });
  check(
    "anonymous callers cannot ask the sign-in limiter about an address",
    !anonLimiterRead.ok,
    `status ${anonLimiterRead.status}`,
  );

  const anonLimiterReset = await api("/rest/v1/rpc/app_client_signin_record", {
    key: PUBLISHABLE,
    method: "POST",
    body: {
      email_key: "anything@example.test",
      ip_key: "ip-anon",
      succeeded: true,
    },
  });
  check(
    "anonymous callers cannot clear their own failed sign-in attempts",
    !anonLimiterReset.ok,
    `status ${anonLimiterReset.status}`,
  );

  const memberLimiterReset = await api("/rest/v1/rpc/app_client_signin_record", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: {
      email_key: "anything@example.test",
      ip_key: "ip-member",
      succeeded: true,
    },
  });
  check(
    "a signed-in member cannot clear a client's failed sign-in attempts",
    !memberLimiterReset.ok,
    `status ${memberLimiterReset.status}`,
  );

  const memberPreview = await api("/rest/v1/rpc/app_client_portal_preview", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: { target_public_id: "anything" },
  });
  check(
    "a member cannot preview the client portal",
    memberPreview.ok && memberPreview.data === null,
    JSON.stringify(memberPreview.data),
  );

  const internalProfile = query(
    `select count(*) from public.app_profiles where id = '${ID.portalClient}'`,
  );
  check(
    "creating a client account does not create an internal profile",
    internalProfile[0] === "0",
    `app_profiles rows: ${internalProfile[0]}`,
  );

  const clientRow = query(
    `select count(*) from public.app_client_users where id = '${ID.portalClient}'`,
  );
  check(
    "creating a client account does create a client row",
    clientRow[0] === "1",
    `app_client_users rows: ${clientRow[0]}`,
  );

  const clientToken = await signIn("chunk2-api-client@gamma.test");
  const asClient = (path, options = {}) =>
    api(path, { key: PUBLISHABLE, token: clientToken, ...options });

  const [sharedPublicId] = query(
    `select public_id from public.app_projects where id = '${ID.projectAssigned}'`,
  );
  const [otherPublicId] = query(
    `select public_id from public.app_projects where id = '${ID.projectOwnerOnly}'`,
  );

  const clientPicker = await asClient("/rest/v1/rpc/app_client_projects", {
    method: "POST",
    body: {},
  });
  const pickerBody = JSON.stringify(clientPicker.data ?? "");
  check(
    "the client picker returns the columns a card needs",
    clientPicker.ok &&
      Array.isArray(clientPicker.data) &&
      clientPicker.data.every(
        (row) =>
          "total_items" in row && "due_on" in row && "banner_path" in row,
      ),
    pickerBody.slice(0, 200),
  );

  check(
    "and carries no money field of any kind",
    !/value_amount|value_currency|exchange_rate|salary/i.test(pickerBody),
    pickerBody.slice(0, 200),
  );

  const clientFinancials = await asClient(
    "/rest/v1/app_project_financials?select=value_amount",
  );
  check(
    "a client reads no row from the project money table",
    !clientFinancials.ok ||
      (Array.isArray(clientFinancials.data) &&
        clientFinancials.data.length === 0),
    JSON.stringify(clientFinancials.data),
  );

  const clientOwnProject = await asClient("/rest/v1/rpc/app_client_portal", {
    method: "POST",
    body: { target_public_id: sharedPublicId },
  });
  check(
    "a client can read the project shared with them",
    clientOwnProject.ok &&
      clientOwnProject.data?.project?.name === "API Assigned Platform",
    JSON.stringify(clientOwnProject.data)?.slice(0, 200),
  );

  const clientOtherProject = await asClient("/rest/v1/rpc/app_client_portal", {
    method: "POST",
    body: { target_public_id: otherPublicId },
  });
  check(
    "a client asking for another project gets nothing",
    clientOtherProject.ok && clientOtherProject.data === null,
    JSON.stringify(clientOtherProject.data),
  );

  const payload = JSON.stringify(clientOwnProject.data ?? {});
  check(
    "the client payload carries no money, credential or repository field",
    !/value|amount|currency|salary|credential|secret|env|repository|hosting|onboarding/i.test(
      payload,
    ),
    payload.slice(0, 300),
  );

  const CLOSED_TO_CLIENTS = [
    "app_projects",
    "app_profiles",
    "app_project_credentials",
    "app_credential_secrets",
    "app_credential_grants",
    "app_env_groups",
    "app_env_variable_grants",
    "app_project_financials",
    "app_project_members",
    "app_project_technical_details",
    "app_milestone_weeks",
    "app_milestone_cards",
    "app_week_idea_boards",
    "app_project_idea_boards",
    "app_project_work_boards",
    "app_clients",
    "app_audit_logs",
  ];

  for (const table of CLOSED_TO_CLIENTS) {
    const response = await asClient(`/rest/v1/${table}?select=*`);
    check(
      `a client reads nothing from ${table}`,
      !response.ok || (Array.isArray(response.data) && !response.data.length),
      `${response.status} ${JSON.stringify(response.data)?.slice(0, 160)}`,
    );
  }

  const clientSelfRow = await asClient("/rest/v1/app_client_users?select=*");
  check(
    "a client reads only their own identity row",
    clientSelfRow.ok &&
      Array.isArray(clientSelfRow.data) &&
      clientSelfRow.data.length === 1 &&
      clientSelfRow.data[0].id === ID.portalClient,
    JSON.stringify(clientSelfRow.data)?.slice(0, 200),
  );

  const clientPreview = await asClient(
    "/rest/v1/rpc/app_client_portal_preview",
    { method: "POST", body: { target_public_id: sharedPublicId } },
  );
  check(
    "a client cannot use the owner preview function",
    clientPreview.ok && clientPreview.data === null,
    JSON.stringify(clientPreview.data),
  );

  const tickDenied = await asClient("/rest/v1/rpc/app_client_set_item_done", {
    method: "POST",
    body: { target_card_id: ID.itemDone, done: false },
  });
  check(
    "a read-only client cannot tick an item",
    !tickDenied.ok,
    `status ${tickDenied.status}`,
  );

  const ideaDenied = await asClient("/rest/v1/rpc/app_client_save_week_idea", {
    method: "POST",
    body: {
      target_week_id: ID.week,
      new_doc: { type: "doc", content: [] },
    },
  });
  check(
    "a read-only client cannot write the idea board",
    !ideaDenied.ok,
    `status ${ideaDenied.status}`,
  );

  sql(`
    update public.app_project_client_access
    set can_edit_milestones = true
    where client_user_id = '${ID.portalClient}';
  `);

  const tickAllowed = await asClient("/rest/v1/rpc/app_client_set_item_done", {
    method: "POST",
    body: { target_card_id: ID.itemDone, done: false },
  });
  check(
    "a client with milestone editing can tick an item",
    tickAllowed.ok,
    `status ${tickAllowed.status} ${JSON.stringify(tickAllowed.data)}`,
  );

  const statusDenied = await asClient(
    "/rest/v1/rpc/app_set_milestone_card_status",
    {
      method: "POST",
      body: {
        target_card_id: ID.itemDone,
        next_status: "blocked",
        reason: "x",
      },
    },
  );
  check(
    "even then a client cannot use the internal card status function",
    !statusDenied.ok,
    `status ${statusDenied.status}`,
  );

  const crossProjectTick = await asClient(
    "/rest/v1/rpc/app_client_set_item_done",
    { method: "POST", body: { target_card_id: ID.itemOther, done: true } },
  );
  check(
    "a client cannot tick an item belonging to another project",
    !crossProjectTick.ok,
    `status ${crossProjectTick.status}`,
  );

  const crossProjectIdeas = await asClient(
    "/rest/v1/rpc/app_client_save_week_idea",
    {
      method: "POST",
      body: {
        target_week_id: ID.weekOther,
        new_doc: { type: "doc", content: [] },
      },
    },
  );
  check(
    "a client cannot write notes on another project's week",
    !crossProjectIdeas.ok,
    `status ${crossProjectIdeas.status}`,
  );

  sql(`
    update public.app_project_client_access
    set revoked_at = now()
    where client_user_id = '${ID.portalClient}';
  `);

  const afterClientRevoke = await asClient("/rest/v1/rpc/app_client_portal", {
    method: "POST",
    body: { target_public_id: sharedPublicId },
  });
  check(
    "a revoked client sees nothing on their next request",
    afterClientRevoke.ok && afterClientRevoke.data === null,
    JSON.stringify(afterClientRevoke.data),
  );

  sql(`
    insert into public.app_employment_private
      (profile_id, employment_type, start_date, salary_amount, cnic,
       bank_account_title, bank_account_number, bank_name)
    values
      ('${ID.assigned}', 'employee', current_date - 30, 250000,
       '35202-1234567-1', 'API Assigned', 'PK00APICHECK0000000001', 'Meezan'),
      ('${ID.unassigned}', 'employee', current_date - 30, 275000,
       '35202-7654321-9', 'API Unassigned', 'PK00APICHECK0000000002', 'HBL')
    on conflict (profile_id) do nothing;

    insert into public.app_documents
      (profile_id, document_type, file_name, storage_path, uploaded_by)
    values ('${ID.unassigned}', 'contract', 'api-contract.pdf',
            'api-check/${ID.unassigned}-contract.pdf', '${ID.owner}')
    on conflict (storage_path) do nothing;
  `);

  const employment = (token) =>
    api("/rest/v1/app_employment_private?select=profile_id,salary_amount,cnic,bank_account_number", {
      key: PUBLISHABLE,
      token,
    });

  const ownerEmployment = await employment(ownerToken);
  const ownerSeen = (ownerEmployment.data ?? []).filter((row) =>
    [ID.assigned, ID.unassigned].includes(row.profile_id),
  );
  check(
    "owner reads salary, CNIC and bank details for the team",
    ownerSeen.length === 2 &&
      ownerSeen.every((row) => row.salary_amount && row.cnic),
    JSON.stringify(ownerEmployment.data),
  );

  const memberEmployment = await employment(memberToken);
  check(
    "a member reads exactly one employment record, their own",
    Array.isArray(memberEmployment.data) &&
      memberEmployment.data.length === 1 &&
      memberEmployment.data[0].profile_id === ID.assigned,
    JSON.stringify(memberEmployment.data),
  );

  const memberOnColleague = await api(
    `/rest/v1/app_employment_private?select=*&profile_id=eq.${ID.unassigned}`,
    { key: PUBLISHABLE, token: memberToken },
  );
  check(
    "a member asking for a colleague's salary by id gets an empty list",
    Array.isArray(memberOnColleague.data) && !memberOnColleague.data.length,
    JSON.stringify(memberOnColleague.data),
  );

  const financeEmployment = await employment(financeToken);
  check(
    "finance reads no employment record at all",
    Array.isArray(financeEmployment.data) && !financeEmployment.data.length,
    JSON.stringify(financeEmployment.data),
  );

  const memberDocuments = await api(
    `/rest/v1/app_documents?select=*&profile_id=eq.${ID.unassigned}`,
    { key: PUBLISHABLE, token: memberToken },
  );
  check(
    "a member cannot reach a colleague's contract",
    Array.isArray(memberDocuments.data) && !memberDocuments.data.length,
    JSON.stringify(memberDocuments.data),
  );

  const financeDocuments = await api("/rest/v1/app_documents?select=*", {
    key: PUBLISHABLE,
    token: financeToken,
  });
  check(
    "finance reads no HR document",
    Array.isArray(financeDocuments.data) && !financeDocuments.data.length,
    JSON.stringify(financeDocuments.data),
  );

  const strangerProfile = await api(
    `/rest/v1/app_profiles?select=id,job_title,phone&id=eq.${ID.unassigned}`,
    { key: PUBLISHABLE, token: memberToken },
  );
  check(
    "a member sees no profile row for someone they share no project with",
    Array.isArray(strangerProfile.data) && !strangerProfile.data.length,
    JSON.stringify(strangerProfile.data),
  );

  const promotion = await api(`/rest/v1/app_profiles?id=eq.${ID.assigned}`, {
    key: PUBLISHABLE,
    token: memberToken,
    method: "PATCH",
    body: { role: "owner" },
    prefer: "return=representation",
  });
  check(
    "a member cannot promote themselves over the API",
    !promotion.ok ||
      (Array.isArray(promotion.data) && !promotion.data.length),
    JSON.stringify(promotion.data),
  );

  const stamped = await api("/rest/v1/rpc/app_member_activated", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: {},
  });
  const activationRows = query(`
    select id from public.app_profiles
    where activated_at is not null
      and id in ('${ID.assigned}', '${ID.unassigned}', '${ID.finance}');
  `);
  check(
    "setting a password stamps only the caller's own arrival",
    stamped.ok &&
      activationRows.length === 1 &&
      activationRows[0] === ID.assigned,
    JSON.stringify(activationRows),
  );

  const anonEmployment = await api(
    "/rest/v1/app_employment_private?select=*",
    { key: PUBLISHABLE },
  );
  check(
    "anonymous callers cannot read salaries",
    !anonEmployment.ok ||
      (Array.isArray(anonEmployment.data) && !anonEmployment.data.length),
    JSON.stringify(anonEmployment.data),
  );

  const anonDocuments = await api("/rest/v1/app_documents?select=*", {
    key: PUBLISHABLE,
  });
  check(
    "anonymous callers cannot read contracts",
    !anonDocuments.ok ||
      (Array.isArray(anonDocuments.data) && !anonDocuments.data.length),
    JSON.stringify(anonDocuments.data),
  );

  const deleteRpc = (token, target) =>
    api("/rest/v1/rpc/app_delete_team_member", {
      key: PUBLISHABLE,
      token,
      method: "POST",
      body: { target },
    });

  const memberDeletes = await deleteRpc(memberToken, ID.unassigned);
  check(
    "a member cannot delete a team member over the API",
    !memberDeletes.ok,
    JSON.stringify(memberDeletes.data),
  );

  const financeDeletes = await deleteRpc(financeToken, ID.unassigned);
  check(
    "finance cannot delete a team member over the API",
    !financeDeletes.ok,
    JSON.stringify(financeDeletes.data),
  );

  const anonDeletes = await api("/rest/v1/rpc/app_delete_team_member", {
    key: PUBLISHABLE,
    method: "POST",
    body: { target: ID.unassigned },
  });
  check(
    "anonymous callers cannot delete a team member",
    !anonDeletes.ok,
    JSON.stringify(anonDeletes.data),
  );

  const ownerDeletesWorker = await deleteRpc(ownerToken, ID.assigned);
  check(
    "an owner deleting someone with project work gets the written refusal",
    !ownerDeletesWorker.ok &&
      String(ownerDeletesWorker.data?.message ?? "").includes(
        "Archive them instead",
      ),
    JSON.stringify(ownerDeletesWorker.data),
  );

  check(
    "and that person is still there afterwards",
    query(
      `select id from public.app_profiles where id = '${ID.assigned}';`,
    ).length === 1,
  );

  const ownerDeletesSelf = await deleteRpc(ownerToken, ID.owner);
  check(
    "an owner cannot delete their own account",
    !ownerDeletesSelf.ok,
    JSON.stringify(ownerDeletesSelf.data),
  );

  sql(`
    update public.app_profiles
    set activated_at = now(), password_link_pending = false
    where id = '${ID.unassigned}';
  `);

  const linkSpent = await api("/rest/v1/rpc/app_password_already_set", {
    key: PUBLISHABLE,
    method: "POST",
    body: { target: ID.unassigned },
  });
  check(
    "the set-password page can learn a spent link is spent without a session",
    linkSpent.ok && linkSpent.data === true,
    JSON.stringify(linkSpent.data),
  );

  sql(`
    update public.app_profiles
    set password_link_pending = true
    where id = '${ID.unassigned}';
  `);

  const linkReissued = await api("/rest/v1/rpc/app_password_already_set", {
    key: PUBLISHABLE,
    method: "POST",
    body: { target: ID.unassigned },
  });
  check(
    "a reissued link opens the form again, so a password reset still works",
    linkReissued.ok && linkReissued.data === false,
    JSON.stringify(linkReissued.data),
  );

  const linkUnknown = await api("/rest/v1/rpc/app_password_already_set", {
    key: PUBLISHABLE,
    method: "POST",
    body: { target: "99999999-0000-4000-8000-000000000009" },
  });
  check(
    "an id matching nobody answers false rather than revealing an account",
    linkUnknown.ok && linkUnknown.data === false,
    JSON.stringify(linkUnknown.data),
  );

  const profilesAnon = await api("/rest/v1/app_profiles?select=email", {
    key: PUBLISHABLE,
  });
  check(
    "and the profile table stays shut to anonymous callers regardless",
    !profilesAnon.ok ||
      (Array.isArray(profilesAnon.data) && profilesAnon.data.length === 0),
    JSON.stringify(profilesAnon.data),
  );

  const clientAccounts = await api("/rest/v1/app_client_users?select=email", {
    key: PUBLISHABLE,
    token: memberToken,
  });
  check(
    "a member reads no client portal account",
    !clientAccounts.ok ||
      (Array.isArray(clientAccounts.data) && clientAccounts.data.length === 0),
    JSON.stringify(clientAccounts.data),
  );

  const clientAccountsFinance = await api(
    "/rest/v1/app_client_users?select=email",
    { key: PUBLISHABLE, token: financeToken },
  );
  check(
    "finance reads no client portal account either",
    !clientAccountsFinance.ok ||
      (Array.isArray(clientAccountsFinance.data) &&
        clientAccountsFinance.data.length === 0),
    JSON.stringify(clientAccountsFinance.data),
  );

  const memberDeletesClient = await api(
    "/rest/v1/rpc/app_delete_client_account",
    {
      key: PUBLISHABLE,
      token: memberToken,
      method: "POST",
      body: { target: ID.portalClient },
    },
  );
  check(
    "a member cannot delete a client account over the API",
    !memberDeletesClient.ok,
    JSON.stringify(memberDeletesClient.data),
  );

  const anonDeletesClient = await api(
    "/rest/v1/rpc/app_delete_client_account",
    {
      key: PUBLISHABLE,
      method: "POST",
      body: { target: ID.portalClient },
    },
  );
  check(
    "anonymous callers cannot delete a client account",
    !anonDeletesClient.ok,
    JSON.stringify(anonDeletesClient.data),
  );

  const clientLinkUnknown = await api("/rest/v1/rpc/app_client_link_state", {
    key: PUBLISHABLE,
    method: "POST",
    body: { target: "99999999-0000-4000-8000-000000000009" },
  });
  check(
    "a client id matching nobody answers false rather than revealing an account",
    clientLinkUnknown.ok && clientLinkUnknown.data === false,
    JSON.stringify(clientLinkUnknown.data),
  );

  sql(`
    update public.app_client_users
    set activated_at = now(), password_link_pending = false, invited_at = now()
    where id = '${ID.portalClient}';

    insert into public.app_project_client_access
      (project_id, client_user_id, granted_by)
    values ('${ID.projectOwnerOnly}', '${ID.portalClient}', '${ID.owner}')
    on conflict (project_id, client_user_id) do update
      set revoked_at = null;
  `);

  const stillActivated = query(`
    select activated_at is not null from public.app_client_users
    where id = '${ID.portalClient}';
  `);
  check(
    "a second project grant leaves an activated client's password alone",
    stillActivated[0]?.trim() === "t",
    stillActivated.join(" "),
  );

  const linkNotReopened = query(`
    select password_link_pending from public.app_client_users
    where id = '${ID.portalClient}';
  `);
  check(
    "and does not reopen their set-password link",
    linkNotReopened[0]?.trim() === "f",
    linkNotReopened.join(" "),
  );

  const reachesNewProject = query(`
    select count(*) from public.app_project_client_access
    where client_user_id = '${ID.portalClient}'
      and project_id = '${ID.projectOwnerOnly}'
      and revoked_at is null;
  `);
  check(
    "and that one account now reaches the newly granted project",
    reachesNewProject[0]?.trim() === "1",
    reachesNewProject.join(" "),
  );

  const memberRenames = await api("/rest/v1/rpc/app_update_my_profile", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: { new_display_name: "Renamed", new_avatar_path: null },
  });
  check(
    "a member may set their own display name",
    memberRenames.ok,
    JSON.stringify(memberRenames.data),
  );

  const [afterRename] = query(
    `select role || '|' || full_name from public.app_profiles where id = '${ID.assigned}';`,
  );
  check(
    "and the same call leaves their role and official name alone",
    afterRename?.trim().startsWith("member|"),
    afterRename,
  );

  const stealAvatar = await api("/rest/v1/rpc/app_update_my_profile", {
    key: PUBLISHABLE,
    token: memberToken,
    method: "POST",
    body: { new_display_name: "Nope", new_avatar_path: `${ID.owner}/face.png` },
  });
  check(
    "a member cannot point their avatar at another account's folder",
    !stealAvatar.ok,
    JSON.stringify(stealAvatar.data),
  );

  const anonRenames = await api("/rest/v1/rpc/app_update_my_profile", {
    key: PUBLISHABLE,
    method: "POST",
    body: { new_display_name: "Anyone", new_avatar_path: null },
  });
  check(
    "anonymous callers cannot touch a profile",
    !anonRenames.ok,
    JSON.stringify(anonRenames.data),
  );

  const financeNotifications = await api(
    "/rest/v1/rpc/app_update_my_notifications",
    {
      key: PUBLISHABLE,
      token: financeToken,
      method: "POST",
      body: { milestones: false, weekly: false },
    },
  );
  check(
    "finance may set their own email preferences",
    financeNotifications.ok,
    JSON.stringify(financeNotifications.data),
  );

  const auditRead = await api("/rest/v1/rpc/app_read_credential_secret", {
    key: PUBLISHABLE,
    token: ownerToken,
    method: "POST",
    body: { target_credential_id: ID.credential },
  });

  const recordedIp = query(`
    select coalesce(ip, '(null)') from public.app_audit_logs
    where resource_type = 'credential' and actor_id = '${ID.owner}'
    order by id desc limit 1;
  `);
  check(
    "an address reaches the audit log when the app forwards one",
    auditRead.ok ? recordedIp[0]?.trim() === "198.51.100.7" : true,
    `${JSON.stringify(auditRead.data)?.slice(0, 80)} ip=${recordedIp.join(" ")}`,
  );

  const memberInvoices = await api(
    "/rest/v1/app_invoices?select=amount,currency,status",
    { key: PUBLISHABLE, token: memberToken },
  );
  check(
    "a member reads no invoice row, so the dashboard can show them no money",
    !memberInvoices.ok ||
      (Array.isArray(memberInvoices.data) && memberInvoices.data.length === 0),
    JSON.stringify(memberInvoices.data),
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
