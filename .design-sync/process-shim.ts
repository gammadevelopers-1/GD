const g = globalThis as unknown as {
  process?: { env: Record<string, string | undefined> };
};

if (!g.process) g.process = { env: {} };
else if (!g.process.env) g.process.env = {};
