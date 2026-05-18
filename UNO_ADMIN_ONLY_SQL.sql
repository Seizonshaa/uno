alter table public.pixels add column if not exists source text;
alter table public.pixels add column if not exists share_image_url text;
alter table public.pixels add column if not exists device_id text;
alter table public.pixels add column if not exists browser_fingerprint text;

alter table public.pixels enable row level security;

drop policy if exists "Anyone can view pixels" on public.pixels;
drop policy if exists "Anyone can insert pixels" on public.pixels;

create policy "Anyone can view pixels"
on public.pixels for select to anon using (true);

create policy "Anyone can insert pixels"
on public.pixels for insert to anon
with check (device_id is not null and browser_fingerprint is not null);

grant usage on schema public to anon;
grant select, insert on public.pixels to anon;

drop policy if exists "Anyone can upload pixel images" on storage.objects;
drop policy if exists "Anyone can view pixel images" on storage.objects;

create policy "Anyone can upload pixel images"
on storage.objects for insert to anon
with check (bucket_id = 'pixel-images');

create policy "Anyone can view pixel images"
on storage.objects for select to anon
using (bucket_id = 'pixel-images');

grant usage on schema storage to anon;
grant select, insert on storage.objects to anon;
