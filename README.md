# Shine Time Operations v4 — Hostinger shell, Supabase backend

This is the original v4 PWA interface repackaged for normal Hostinger shared hosting. It is not a ChatGPT Site and not a visual mockup.

## Runtime split

| Component | Responsibility |
| --- | --- |
| Hostinger `public_html/app` | domain, PHP entry page, PWA files, cached UI assets |
| Supabase Auth | ADMIN/OPERATIONS_MANAGER/CLEANER/OWNER/PROPERTY_MANAGER sign-in and sessions |
| Supabase Edge Function `st-api` | authorization, v4 API contract, account administration, write operations |
| Supabase PostgreSQL | jobs, properties, routes, checklists, incidents, finance, notifications |
| Supabase Storage | protected proof photos |
| Supabase Realtime | concurrent job updates without polling |

The browser has only a Supabase publishable key. Database tables have RLS enabled; all business writes use the verified Edge Function with server-side role checks.

See `HOSTINGER_SETUP.md` for the upload and first-admin steps.
