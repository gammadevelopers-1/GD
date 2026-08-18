#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const results = [];
let failures = 0;

function run(label, command, args, { optional = false } = {}) {
  process.stdout.write(`\n▶ ${label}\n`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    encoding: "utf8",
  });

  if (result.status === 0) {
    results.push(`  ok    ${label}`);
    return true;
  }
  if (optional) {
    results.push(`  skip  ${label} — not configured here`);
    return false;
  }
  failures += 1;
  results.push(`  FAIL  ${label}`);
  return false;
}

run("Lint and types", "npm", ["run", "check"]);
run("Production build", "npm", ["run", "build"]);
run("Database policy tests, every role", "npm", ["run", "test:db"]);
run("Direct API tests, every role", "npm", ["run", "test:api"]);

const hasKeys = Boolean(
  process.env.CREDENTIAL_ENCRYPTION_KEYS?.trim() ||
  process.env.CREDENTIAL_ENCRYPTION_KEY?.trim(),
);
run(
  "Credential encryption round trip",
  "node",
  ["scripts/credential-key.mjs", "check"],
  {
    optional: !hasKeys,
  },
);

console.log("\n\n─── Automated release checks ───\n");
console.log(results.join("\n"));

console.log(`
─── Still needs a person ───

  [ ] Every active Gamma project loaded, with client, status, lead, dates,
      team and responsibilities, a current milestone plan and its technical
      links.  →  psql "$DATABASE_URL" -f supabase/pilot-readiness.sql

  [ ] Owner and member acceptance checks run against real data, on a laptop
      and on a phone.

  [ ] Keyboard only: tab through the portfolio, a project's four tabs, and
      the credential copy button. Focus is always visible.

  [ ] Screen reader pass over the project workspace.

  [ ] A separate security reviewer has approved the credential vault, and the
      encryption-key custodian is named and holds a backup of every key
      version still in use.

  [ ] The team knows where to report issues after launch.
`);

if (failures) {
  console.error(
    `${failures} automated check(s) failed. Not ready to release.\n`,
  );
  process.exit(1);
}
console.log("Automated checks all passed.\n");
