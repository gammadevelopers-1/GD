// Parsing a pasted .env blob into individual keys, the way Vercel's import
// works. Every pair becomes its own credential, so each one is encrypted,
// granted and audited separately — a blob is only ever the input format.

export const ENV_KEY_MAX = 120;
export const ENV_VALUE_MAX = 8000;
export const ENV_MAX_PAIRS = 200;
export const ENV_GROUP_NAME_MAX = 80;

// Same shape a shell would accept: letters, digits and underscores, not
// starting with a digit.
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
      // Only double quotes carry escapes, matching dotenv.
      return first === '"'
        ? inner.replace(/\\n/g, "\n").replace(/\\"/g, '"')
        : inner;
    }
  }
  // An unquoted value ends at the first ` #` comment.
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

    // `export FOO=bar` is common in shell-style files.
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
      skipped.push({ line: number, reason: `"${key.slice(0, 40)}" is not a valid key` });
      return;
    }
    if (key.length > ENV_KEY_MAX) {
      skipped.push({ line: number, reason: `${key.slice(0, 20)}… is too long` });
      return;
    }
    if (value.length > ENV_VALUE_MAX) {
      skipped.push({ line: number, reason: `${key} has too large a value` });
      return;
    }
    if (seen.has(key)) {
      // Later wins, as a shell would do, but say so rather than silently.
      const previous = pairs.findIndex((pair) => pair.key === key);
      if (previous !== -1) pairs[previous] = { key, value };
      skipped.push({ line: number, reason: `${key} appeared twice — kept the last` });
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

// A .env file is every secret at once, so the name is checked but the contents
// are never parsed for display.
export function looksLikeEnvFile(name: string) {
  const lower = name.toLowerCase();
  return (
    lower === ".env" ||
    lower.startsWith(".env.") ||
    lower.endsWith(".env") ||
    lower.endsWith(".env.example") ||
    lower.endsWith(".env.local") ||
    lower.endsWith(".env.sample")
  );
}

// Masking for the one place a value is ever echoed back: the import preview,
// before anything is saved.
export function maskValue(value: string) {
  if (!value) return "—";
  if (value.length <= 4) return "•".repeat(value.length);
  return `${value.slice(0, 2)}${"•".repeat(Math.min(value.length - 4, 18))}${value.slice(-2)}`;
}
