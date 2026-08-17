# Credential encryption keys — custody, rotation, recovery

Required by Chunk 9's completion gate. Read this before the vault holds a
single real client key.

## The one thing to understand

**The encryption key is not in the database, and it is not recoverable from
it.** Supabase holds ciphertext. The key lives in the deployment's environment
and in the custodian's password manager. If every copy of a key is lost, every
credential encrypted with it is lost — there is no reset, no support ticket,
no backup that helps.

That is the point. It is also the risk, and it is why this document exists.

## People

| Role | Who | What they do |
| --- | --- | --- |
| **Key custodian** | ______________ | Holds the master copy of every key version still in use. Performs rotations. |
| **Security reviewer** | ______________ | Independent of the build. Approves the vault before release and after any change to it. |

Both are required by §11 and §12.8 of the module plan, and Chunk 9 does not
close until they are named. They should not be the same person, and neither
should be the only person who can reach the deployment's environment
variables.

## Format

- **AES-256-GCM**, 32-byte key, 12-byte nonce, per-value random nonce.
- The **credential id is additional authenticated data**, so a ciphertext row
  copied over another credential's row fails to decrypt rather than quietly
  returning the wrong secret.
- Stored per value: ciphertext, nonce, auth tag, key version. All base64.
- One implementation, in `lib/credentials/aes.mjs`, used by both the
  application and the rotation script so they cannot drift.

## Environment

```bash
# The key ring. Every version that any stored value still uses must be here.
CREDENTIAL_ENCRYPTION_KEYS={"1":"<base64 32 bytes>"}

# Optional. Which version new writes use. Defaults to the highest present.
CREDENTIAL_ENCRYPTION_KEY_VERSION=1
```

Generate a key:

```bash
npm run credential:key generate
```

Prove the ring works before trusting it:

```bash
npm run credential:key check
```

That confirms a round trip and confirms a value moved to a different
credential id refuses to decrypt.

If no key is configured the vault closes itself: the tab says so, and nothing
can be stored or read. It never falls back to storing anything unencrypted.

## Backup

For each key version, keep:

1. The deployment environment (Vercel), which is what the app reads.
2. The custodian's password manager, under a named entry with the version
   number and the date it became active.
3. A sealed offline copy held by an owner, for the case where the custodian is
   unavailable.

Three copies, two people. Never in the repository, never in Supabase, never in
chat — including the chat where someone asks for it.

Losing a key is the failure this guards against. Leaking a key is the other
one, and a key in three well-chosen places is not meaningfully more leakable
than a key in one.

## Rotation

Rotate on a schedule (yearly is reasonable at this size), and immediately if a
key may have been exposed — someone left with access to the environment, a
laptop went missing, a key was pasted somewhere it should not have been.

Rotation re-encrypts stored values. It does **not** change the secrets
themselves; if a *credential* leaked rather than a key, the fix is to change
that credential at the provider and replace its value in the platform.

```bash
# 1. Generate the next key.
npm run credential:key generate

# 2. Add it alongside the current one and make it active.
CREDENTIAL_ENCRYPTION_KEYS={"1":"<old>","2":"<new>"}
CREDENTIAL_ENCRYPTION_KEY_VERSION=2

# 3. Confirm both versions load.
npm run credential:key check

# 4. Re-encrypt everything onto version 2.
DATABASE_URL="postgresql://…" npm run credential:key rotate
```

The rotation runs in one transaction: every value moves to the new key or none
does. Each value is decrypted, re-encrypted, and verified before anything is
written, and a value that cannot be decrypted stops the whole run rather than
being skipped.

`rotate` needs a direct postgres connection because no Supabase role — service
key included — has any privilege on `app_credential_secrets`. That is
deliberate. Take the connection string from the Supabase dashboard, use it,
and do not store it.

**Keep the old key** until every database backup taken before the rotation has
aged out. A restore from last week's backup contains last week's ciphertext,
and last week's ciphertext needs last week's key.

Once those backups are gone, drop the retired version:

```bash
CREDENTIAL_ENCRYPTION_KEYS={"2":"<new>"}
```

## Recovery

**A key version is missing.** Values encrypted under it will not open, and the
UI says exactly that rather than failing vaguely. Restore that version from
the custodian's copy or the offline copy and they open again. Nothing needs
re-entering.

**Every copy of a key is lost.** Those values are gone. Recovery means
re-issuing each affected credential at its provider — rotate the API key at
Stripe, the service key at Supabase, and so on — and storing the new values.
The metadata, grants and audit history all survive, so the list of what has to
be re-issued is on screen.

**The database is restored from a backup.** Grants and audit rows return to
their state at backup time. Check that anyone who lost access since then has
not silently regained it: the Team tab and each credential's share list are
the source of truth, and removing someone from the project revokes their
grants again.

**A credential leaked.** Change it at the provider first, then replace the
value here. Read the audit history for that credential to see who copied it
and when — that is what the log is for.

## After any change to this

The security reviewer signs off again. Rotation, a change to the key ring, a
change to who holds a copy: all of it goes past them.

- Last reviewed: ______________
- Reviewed by: ________________
- Next rotation due: __________
