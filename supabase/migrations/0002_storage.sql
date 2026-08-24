-- Public bucket for baby photos. Anyone can read (fine, just baby pictures);
-- only the service-role key (used server-side in admin routes) can write.
insert into storage.buckets (id, name, public)
values ('baby-photos', 'baby-photos', true)
on conflict (id) do nothing;
