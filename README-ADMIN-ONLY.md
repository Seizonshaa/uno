# UNO Admin Panel Only

This version keeps your existing UNO website and adds only:

- `/admin.html`
- `/admin.js`
- `/api/admin-claim.js`

Use this for manually adding pixels from your X/Twitter account.

## What you need to do

### 1. Deploy this ZIP/folder to Vercel

Make sure the root contains:

```txt
index.html
script.js
style.css
admin.html
admin.js
api/
vercel.json
```

### 2. Add Vercel environment variable

Go to:

```txt
Vercel → Project → Settings → Environment Variables
```

Add:

```txt
ADMIN_SECRET=your-private-admin-password
```

Optional but recommended:

```txt
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Do not put the service role key inside frontend code.

### 3. Run this SQL in Supabase SQL Editor

```sql
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
```

### 4. Use admin panel

Open:

```txt
https://YOUR-VERCEL-DOMAIN.vercel.app/admin.html
```

Enter your `ADMIN_SECRET`.

Then you can:

- upload multiple images
- add X usernames as nicknames
- add short messages
- submit them to UNO
- copy generated pixel links
- reply to people on X manually

## Manual X workflow

1. Someone tags your UNO Twitter/X account with an image
2. You save the image
3. Open `/admin.html`
4. Upload the image
5. Add their username/message
6. Submit
7. Reply to them with their pixel link
