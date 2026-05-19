# UNO Admin API Fixed

After deploying, test:

/admin-check.html
/admin.html
/api/admin-claim

/api/admin-claim should return:

{"ok":true,"route":"/api/admin-claim","message":"UNO admin API is working."}

Required Vercel Environment Variable:
ADMIN_SECRET=your-private-password

Optional:
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
