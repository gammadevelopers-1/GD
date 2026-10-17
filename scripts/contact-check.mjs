import { leadEmail, parseLead } from "../lib/contact/fields.ts";

let pass = 0,
  fail = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual),
    e = JSON.stringify(expected);
  if (a === e) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}\n         got ${a}\n        want ${e}`);
  }
}

const GOOD = {
  firstName: "Sara",
  lastName: "Malik",
  email: "Sara@Cortek.ae",
  phone: "+971 50 123 4567",
  company: "Cortek",
  country: "United Arab Emirates",
  roleTitle: "Founder / CEO",
  headcount: "11–50",
  revenue: "$2M – $10M",
  stage: "Ready to build",
  budget: "$25k – $50k",
  timeline: "This quarter",
  summary: "Leads arrive overnight and are answered the next morning, if ever.",
};

const with_ = (patch) => parseLead({ ...GOOD, ...patch });
const err = (result) => (result.ok ? "accepted" : result.field);

console.log("\n1. A complete enquiry is accepted and normalised");
check("accepted", with_({}).ok, true);
check("email is lowercased", with_({}).value.email, "sara@cortek.ae");
check(
  "whitespace trimmed",
  with_({ company: "  Cortek  " }).value.company,
  "Cortek",
);
check("phone may be blank", with_({ phone: "" }).ok, true);

console.log("\n2. Missing required answers are named, not swallowed");
for (const field of [
  "firstName",
  "lastName",
  "company",
  "country",
  "roleTitle",
  "headcount",
  "revenue",
  "stage",
  "budget",
  "timeline",
]) {
  check(`${field} required`, err(with_({ [field]: "" })), field);
}
check("summary must say something", err(with_({ summary: "hi" })), "summary");

console.log("\n3. Email has to look like one");
for (const bad of ["", "nope", "a@b", "two@domains@x.com", "has space@x.com"]) {
  check(`rejects ${JSON.stringify(bad)}`, err(with_({ email: bad })), "email");
}

console.log("\n4. A select can only hold something we offered");
// The whole point: these come off a public form, so a hand-rolled POST must not
// be able to write arbitrary text into the console an owner reads.
check(
  "forged budget",
  err(with_({ budget: "<script>alert(1)</script>" })),
  "budget",
);
check("forged headcount", err(with_({ headcount: "9000" })), "headcount");
check(
  "forged role",
  err(with_({ roleTitle: "Admin'; drop table --" })),
  "roleTitle",
);
check(
  "near miss is still a miss",
  err(with_({ timeline: "this quarter" })),
  "timeline",
);

console.log("\n5. Nothing at all is rejected rather than thrown");
check("undefined body", err(parseLead(undefined)), "firstName");
check("null body", err(parseLead(null)), "firstName");
check("a string body", err(parseLead("hello")), "firstName");
check("an array body", err(parseLead([1, 2, 3])), "firstName");

console.log("\n6. Long input is truncated to what the columns accept");
check(
  "summary capped at 4000",
  with_({ summary: "x".repeat(9000) }).value.summary.length,
  4000,
);
check(
  "company capped at 160",
  with_({ company: "x".repeat(400) }).value.company.length,
  160,
);

console.log("\n7. The notification carries what someone needs to reply");
const mail = leadEmail(with_({}).value, "https://gammadevelopers.com/leads");
check("subject names the company", mail.subject.includes("Cortek"), true);
check("body carries the address", mail.body.includes("sara@cortek.ae"), true);
check("body carries the budget", mail.body.includes("$25k – $50k"), true);
check(
  "body carries the summary",
  mail.body.includes("Leads arrive overnight"),
  true,
);
check(
  "body links the console",
  mail.body.includes("https://gammadevelopers.com/leads"),
  true,
);
check(
  "no console link when the origin is unset",
  leadEmail(with_({}).value, "").body.includes("/leads"),
  false,
);

console.log(
  `\n${fail ? "FAILED" : "PASSED"} — ${pass} passed, ${fail} failed\n`,
);
process.exit(fail ? 1 : 0);
