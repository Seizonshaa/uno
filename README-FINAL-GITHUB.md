# UNO Final GitHub Ready

This ZIP contains the complete Vercel/GitHub-ready UNO project.

## Included

- Main UNO website
- Existing Supabase connection
- `/admin.html` admin panel
- `/admin` route
- `/api/admin-claim`
- `/api/admin-list`
- `/api/admin-delete`
- `/api/pixel/[id].js`
- `/api/og/[id].js`
- `package.json` with `@vercel/og`
- `vercel.json`
- `UNO_FINAL_SQL.sql`

## Upload to GitHub

Upload all files and folders from this ZIP into the root of your repo.

Your repo root must show:

```txt
index.html
script.js
style.css
admin.html
admin/
api/
package.json
vercel.json
UNO_FINAL_SQL.sql
```

The api folder must contain:

```txt
api/admin-claim.js
api/admin-list.js
api/admin-delete.js
api/pixel/[id].js
api/og/[id].js
```

## Vercel settings

Add this environment variable:

```txt
ADMIN_SECRET=your-private-password
```

Optional but recommended:

```txt
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Then redeploy.

## Supabase

Run `UNO_FINAL_SQL.sql` in Supabase SQL Editor.

## Test URLs

```txt
https://unopixels.vercel.app/admin.html
https://unopixels.vercel.app/api/admin-claim
https://unopixels.vercel.app/api/og/PIXEL_ID.png
https://unopixels.vercel.app/pixel/PIXEL_ID
```

`/api/admin-claim` should show JSON.

`/api/og/PIXEL_ID.png` should show the white X preview card.

X caches old previews. Test with a new pixel link.
