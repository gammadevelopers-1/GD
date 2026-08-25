-- The transcript now takes whatever you give it: the assistant works out what
-- the file is and reads it the way that file wants to be read. A file that is
-- none of the known shapes is still worth keeping, so `kind` gains 'other'
-- rather than the upload being refused for having an unfamiliar extension.

alter table public.app_week_transcripts
  drop constraint if exists app_week_transcripts_kind_check;

alter table public.app_week_transcripts
  add constraint app_week_transcripts_kind_check
  check (kind in ('video', 'audio', 'voice', 'pdf', 'doc', 'image', 'other'));
