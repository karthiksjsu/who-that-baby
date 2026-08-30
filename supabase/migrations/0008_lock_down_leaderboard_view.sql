-- Close the one door RLS left open.
--
-- Every table has row level security on with no anon policies, so the public
-- key that ships in the browser bundle cannot read a single row — but the
-- leaderboard view is not a table. A view runs as its owner by default, so
-- selecting from it would have gone straight past the policies on the tables
-- underneath. Only names and scores are behind it, which the leaderboard page
-- shows anyway, but "the anon key can reach exactly nothing" is a much easier
-- rule to keep true than "the anon key can reach nothing that matters".
--
-- The app reads this view with the service-role key from the server, which is
-- unaffected by both statements below.
revoke all on public.leaderboard from anon, authenticated;

-- And make the view itself honour the caller's policies, so a future grant
-- cannot quietly re-open it. Postgres 15+; older servers keep the revoke.
do $$
begin
  execute 'alter view public.leaderboard set (security_invoker = on)';
exception
  when others then
    raise notice 'security_invoker unavailable; the revoke above still applies';
end
$$;
