# Chunk 9 — Secure credentials

The part of the platform that can't be fixed later if it's wrong.

Everything else in this module can ship imperfect and get corrected. A client
production key that leaks once is our client's systems and our contracts, so
this chunk is built differently from every other one.

**This chunk does not release on passing tests alone.** It needs a named
encryption-key custodian and an independent security reviewer — §11 and §12.8
of the module plan — and it needs Chunk 8 closed first. See
[credential-key-management.md](credential-key-management.md).

## What this chunk adds

- **Store a credential** — name, service, environment, description, and the
  value. Owners only.
- **Share it with one named person** at view/copy or edit/replace. Revoke any
  time.
- **Copy to clipboard.** The value is never rendered into the page.
- **Replace a value** — owners, and anyone with an edit grant.
- **Archive and restore.** Nothing is deleted.
- **Audit history**, owner-visible, covering every event the plan lists.
- **A production badge**, because those are the client's systems.

## The five properties this rests on

1. **The key is not in the database.** Values are encrypted with AES-256-GCM
   using a key held in the deployment's environment. A full dump of Supabase —
   or a leaked service key — yields ciphertext and nothing else.

2. **No client role can reach the values table.** `app_credential_secrets` has
   no policy and no grant for `anon`, `authenticated` *or* `service_role`. Only
   `postgres` and two security-definer functions can touch it. This is stronger
   than the plan asks for: even an authorised member calling the API directly
   gets ciphertext they have no key for. The plaintext exists only inside the
   server action, on its way to the clipboard.

3. **Permission is rechecked at the moment of every copy and every edit**, by
   `private.credential_access_level`, which reads live membership and live
   grants. Revocation therefore takes effect on the next request with no cache
   to expire.

4. **Refusals are recorded.** `app_read_credential_secret` returns a status row
   instead of raising, because a raised exception would roll back the audit row
   with it. A denied attempt is exactly the event you most want to keep.

5. **Losing the project loses the secrets.** Database triggers revoke every
   grant when a project assignment is archived or an account is deactivated —
   in the database, so it holds no matter what did the removing.

## Deliberately not built

No share links of any kind. A link outlives the reason it was created, and
that is the single most common way secrets escape. A grant is tied to an
authenticated account or it does not exist.

The value is never rendered, so there is no "reveal" button. Screens get
shared, screenshotted and recorded.

## Audit events

Created · Value replaced · Details updated · Archived · Restored · Access
granted · Access level changed · Access revoked · **Value copied** · **Access
denied**

Each row holds the actor, the credential, the action, the timestamp and
non-secret context. A test asserts no audit row carries a value field of any
kind.

## Verification

```bash
npx supabase db reset
npm run test:db          # 32 credential tests inside 170 total
npm run test:api         # 15 credential checks inside 54 total
npm run credential:key check
npm run check && npm run build
```

The suite proves: membership alone does not grant a secret; a view grant
cannot replace a value; a member cannot grant anything to anyone; revocation
bites on the next request; removing someone from the project and deactivating
an account both revoke automatically; finance and unassigned members cannot see
that a credential exists; anonymous callers have no privilege on either table
and cannot execute the read function; and refusals land in the audit log
against the person who tried.

## Manual role checks

### Owner

- Technical & Credentials → **Store a credential**. Save one, reload.
- **Copy value** — it lands on the clipboard and never appears on screen.
- **Share** it with a member at view. Confirm the audit history shows the grant.
- Replace the value, archive it, restore it.
- Unset `CREDENTIAL_ENCRYPTION_KEYS` and reload: the vault closes and says why.

### Assigned member, before a grant

- The credential's name, service and description are visible; the value is not.
- The row reads "No access". Call `app_read_credential_secret` directly over
  the API: `allowed: false`, and the attempt appears in the owner's audit log.

### Assigned member, with a view grant

- Copy the value. Confirm the copy appears in the owner's audit history.
- Try to replace it — refused, and the refusal is logged.

### Then revoke

- Copy again: refused immediately, no logout needed.
- Remove them from the project entirely: every grant they held is gone.

### Unassigned member, finance, anonymous

- None of them can see that the credential exists, by page or by API.

### Prove the encryption

```sql
select ciphertext from public.app_credential_secrets limit 1;
```

Run it as `postgres` in the SQL editor. What comes back is base64 and useless.
That is the demonstration the plan asks for.

## Chunk 9 completion record

- Chunk 8 closed and credential work agreed by: ________________
- Encryption-key custodian: ___________________________________
- Security reviewer: __________________________________________
- Key backups confirmed in three places by: ___________________
- Migration reviewed by: ______________________________________
- Database and API tests run by: ______________________________
- Owner account tested by: ____________________________________
- Member account tested by (granted and revoked): _____________
- Plaintext confirmed absent from the database by: ____________
- Security reviewer approval date: ____________________________
- Remaining defects: __________________________________________
