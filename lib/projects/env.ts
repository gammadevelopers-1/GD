export const ENV_KEY_MAX = 120;
export const ENV_VALUE_MAX = 8000;
export const ENV_MAX_PAIRS = 200;
export const ENV_GROUP_NAME_MAX = 80;

const ENV_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

export type EnvPair = { key: string; value: string };

export type EnvParseResult = {
  pairs: EnvPair[];
  skipped: Array<{ line: number; reason: string }>;
};

function stripQuotes(raw: string) {
  const value = raw.trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      const inner = value.slice(1, -1);
      return first === '"'
        ? inner.replace(/\\n/g, "\n").replace(/\\"/g, '"')
        : inner;
    }
  }
  const commentAt = value.search(/\s+#/);
  return (commentAt === -1 ? value : value.slice(0, commentAt)).trim();
}

export function parseEnvBlob(input: string): EnvParseResult {
  const pairs: EnvPair[] = [];
  const skipped: Array<{ line: number; reason: string }> = [];
  const seen = new Set<string>();

  const lines = input.replace(/\r\n/g, "\n").split("\n");

  lines.forEach((raw, index) => {
    const line = raw.trim();
    const number = index + 1;

    if (!line || line.startsWith("#")) return;

    const withoutExport = line.startsWith("export ")
      ? line.slice("export ".length).trim()
      : line;

    const equals = withoutExport.indexOf("=");
    if (equals === -1) {
      skipped.push({ line: number, reason: "no = on this line" });
      return;
    }

    const key = withoutExport.slice(0, equals).trim();
    const value = stripQuotes(withoutExport.slice(equals + 1));

    if (!ENV_KEY.test(key)) {
      skipped.push({
        line: number,
        reason: `"${key.slice(0, 40)}" is not a valid key`,
      });
      return;
    }
    if (key.length > ENV_KEY_MAX) {
      skipped.push({
        line: number,
        reason: `${key.slice(0, 20)}… is too long`,
      });
      return;
    }
    if (value.length > ENV_VALUE_MAX) {
      skipped.push({ line: number, reason: `${key} has too large a value` });
      return;
    }
    if (seen.has(key)) {
      const previous = pairs.findIndex((pair) => pair.key === key);
      if (previous !== -1) pairs[previous] = { key, value };
      skipped.push({
        line: number,
        reason: `${key} appeared twice — kept the last`,
      });
      return;
    }

    seen.add(key);
    pairs.push({ key, value });
  });

  return { pairs: pairs.slice(0, ENV_MAX_PAIRS), skipped };
}

export function isEnvKey(value: string) {
  return ENV_KEY.test(value) && value.length <= ENV_KEY_MAX;
}

export function looksLikeEnvFile(name: string) {
  const base = (name.split(/[\\/]/).pop() ?? name).toLowerCase().trim();
  if (!base) return false;
  return (
    base === "env" ||
    base === ".env" ||
    base.startsWith(".env") ||
    base.startsWith("env.") ||
    base.includes(".env.") ||
    base.endsWith(".env")
  );
}

export function maskValue(value: string) {
  if (!value) return "—";
  if (value.length <= 4) return "•".repeat(value.length);
  return `${value.slice(0, 2)}${"•".repeat(Math.min(value.length - 4, 18))}${value.slice(-2)}`;
}

export const ENV_NOTE_MAX = 500;

export type EnvDraft = {
  key: string;
  value: string;
  note: string;
  include: boolean;
  conflict: boolean;
};

export function draftFromPairs(
  pairs: EnvPair[],
  existingKeys: Iterable<string>,
): EnvDraft[] {
  const taken = new Set(existingKeys);
  return pairs.map((pair) => ({
    key: pair.key,
    value: pair.value,
    note: "",
    include: true,
    conflict: taken.has(pair.key),
  }));
}

export function summariseDrafts(drafts: EnvDraft[]) {
  const found = drafts.length;
  const conflicts = drafts.filter((draft) => draft.conflict).length;
  return { found, conflicts, fresh: found - conflicts };
}

export function describeDrafts(drafts: EnvDraft[]) {
  const { found, conflicts, fresh } = summariseDrafts(drafts);
  if (!found) return "No variables found.";
  const noun = `${found} variable${found === 1 ? "" : "s"}`;
  if (!conflicts) return `Found ${noun}.`;
  return `Found ${noun} — ${fresh} new, ${conflicts} already here.`;
}
