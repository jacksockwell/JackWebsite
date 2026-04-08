# Supabase Setup

This site now supports a real browser login plus a private portfolio editor at `/admin.html`.

## What the new setup does

- Public portfolio page:
  loads published `art` projects from Supabase when configured
- Static fallback:
  if Supabase is not configured or has no published art yet, the site still uses `portfolio-data.js`
- Admin page:
  lets you sign in, import your current local portfolio, create/edit/delete grouped projects, upload media, and save drafts or WIPs

## Files involved

- `supabase-config.js`
- `supabase-shared.js`
- `portfolio-loader.js`
- `admin.html`
- `admin.js`
- `admin.css`
- `supabase-setup.sql`

## Setup steps

1. Create a Supabase project.

2. In the Supabase SQL Editor, run:

```sql
-- paste the contents of supabase-setup.sql
```

3. In Supabase Auth, create the admin user you want to use for the site.

4. Add that user to the `app_admins` table.

Example:

```sql
insert into public.app_admins (user_id)
select id
from auth.users
where email = 'you@example.com';
```

5. Open `supabase-config.js` and fill in your project values:

```js
window.SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR-ANON-KEY",
  projectTable: "portfolio_projects",
  storageBucket: "portfolio-media",
  publicSection: "art",
};
```

6. Deploy the site.

7. Visit `/admin.html`, sign in, and click `Import Local Portfolio` once to seed the database with your existing art posts.

## How content works

- `section = art`
  public portfolio can show it if it is also published
- `section = wips`
  saved for later and hidden from the public art section right now
- `status = draft`
  hidden from the public portfolio
- `status = published`
  visible on the public portfolio if the section is `art`

## Media uploads

- Thumbnail uploads go into the `thumbnails/` folder in the `portfolio-media` bucket.
- Project media uploads go into the `projects/` folder in the same bucket.
- Uploaded files are stored as public URLs so the static site can render them directly.

## Current workflow after setup

1. Go to `/admin.html`
2. Sign in
3. Create or pick a project
4. Set year label, sort order, section, and status
5. Add grouped media rows
6. Save

## Important note

The public site still keeps `portfolio-data.js` as a fallback. That means your site will not break while you are wiring Supabase up, and you can switch over gradually.
