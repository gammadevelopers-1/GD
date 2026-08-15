begin;

delete from public.app_milestone_items
where milestone_week_id in (
  select id from public.app_milestone_weeks
  where project_id in (
    select id from public.app_projects where id::text like 'd0900000%'
  )
);

delete from public.app_milestone_weeks
where project_id in (
  select id from public.app_projects where id::text like 'd0900000%'
);

delete from public.app_project_members
where project_id in (
  select id from public.app_projects where id::text like 'd0900000%'
);

delete from public.app_project_financials
where project_id in (
  select id from public.app_projects where id::text like 'd0900000%'
);

delete from public.app_project_technical_details
where project_id in (
  select id from public.app_projects where id::text like 'd0900000%'
);

delete from public.app_projects where id::text like 'd0900000%';
delete from public.app_clients where id::text like 'd0c00000%';

commit;
