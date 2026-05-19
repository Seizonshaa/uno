# UNO Vercel Ready

This ZIP is ready for Vercel.

## What changed from Netlify

- Removed Netlify Functions
- Added Vercel API route:
  - `api/pixel/[id].js`
- Added `vercel.json`
- Keeps share URLs like:
  - `/pixel/PIXEL_ID`

## Deploy on Vercel

1. Go to Vercel
2. Create a new project
3. Upload/import this folder
4. Deploy

## Supabase SQL needed

Make sure this column exists:

```sql
alter table public.pixels
add column if not exists share_image_url text;
```

For one-claim-per-device, make sure you already ran:

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
```

## Testing X preview

After deployment:
1. Claim a new pixel
2. Share the `/pixel/PIXEL_ID` URL
3. X may cache old links, so test with a new pixel
