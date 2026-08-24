export type CopyKind = "main" | "personal";

export type MergeRow = {
  key: string;
  credentialId: string;
  groupId: string;
  groupName: string;
  kind: CopyKind;
  profileId: string | null;
  profileName: string;
  digest: string | null;
  isMain: boolean;
  mainSourceCredentialId: string | null;
  updatedAt: string | null;
};

export type Candidate = {
  digest: string | null;
  fingerprint: string;
  credentialId: string;
  holders: string[];
  isCurrent: boolean;
};

export type MergeState = "settled" | "contested" | "agreed" | "absent";

export type MergeKey = {
  key: string;
  state: MergeState;
  main: MergeRow | null;
  candidates: Candidate[];
  copyCount: number;
};

export function fingerprintOf(digest: string | null) {
  return digest ? digest.slice(0, 4) : "····";
}

export function buildMerge(rows: MergeRow[]): MergeKey[] {
  const byKey = new Map<string, MergeRow[]>();
  for (const row of rows) {
    const list = byKey.get(row.key);
    if (list) list.push(row);
    else byKey.set(row.key, [row]);
  }

  const keys: MergeKey[] = [];

  for (const [key, group] of byKey) {
    const main = group.find((row) => row.isMain) ?? null;
    const copies = group.filter((row) => !row.isMain);

    const buckets = new Map<string, Candidate>();
    for (const row of copies) {
      const id = row.digest ?? `unknown:${row.credentialId}`;
      const existing = buckets.get(id);
      if (existing) {
        existing.holders.push(row.profileName);
        continue;
      }
      buckets.set(id, {
        digest: row.digest,
        fingerprint: fingerprintOf(row.digest),
        credentialId: row.credentialId,
        holders: [row.profileName],
        isCurrent: Boolean(
          main?.digest && row.digest && main.digest === row.digest,
        ),
      });
    }

    const candidates = [...buckets.values()].sort(
      (a, b) => b.holders.length - a.holders.length,
    );

    let state: MergeState;
    if (!copies.length) state = "settled";
    else if (candidates.length > 1) state = "contested";
    else if (!main) state = "absent";
    else state = candidates[0].isCurrent ? "settled" : "agreed";

    keys.push({ key, state, main, candidates, copyCount: copies.length });
  }

  return keys.sort((a, b) => {
    const rank = { contested: 0, absent: 1, agreed: 2, settled: 3 } as const;
    if (rank[a.state] !== rank[b.state]) return rank[a.state] - rank[b.state];
    return a.key.localeCompare(b.key);
  });
}

export function summariseMerge(keys: MergeKey[]) {
  return {
    total: keys.length,
    contested: keys.filter((entry) => entry.state === "contested").length,
    absent: keys.filter((entry) => entry.state === "absent").length,
    agreed: keys.filter((entry) => entry.state === "agreed").length,
  };
}

export function mergeHeadline(keys: MergeKey[]) {
  const { total, contested, absent, agreed } = summariseMerge(keys);
  const parts = [`${total} ${total === 1 ? "key" : "keys"}`];
  if (contested) parts.push(`${contested} contested`);
  if (agreed) parts.push(`${agreed} ready`);
  if (absent) parts.push(`${absent} not in main`);
  return parts.join(" · ");
}
