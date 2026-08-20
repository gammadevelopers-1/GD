-- Team records.
--
-- The People placeholder becomes a real, owner-only Team workspace, so the
-- record behind a person now has to hold everything an owner needs about them:
-- job title, contact details, national ID, salary, bank account, contract.
--
-- Which table each column lands on is the whole security design here, not a
-- tidiness question. app_profiles is readable by anyone who shares a project
-- with you -- that is what private.can_view_profile() is for, and the project
-- team picker, milestone assignees and the portal team tab all depend on it.
-- So app_profiles takes only what a colleague may see: name, job title, work
-- phone, work email, and whether the account is live.
--
-- Everything personal -- CNIC, salary, bank details -- goes on
-- app_employment_private, which is owner-or-self and already excludes finance
-- by construction. A team member reaching a colleague's salary is the failure
-- this platform is least allowed to have, so the answer is that the column is
-- not in a table they can read, rather than a query that remembers to omit it.
--
-- Nothing about who can read a profile row changes in this migration. The Team
-- page is owner-only at the route and in its readers instead.

-- ---------------------------------------------------------------------------
-- What a colleague may see
-- ---------------------------------------------------------------------------

alter table public.app_profiles
  add column if not exists email text,
  add column if not exists job_title text,
  add column if not exists phone text,
  add column if not exists invited_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists created_by uuid references public.app_profiles(id) on delete restrict;

alter table public.app_profiles
  add constraint app_profiles_job_title_length
    check (job_title is null or char_length(job_title) between 2 and 120),
  add constraint app_profiles_phone_length
    check (phone is null or char_length(phone) between 5 and 32),
  add constraint app_profiles_email_shape
    check (email is null or email = lower(email));

-- Auth holds the address of record. This is a display copy so the directory
-- does not need a service-key round trip per person to show who someone is.
update public.app_profiles profile
set email = lower(btrim(account.email))
from auth.users account
where account.id = profile.id
  and profile.email is null
  and nullif(btrim(account.email), '') is not null;

comment on column public.app_profiles.email
is 'Display copy of the auth address. auth.users stays the address of record; this exists so the Team directory can list people without a service-key call.';

comment on column public.app_profiles.invited_at
is 'When the set-password email was last sent. Null means the person was created but never invited.';

comment on column public.app_profiles.activated_at
is 'First time the person set their own password. Null is the difference between "we sent it" and "they got in", and it is what the owner reads as pending.';

-- ---------------------------------------------------------------------------
-- What only an owner, or the person themselves, may see
-- ---------------------------------------------------------------------------

-- The employment row is created with the profile, before the owner has
-- collected any of this, so the two columns that were mandatory when a row was
-- only ever written complete stop being mandatory.
alter table public.app_employment_private
  alter column employment_type drop not null,
  alter column start_date drop not null;

alter table public.app_employment_private
  add column if not exists cnic text,
  add column if not exists bank_account_title text,
  add column if not exists bank_account_number text,
  add column if not exists bank_name text;

alter table public.app_employment_private
  add constraint app_employment_cnic_shape
    check (cnic is null or cnic ~ '^[0-9]{5}-[0-9]{7}-[0-9]$'),
  add constraint app_employment_bank_number_shape
    check (
      bank_account_number is null
      or bank_account_number ~ '^[A-Z0-9]{6,34}$'
    ),
  add constraint app_employment_bank_name_length
    check (bank_name is null or char_length(bank_name) between 2 and 120),
  add constraint app_employment_bank_title_length
    check (
      bank_account_title is null
      or char_length(bank_account_title) between 2 and 120
    );

comment on column public.app_employment_private.cnic
is 'Stored in the dashed 00000-0000000-0 form so two records of the same person cannot differ by punctuation.';

comment on table public.app_employment_private
is 'Owner-or-self only, and never finance. Salary, CNIC and bank details live here precisely because a colleague can read app_profiles.';

-- ---------------------------------------------------------------------------
-- Arriving
-- ---------------------------------------------------------------------------

-- A new member sets their own password and then has to record that they
-- arrived. They are not an owner, so profiles_owner_update denies them that
-- write. This is the only path to that stamp, and it can only ever set it for
-- the caller.
create or replace function public.app_member_activated()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := (select auth.uid());
begin
  if account_id is null then return; end if;

  update public.app_profiles
  set activated_at = coalesce(activated_at, now())
  where id = account_id
    and archived_at is null
    and is_active = true;

  if found then
    insert into public.app_audit_logs
      (actor_id, action, resource_type, resource_id, metadata)
    values (
      account_id, 'member.activated', 'app_profiles', account_id, '{}'::jsonb
    );
  end if;
end;
$$;

revoke all on function public.app_member_activated() from public, anon;
grant execute on function public.app_member_activated() to authenticated;
