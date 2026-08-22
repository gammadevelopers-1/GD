-- The dashboard used to run five round trips one after another: overdue cards,
-- then every week of every active project, then every card of those weeks, then
-- six weeks of completions, then invoices. Each hop cost a full request to the
-- Data API, and the card reads pulled whole rows across the wire only to count
-- them. This rolls the whole screen into one call that counts in Postgres.
--
-- Security definer for the same reason public.app_project_portfolio is: the
-- aggregates span projects, so the function decides visibility itself using the
-- same private helpers the row level security policies use. Nothing here widens
-- what an account can read -- a member still only sees projects they are on, and
-- the money block is owner and finance only, exactly as app_invoices policies say.

create or replace function public.app_invoice_pkr(
  amount numeric,
  currency public.app_currency,
  rate numeric
)
returns numeric
language sql
immutable
set search_path = ''
as $$ select case when currency = 'PKR' then amount else amount * rate end $$;

create or replace function public.app_invoice_usd(
  amount numeric,
  currency public.app_currency,
  rate numeric
)
returns numeric
language sql
immutable
set search_path = ''
as $$ select case when currency = 'USD' then amount else amount / rate end $$;

grant execute on function public.app_invoice_pkr(numeric, public.app_currency, numeric) to authenticated;
grant execute on function public.app_invoice_usd(numeric, public.app_currency, numeric) to authenticated;

create or replace function public.app_dashboard_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with visible_projects as (
    select project.*
    from public.app_projects project
    where (select private.can_use_projects())
      and (
        (select private.is_owner())
        or (select private.is_project_member(project.id))
      )
      and project.archived_at is null
      and project.status not in ('paused', 'closed')
  ),
  visible_weeks as (
    select week.id, week.project_id, week.due_on
    from public.app_milestone_weeks week
    where week.archived_at is null
      and (select private.can_work_on_project(week.project_id))
  ),
  project_weeks as (
    select week.id, week.project_id
    from visible_weeks week
    where week.project_id in (select id from visible_projects)
  ),
  card_rollup as (
    select
      week.project_id as project_id,
      count(card.id)::integer as total_cards,
      count(card.id) filter (where card.status <> 'completed')::integer as open_cards
    from project_weeks week
    join public.app_milestone_cards card
      on card.milestone_week_id = week.id
      and card.archived_at is null
    group by week.project_id
  ),
  overdue as (
    select count(card.id)::integer as overdue_cards
    from visible_weeks week
    join public.app_milestone_cards card
      on card.milestone_week_id = week.id
      and card.archived_at is null
      and card.status <> 'completed'
    where week.due_on < current_date
  ),
  readable_weeks as (
    select week.id
    from public.app_milestone_weeks week
    where (select private.can_work_on_project(week.project_id))
  ),
  completions as (
    select card.completed_at
    from readable_weeks week
    join public.app_milestone_cards card
      on card.milestone_week_id = week.id
      and card.archived_at is null
    where card.status = 'completed'
      and card.completed_at is not null
      and card.completed_at >= now() - interval '42 days'
  ),
  delivery as (
    select
      bucket.back as back,
      count(completion.completed_at)::integer as done
    from generate_series(5, 0, -1) as bucket(back)
    left join completions completion
      on completion.completed_at >= now() - ((bucket.back + 1) * 7 || ' days')::interval
      and completion.completed_at < now() - (bucket.back * 7 || ' days')::interval
    group by bucket.back
  ),
  money as (
    select
      coalesce(sum(
        case when invoice.status = 'paid'
          and invoice.paid_at >= date_trunc('month', now())
        then public.app_invoice_pkr(invoice.amount, invoice.currency, invoice.exchange_rate_to_pkr) end
      ), 0)::numeric as revenue_pkr,
      coalesce(sum(
        case when invoice.status = 'paid'
          and invoice.paid_at >= date_trunc('month', now())
        then public.app_invoice_usd(invoice.amount, invoice.currency, invoice.exchange_rate_to_pkr) end
      ), 0)::numeric as revenue_usd,
      coalesce(sum(
        case when invoice.status = 'paid'
          and invoice.paid_at >= date_trunc('month', now()) - interval '1 month'
          and invoice.paid_at < date_trunc('month', now())
        then public.app_invoice_pkr(invoice.amount, invoice.currency, invoice.exchange_rate_to_pkr) end
      ), 0)::numeric as revenue_pkr_previous,
      coalesce(sum(
        case when invoice.status in ('sent', 'overdue')
        then public.app_invoice_pkr(invoice.amount, invoice.currency, invoice.exchange_rate_to_pkr) end
      ), 0)::numeric as unpaid_pkr,
      coalesce(sum(
        case when invoice.status in ('sent', 'overdue')
        then public.app_invoice_usd(invoice.amount, invoice.currency, invoice.exchange_rate_to_pkr) end
      ), 0)::numeric as unpaid_usd,
      count(*) filter (where invoice.status in ('sent', 'overdue'))::integer as unpaid_count,
      count(*) filter (where invoice.status = 'overdue')::integer as overdue_count,
      coalesce(sum(
        case when invoice.status = 'overdue'
        then public.app_invoice_pkr(invoice.amount, invoice.currency, invoice.exchange_rate_to_pkr) end
      ), 0)::numeric as overdue_pkr
    from public.app_invoices invoice
    where invoice.archived_at is null
      and invoice.status <> 'void'
      and ((select private.is_owner()) or (select private.is_finance()))
  )
  select jsonb_build_object(
    'projects', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', project.id,
          'public_id', project.public_id,
          'name', project.name,
          'status', project.status,
          'due_on', project.due_on,
          'client_name', client.name,
          'lead_name', lead.full_name,
          'progress', case
            when coalesce(rollup.total_cards, 0) = 0 then 0
            else round(
              ((rollup.total_cards - rollup.open_cards)::numeric / rollup.total_cards) * 100
            )::integer
          end,
          'has_weeks', exists (select 1 from project_weeks week where week.project_id = project.id)
        )
        order by project.due_on asc nulls last
      )
      from visible_projects project
      left join public.app_clients client on client.id = project.client_id and client.archived_at is null
      left join public.app_profiles lead on lead.id = project.lead_id and lead.is_active and lead.archived_at is null
      left join card_rollup rollup on rollup.project_id = project.id
    ), '[]'::jsonb),
    'overdue_cards', (select overdue_cards from overdue),
    'shipped_current', (
      select count(*)::integer from completions
      where completed_at >= now() - interval '7 days'
    ),
    'shipped_previous', (
      select count(*)::integer from completions
      where completed_at >= now() - interval '14 days'
        and completed_at < now() - interval '7 days'
    ),
    'delivery', coalesce((
      select jsonb_agg(jsonb_build_object('back', back, 'done', done) order by back desc)
      from delivery
    ), '[]'::jsonb),
    'financials', case
      when (select private.is_owner()) or (select private.is_finance())
      then (select to_jsonb(money) from money)
      else null
    end
  )
$$;

comment on function public.app_dashboard_summary()
is 'Everything the internal overview screen shows, counted in one round trip. Visibility mirrors the row level security policies: members see only their projects, and the financials block is null for anyone who is not owner or finance.';

revoke all on function public.app_dashboard_summary() from public;
revoke all on function public.app_dashboard_summary() from anon;
grant execute on function public.app_dashboard_summary() to authenticated;
