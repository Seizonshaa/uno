# UNO Global Premium

This is the polished Supabase-connected version of UNO.

## Files
- `index.html`
- `style.css`
- `script.js`

## Required Supabase setup

Create table:

```sql
create table public.pixels (
  id uuid primary key default gen_random_uuid(),
  nickname text,
  message text,
  image_url text not null,
  x integer not null,
  y integer not null,
  created_at timestamp with time zone default now()
);

alter table public.pixels enable row level security;

create policy "Anyone can view pixels"
on public.pixels
for select
using (true);

create policy "Anyone can insert pixels"
on public.pixels
for insert
with check (true);
```

Create public storage bucket:

```txt
pixel-images
```

Storage policies may be needed if upload fails:

```sql
create policy "Anyone can upload pixel images"
on storage.objects
for insert
with check (bucket_id = 'pixel-images');

create policy "Anyone can view pixel images"
on storage.objects
for select
using (bucket_id = 'pixel-images');
```

## Run locally
Open `index.html` in a browser, or use VS Code Live Server.


## X/Twitter preview cards

This version includes a free Netlify Function:

```txt
netlify/functions/pixel.js
```

and routing:

```txt
/pixel/:id
```

When someone shares a claimed pixel, the share URL becomes:

```txt
https://your-netlify-site.netlify.app/pixel/PIXEL_ID
```

That page renders real Open Graph and Twitter card meta tags so X can show the pixel image in the post preview.

## Important

Upload this entire folder/ZIP to Netlify. Do not upload only the HTML/CSS/JS files, because the preview feature needs:

```txt
netlify/functions/pixel.js
_redirects
netlify.toml
```

## Supabase storage policy needed

If uploads fail, run this in Supabase SQL Editor:

```sql
drop policy if exists "Anyone can upload pixel images" on storage.objects;
drop policy if exists "Anyone can view pixel images" on storage.objects;

create policy "Anyone can upload pixel images"
on storage.objects
for insert
to anon
with check (bucket_id = 'pixel-images');

create policy "Anyone can view pixel images"
on storage.objects
for select
to anon
using (bucket_id = 'pixel-images');

grant usage on schema storage to anon;
grant select, insert on storage.objects to anon;
```



## REQUIRED SQL for one claim per browser/device

Paste this in Supabase SQL Editor and run it:

```sql
alter table public.pixels
add column if not exists device_id text;

alter table public.pixels
add column if not exists browser_fingerprint text;

create unique index if not exists pixels_device_id_unique
on public.pixels(device_id)
where device_id is not null;

create unique index if not exists pixels_browser_fingerprint_unique
on public.pixels(browser_fingerprint)
where browser_fingerprint is not null;

drop policy if exists "Anyone can view pixels" on public.pixels;
drop policy if exists "Anyone can insert pixels" on public.pixels;

alter table public.pixels enable row level security;

create policy "Anyone can view pixels"
on public.pixels
for select
to anon
using (true);

create policy "Anyone can insert pixels"
on public.pixels
for insert
to anon
with check (
    device_id is not null
    and browser_fingerprint is not null
);

grant usage on schema public to anon;
grant select, insert on public.pixels to anon;
```


## REQUIRED SQL for real PNG X/Twitter share cards

Run this in Supabase SQL Editor:

```sql
alter table public.pixels
add column if not exists share_image_url text;
```

This version creates a real 1200x630 PNG card in the browser when a pixel is claimed, uploads it to Supabase Storage, and uses that PNG in the X/Twitter preview.

If old pixels still show no image, claim a new pixel after this update. Old X previews may be cached.


## Better X preview card

This update changes only the generated PNG X/Twitter preview card design.

Run this SQL once if you have not already:

```sql
alter table public.pixels
add column if not exists share_image_url text;
```

After redeploying, claim a new pixel to test the new preview card. X can cache older links.
