# Deploying the NGO Internship Portal — step by step

This guide takes you from a downloaded copy of the project to a live website that real volunteers and NGO staff
can use. You do not need to be a developer to follow it, but you will copy and paste a few commands and a block of SQL.

**Time needed:** about 60–90 minutes the first time.

```
 Volunteers / NGO staff (browser)
            │  HTTPS
            ▼
   ┌─────────────────────┐        ┌───────────────────────────────┐
   │  Vercel             │──────► │  Supabase                     │
   │  hosts the website  │        │  • Auth (logins)              │
   │  + its small API    │        │  • Postgres database + rules  │
   └─────────┬───────────┘        │  • Storage (résumé files)     │
             │                    └───────────────────────────────┘
             ▼
   ┌─────────────────────┐
   │  Resend             │  sends: "application received", "approved",
   │  sends the e-mails  │  "project assigned" and admin-invite e-mails
   └─────────────────────┘
```

---

## Contents

0. [Before you start](#0-before-you-start)
1. [Get the code and check it works](#1-get-the-code-and-check-it-works)
2. [Create the Supabase project](#2-create-the-supabase-project)
3. [Set up the database](#3-set-up-the-database)
4. [Configure sign-in (Authentication)](#4-configure-sign-in-authentication)
5. [Copy your API keys](#5-copy-your-api-keys)
6. [Create the first admin account](#6-create-the-first-admin-account)
7. [Set up Resend (e-mail)](#7-set-up-resend-e-mail)
8. [Put the code on GitHub](#8-put-the-code-on-github)
9. [Deploy on Vercel](#9-deploy-on-vercel)
10. [Connect Supabase to your live URL](#10-connect-supabase-to-your-live-url)
11. [Optional: your own domain](#11-optional-your-own-domain)
12. [Test the live site (smoke test)](#12-test-the-live-site-smoke-test)
13. [Go-live checklist](#13-go-live-checklist)
14. [Updating the live site later](#14-updating-the-live-site-later)
15. [Troubleshooting](#15-troubleshooting)
16. [Reference: environment variables](#16-reference-environment-variables)
17. [Reference: useful SQL](#17-reference-useful-sql)

---

## 0. Before you start

### Accounts you need (all have a free starting plan)

| Service | What it does | Sign up |
| :--- | :--- | :--- |
| **GitHub** | Stores the code; Vercel deploys from it | github.com |
| **Supabase** | Database, logins, file storage | supabase.com |
| **Vercel** | Runs the website | vercel.com |
| **Resend** | Sends e-mails *(optional but strongly recommended)* | resend.com |
| A **domain name** | e.g. `portal.yourngo.org` *(optional)* | any registrar |

Use an e-mail address that belongs to the **organisation** (not one person's private inbox) when creating these
accounts, and turn on **two-factor authentication** on each of them — these accounts control all your data.

### On your computer

* **Node.js 20.9 or newer** (22 recommended) — check with `node -v`. Download from nodejs.org if needed.
* **Git** — check with `git --version`.
* A text editor (VS Code, Notepad++, anything).

### Things to know about the free plans *(check each provider's current terms)*

| Topic | What to know |
| :--- | :--- |
| **Supabase free plan pausing** | A Free-plan project with very low activity over 7 days may be **paused**; you can restore it from the dashboard, and the Pro plan guarantees it won't be paused. A paused project means nobody can sign in. |
| **Supabase backups** | Database backups are **not downloadable** on the Free plan. If the data matters, plan to use Pro or export data regularly (see section 13). |
| **Supabase built-in e-mail** | Supabase's own mailer is meant for testing and is heavily limited (about 2 e-mails/hour). This app avoids depending on it — see step 4. |
| **Vercel Hobby (free) plan** | Vercel restricts Hobby to **non-commercial, personal use**. A production portal run by an organisation — especially if anyone involved is paid — may not qualify. Check Vercel's *Fair Use Guidelines* or ask their support; the Pro plan is the safe choice for an organisation. |
| **Resend** | The free "test" sender can only deliver to your own account's e-mail address. To e-mail real applicants you must verify a domain (step 7). |

---

## 1. Get the code and check it works

1. Unzip the project to a folder, e.g. `C:\projects\ngo-portal` or `~/ngo-portal`.
2. Open a terminal **inside that folder** (the one containing `package.json`).
3. Install the dependencies:

   ```bash
   npm ci
   ```
   Expected: it ends with something like `added 434 packages`. *(If it prints an error mentioning
   `package-lock.json`, see [Troubleshooting](#15-troubleshooting).)*

4. Run the automated tests — they check the security rules of the database, the e-mail protections and the
   approval workflow:

   ```bash
   npm test
   ```
   Expected: `Test Files  7 passed` and `Tests  64 passed`. **Do not continue if any test fails.**

5. *(Optional)* Try the site locally in demo mode:

   ```bash
   npm run dev
   ```
   Open <http://localhost:3000>. A yellow **"Connected Mode / Quick Jump"** banner means demo mode (fake accounts,
   data stored only in your browser). This is normal at this point. Press `Ctrl+C` to stop.

> **Important:** demo mode includes a one-click "Admin Console" button. It must **never** be what real users see.
> The project protects you from this (the production build refuses to publish without Supabase — see step 9), but
> you will also verify it in step 12.

---

## 2. Create the Supabase project

1. Go to <https://supabase.com/dashboard> and sign in.
2. Click **New project**. Choose your **Organization**.
3. Fill in:
   * **Name:** e.g. `ngo-internship-portal`
   * **Database password:** click *Generate a password*, then **save it in your password manager**. You rarely need
     it, but you cannot see it again later.
   * **Region:** pick the one closest to your users (e.g. *South Asia (Mumbai)* for India).
4. Click **Create new project** and wait 1–2 minutes until the dashboard finishes setting up.

---

## 3. Set up the database

This creates every table, the security rules (who may see/change what), the sign-up automation, and the private
storage bucket for résumés — all in one go.

1. In the Supabase dashboard open **SQL Editor** (left sidebar) → **New query**.
2. On your computer open the file **`supabase/schema.sql`** from the project, select **all** of it (`Ctrl+A`),
   copy (`Ctrl+C`).
3. Paste it into the SQL Editor and click **Run** (bottom right).
4. Expected result: **"Success. No rows returned"**.
   *The script is safe to run again later — it will not delete data.*

### Verify it worked (important)

Open a **new query**, paste this, and click **Run**:

```sql
select 'functions' as check, string_agg(proname, ', ' order by proname) as result
  from pg_proc
  where proname in ('is_admin', 'protect_profile_columns', 'handle_new_user')
union all
select 'tables without security (should be empty)',
       coalesce(string_agg(c.relname, ', '), '(none)')
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
union all
select 'résumé bucket is private',
       coalesce((select (not public)::text from storage.buckets where id = 'resumes'), 'MISSING');
```

Expected output:

| check | result |
| :--- | :--- |
| functions | `handle_new_user, is_admin, protect_profile_columns` |
| tables without security (should be empty) | `(none)` |
| résumé bucket is private | `true` |

If anything differs, stop and re-run the script (step 3.3). If `handle_new_user` or `is_admin` is missing, you pasted
only part of the file.

> **Why this matters:** an earlier version of the schema made *every* sign-in fail with the error
> `infinite recursion detected in policy for relation "profiles"`. The `is_admin` function is the fix. If you ever
> see that error, your database has an old copy of the schema — re-run the current `schema.sql`.

---

## 4. Configure sign-in (Authentication)

### 4.1 Decide about "Confirm email"

Go to **Authentication → Sign In / Providers → Email** (the menu wording may vary slightly between dashboard
versions).

| Setting | Recommended | Why |
| :--- | :--- | :--- |
| **Confirm email** | **OFF** (unless you set up custom SMTP below) | New volunteers are not allowed into the portal until an admin approves them anyway. With confirmation ON, every applicant triggers a Supabase e-mail, and Supabase's built-in mailer allows only a handful per hour — applications would start failing after a few sign-ups. |
| **Allow new users to sign up** | **ON** | Volunteers apply by creating an account. |

Click **Save**.

### 4.2 *(Only if you want "Confirm email" ON)* Custom SMTP

Go to **Authentication → SMTP Settings**, switch on **Enable Custom SMTP** and enter your provider's details. For
Resend these are typically host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key
(verify against Resend's current SMTP documentation). Use a sender address on your verified domain.
Supabase's default limit after enabling custom SMTP is about 30 new users per hour and can be adjusted under
**Authentication → Rate Limits**.

### 4.3 URL Configuration — do this twice

Go to **Authentication → URL Configuration**.

* **Now:** you don't know the live address yet, so leave it for step 10.
* **After the first deploy (step 10):** you will set **Site URL** and **Redirect URLs** so admin-invite links come back to your website.

---

## 5. Copy your API keys

Go to **Project Settings → API Keys** (older projects: **Project Settings → API**). You need three values.

| You need | Where to find it | Looks like |
| :--- | :--- | :--- |
| **Project URL** | *Project Settings → API* (or the **Connect** button at the top) | `https://abcdefghijkl.supabase.co` |
| **Browser key** (safe to expose) | New keys: **Publishable key** · Older: `anon` key (under *Legacy API Keys*) | `sb_publishable_…` or a long `eyJ…` |
| **Server key** (**SECRET**) | New keys: **Secret key** · Older: `service_role` key (under *Legacy API Keys*) | `sb_secret_…` or a long `eyJ…` |

Notes:

* Supabase now issues **publishable** and **secret** keys and is phasing out the old `anon` / `service_role` keys.
  New projects may only show the new ones. If you see a **Create new API keys** button, click it. **Either kind of
  key works with this app** — just use a matching pair (both new or both legacy).
* The **secret / service_role key bypasses all security rules.** Treat it like a bank password: never put it in a
  chat, an e-mail, a screenshot, a public repository, or any variable starting with `NEXT_PUBLIC_`.
* Paste the three values into a private note for now; you will use them in steps 6 and 9.

> *Tested note:* the app code and database rules were tested against real PostgreSQL. I could not test the new
> `sb_…` key formats against a live Supabase project from here. If a new key is rejected, the **Legacy API Keys**
> tab provides the old pair, which the app also accepts.

---

## 6. Create the first admin account

Public sign-up only ever creates *pending volunteers* — nobody can make themselves an admin. So the **very first**
admin has to be created once from the Supabase dashboard. After that, admins invite other admins from inside the
portal (**Admin Team** page); nobody needs the database again.

1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Enter the director's/administrator's e-mail and a strong password. **Tick "Auto Confirm User"**. Click
   **Create user**.
3. Go to **SQL Editor → New query**, paste the following, **change the e-mail**, and **Run**:

   ```sql
   UPDATE public.profiles
   SET role               = 'admin',
       application_status = 'approved',
       joinee_id          = 'ADM-' || to_char(NOW(), 'YYYYMMDD') || '-001',
       joined_at          = NOW()
   WHERE email = 'director@yourngo.org';
   ```
   Expected: **"Success. 1 row affected"** (or similar). *0 rows* means the e-mail doesn't match what you typed in
   step 2 — check for typos.

You will sign in with this account in step 12.

---

## 7. Set up Resend (e-mail)

*Skip this step to try the site first — everything still works. Without Resend, e-mails are only written to the
server log, and the Admin Team page shows invite links for you to send by hand. But volunteers won't receive
"application received / approved" e-mails, so set it up before real use.*

1. Sign up at <https://resend.com>.
2. **Domains → Add Domain**: enter your domain (e.g. `yourngo.org`) and choose a region.
3. Resend shows several **DNS records** (SPF, DKIM, and others). Log in to wherever your domain is managed
   (GoDaddy, Namecheap, Cloudflare, …) and add each record exactly as shown. Back in Resend click **Verify**.
   DNS changes can take from a few minutes up to a day.
4. **API Keys → Create API Key**: give it a name (e.g. `ngo-portal`), permission **Sending access**, restricted to
   your domain if offered. **Copy the key now — it is shown only once.**
5. Decide the sender address, on your verified domain, e.g.:

   ```
   NGO Portal <noreply@yourngo.org>
   ```

You now have two more values: `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

> **No domain yet?** For testing only, leave `RESEND_FROM_EMAIL` unset: Resend's test sender will deliver **only**
> to the e-mail address of your own Resend account.

---

## 8. Put the code on GitHub

Vercel deploys whatever is in your GitHub repository, and redeploys automatically when you update it.

1. On GitHub: **New repository** → name it (e.g. `ngo-internship-portal`) → choose **Private** → *do not* tick
   "Add a README" → **Create repository**.
2. In your terminal, in the project folder:

   ```bash
   git init
   git add .
   git status
   ```
3. **Safety check before committing.** Run:

   ```bash
   git ls-files | grep -i "\.env"
   ```
   It must print **only** `.env.example`. If it prints `.env.local` or anything else, **stop** — remove it from Git
   (`git rm --cached .env.local`) before continuing. Real secrets must never be uploaded. (On Windows PowerShell use
   `git ls-files | Select-String "\.env"`.)
4. Commit and upload (use the exact commands GitHub shows on the empty repository page; they look like this):

   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-ACCOUNT/ngo-internship-portal.git
   git push -u origin main
   ```
5. Refresh the GitHub page — your files should appear. The project includes a **CI** workflow
   (`.github/workflows/ci.yml`): open the repository's **Actions** tab; a green tick means type-checks, lint, the
   tests and a build all passed.

---

## 9. Deploy on Vercel

1. Go to <https://vercel.com/new> and sign in (**Continue with GitHub** is easiest). Authorise Vercel to read your
   repository when asked.
2. Find your repository in the list and click **Import**.
3. On the configuration screen:
   * **Framework Preset:** *Next.js* (detected automatically).
   * **Root Directory:** leave as `./`.
   * Leave **Build Command** / **Output Directory** as default. No `vercel.json` is needed.
4. Open **Environment Variables** and add these **before** deploying (type the name, paste the value, click
   *Add*). Leave all environments ticked, or at least **Production**:

   | Name | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_SUPABASE_URL` | the Project URL from step 5 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the **publishable** (or `anon`) key from step 5 |
   | `SUPABASE_SERVICE_ROLE_KEY` | the **secret** (or `service_role`) key from step 5 |
   | `RESEND_API_KEY` | from step 7 *(skip if not using e-mail yet)* |
   | `RESEND_FROM_EMAIL` | e.g. `NGO Portal <noreply@yourngo.org>` — **type it without surrounding quotes** |

   *(`NEXT_PUBLIC_SITE_URL` is added in step 10, once you know the address.)*

   Rules: no spaces before/after a value, no quotes, and **do not** add `ALLOW_DEMO_BUILD`.

   > The three Supabase variables are mandatory. If any is missing, the **Production build stops on purpose** with
   > *"Refusing to build production without Supabase — the site would ship in demo mode with open admin access."*
   > This protects you; add the variable and redeploy.
5. Click **Deploy**. The build takes 1–3 minutes. When it shows **Congratulations**, note your address, e.g.
   `https://ngo-internship-portal.vercel.app` — click **Continue to Dashboard**.
6. *(Recommended)* In the Vercel project open **Settings** and find **Node.js Version** (it sits under *General* or
   *Build and Deployment* depending on the dashboard version) → choose **22.x** (20.9 or newer also works).

### About "Preview" deployments

Every branch or pull request gets its own temporary *preview* address. Only the **Production** build refuses to run
without Supabase; a preview built without the variables would run in demo mode. Keep **Settings → Deployment
Protection → Vercel Authentication** switched on (it is the default) so previews are not public, or add the same
variables to the *Preview* environment (ideally pointing at a separate test Supabase project).

---

## 10. Connect Supabase to your live URL

The admin-invite e-mail contains a link that must return to *your* website, so Supabase has to know the address.

1. **Supabase → Authentication → URL Configuration**:
   * **Site URL:** your live address, e.g. `https://ngo-internship-portal.vercel.app` *(no trailing slash)*.
   * **Redirect URLs → Add URL:** add
     * `https://ngo-internship-portal.vercel.app/accept-invite`
     * *(optional, for local testing)* `http://localhost:3000/accept-invite`
   * Click **Save**. The addresses must match exactly (including `https` and `www` if you use it).
2. **Vercel → your project → Settings → Environment Variables**: add

   | Name | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_SITE_URL` | the same live address, no trailing slash |

3. **Redeploy** — variables beginning with `NEXT_PUBLIC_` are baked into the site when it is built, so changing
   them does nothing until you rebuild: **Deployments** tab → the latest deployment → **⋯ → Redeploy**
   (untick "use existing build cache" if offered).

---

## 11. Optional: your own domain

1. Vercel → project → **Settings → Domains → Add** → enter e.g. `portal.yourngo.org`.
2. Vercel shows the exact **DNS record** to create (usually a CNAME for a sub-domain). Add it at your domain
   registrar and wait until Vercel shows a green tick. HTTPS is provisioned automatically.
3. **Update the address everywhere** (this is the step people forget):
   * Supabase → URL Configuration: change **Site URL** and the `…/accept-invite` **Redirect URL** to the new domain.
   * Vercel → `NEXT_PUBLIC_SITE_URL` → the new domain, then **Redeploy**.

---

## 12. Test the live site (smoke test)

Do these in order. Use a normal window for the admin and a **private/incognito window** for the volunteer.

| # | Do this | You should see | If not |
| :-: | :--- | :--- | :--- |
| 1 | Open your live address. | The landing page. A **green "Live Mode — Connected to Supabase"** banner. **No** yellow "Quick Jump" buttons. | Yellow banner = the Supabase variables did not reach the build. Fix them in Vercel and redeploy. |
| 2 | Sign in with the admin from step 6. | You land on **Admin Dashboard**. | See troubleshooting: *"User profile not found"* / *"infinite recursion"*. |
| 3 | **Settings** → check the organisation name, intake window and supervisors → **Save**. | "Settings saved". | Table `org_settings` missing → re-run `schema.sql`. |
| 4 | *(Incognito)* **Apply** tab → fill the form, attach a small PDF → Submit. | "Application Submitted" screen. An "application received" e-mail arrives *(if Resend is set up)*. | See troubleshooting: résumé / e-mail. |
| 5 | *(Incognito)* Try to **Sign in** as that applicant. | Blocked: *"Your internship application is still under review…"* | If they get in, the database is not the current version — re-run `schema.sql`. |
| 6 | *(Admin)* **Student Applications**. | The new row. **View/Download** opens the résumé. | Bucket `resumes` missing → re-run `schema.sql`. |
| 7 | *(Admin)* **Approve** it. | Row turns Approved; an "approved" e-mail is sent. A **joinee ID** like `STU-20261005-001` appears in the **Student Directory**. | A red error banner explains what went wrong; nothing is saved or e-mailed when it fails. |
| 8 | *(Incognito)* Sign in as the volunteer. | Student dashboard; profile shows the joinee ID. | — |
| 9 | *(Incognito, signed in as the volunteer)* open `/admin/dashboard`. | Redirected to **Unauthorized**. | — |
| 10 | *(Admin)* **Projects** → create one → assign the volunteer. | The volunteer sees it on their dashboard and gets an e-mail. | — |
| 11 | *(Volunteer, on a phone)* **Attendance → Check in**. | The browser asks permission to use location; the check-in records GPS. Admin sees it and can **Verify**. | GPS needs HTTPS (automatic on Vercel) and the user must allow location. |
| 12 | *(Admin)* **Admin Team** → invite a second person. | An e-mail with an invite link is sent (or the link is shown on screen to copy). The invitee opens it, sets a password and reaches the admin dashboard. | "Redirect URL not allowed" → step 10. "SUPABASE_SERVICE_ROLE_KEY is missing" → step 9. |
| 13 | *(Admin)* **Sign out**, then open `/admin/dashboard` directly. | You are sent to the **sign-in page**. | The sign-out did not clear the session — clear the site's cookies and retry; report it if it persists. |

When all 13 pass, the technical deployment is finished.

---

## 13. Go-live checklist

**Accounts & secrets**
- [ ] Two-factor authentication on GitHub, Supabase, Vercel, Resend and your domain registrar.
- [ ] At least **two** people can access each account (so the NGO isn't locked out if one person leaves).
- [ ] The secret / `service_role` key exists only in Vercel's environment variables (and your password manager).
      If it was ever pasted anywhere public, **rotate it** (Supabase → API Keys → create a new secret key, update
      Vercel, redeploy, then delete the old one).
- [ ] You have a second admin invited (step 12, test 12), so one forgotten password is not a crisis.

**Data protection**
- [ ] Enable **Supabase backups** you can rely on: upgrade to Pro for scheduled backups, or regularly export tables
      (Supabase → Table Editor → the Export option for CSV) and download the `resumes` files you need.
- [ ] Résumés and GPS locations are **personal data**. Publish a short privacy notice, tell volunteers what you
      store and for how long, and decide a retention period. Depending on your location, laws such as India's data
      protection legislation may apply — ask a legal adviser.
- [ ] Decide who may be an admin: admins can see every volunteer's details, résumés and locations.

**Reliability**
- [ ] If you stay on Supabase's Free plan, make sure someone uses the site at least weekly, or upgrade, so the
      project isn't paused.
- [ ] Know where to look when something breaks: **Vercel → project → Logs** (server errors, e-mail failures) and
      **Supabase → Logs**.
- [ ] Resend → **Logs** shows every e-mail and why a delivery failed.

**Housekeeping**
- [ ] Occasionally open **Supabase → Storage → resumes** and delete files from abandoned applications (uploads
      happen before sign-up completes, so an application that fails can leave an orphan file).

---

## 14. Updating the live site later

| You want to… | Do this |
| :--- | :--- |
| Change the code | Edit locally → `npm test` → `git add . && git commit -m "…" && git push`. Vercel builds and publishes automatically. |
| Change the database | Edit `supabase/schema.sql` → paste it into the Supabase SQL Editor → Run (safe to re-run). Do this **before** deploying code that needs the new columns. |
| Change an environment variable | Vercel → Settings → Environment Variables → edit → **Redeploy** (required for `NEXT_PUBLIC_…` ones). |
| Undo a bad release | Vercel → **Deployments** → open the last good deployment → **Promote to Production** (or "Instant Rollback"). |
| Change org name, intake dates, supervisors | No code needed: **Admin → Settings** inside the portal. |
| Add another admin | **Admin → Admin Team** inside the portal. |

---

## 15. Troubleshooting

| What you see | Likely cause | Fix |
| :--- | :--- | :--- |
| `npm ci` fails: *"package.json and package-lock.json are not in sync"* | The lock file is out of date. | Run `npm install`, commit the updated `package-lock.json`. |
| Vercel build fails: *"Refusing to build production without Supabase"* | The Supabase variables are missing in the **Production** environment. | Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (step 9) and redeploy. |
| The live site shows the yellow **"Connected Mode / Quick Jump"** banner | Built without Supabase variables (demo mode). **Do not use it.** | Fix the variables, redeploy, confirm the green "Live Mode" banner. |
| Login says **"User profile not found. Ensure schema.sql is executed."** | `schema.sql` was not run, or only partly. | Re-run the whole file (step 3) and the verification query. Also confirm you created the user *after* the schema (the profile row is created by a trigger at sign-up). |
| Any query fails with **`infinite recursion detected in policy for relation "profiles"`** | The database has an *old* schema. | Re-run the current `supabase/schema.sql`. |
| Admin Team: **"SUPABASE_SERVICE_ROLE_KEY is missing"** | Server key not set. | Add it in Vercel (step 9), redeploy. |
| Invite link leads to an error such as **"Redirect URL not allowed"**, or lands on the wrong site | Supabase URL Configuration doesn't list your live `/accept-invite` address. | Step 10; the addresses must match exactly. |
| Invite link says it's **expired/invalid** immediately | Some e-mail security tools "click" links to scan them, which uses up the one-time link. Or it genuinely expired. | Invite the person again (**Admin Team** → invite the same e-mail — it replaces the old invite). If it keeps happening, send the link by another channel. |
| *"That email already has an account in the portal"* when inviting | That address already registered (e.g. as a volunteer). | Use a different address for the admin. |
| Applicants don't get the **"application received"** e-mail | Server can't verify the applicant: `SUPABASE_SERVICE_ROLE_KEY` is missing — or Resend isn't configured / domain not verified. | Add the key (step 9). Check Resend → Logs. |
| No e-mails at all | `RESEND_API_KEY` missing, or you're using Resend's test sender which only delivers to your own account. | Step 7: verify a domain and set `RESEND_FROM_EMAIL`. |
| Approving shows a **red error banner** | The database refused the change (e.g. you're not signed in as an admin, or a rare ID clash after several retries). | Read the message; sign in as an admin; try again. Nothing is e-mailed unless the approval was saved. |
| **"Too many emails for this recipient"** | Safety limit: one e-mail of each kind per recipient per 30 seconds. | Wait a moment and retry. |
| Résumé upload fails | File is over **5 MB**, isn't PDF/DOC/DOCX, or the `resumes` bucket doesn't exist. | Use a smaller PDF; re-run `schema.sql`. |
| Applications start failing after a few sign-ups: *"email rate limit exceeded"* | "Confirm email" is ON with Supabase's built-in mailer. | Step 4: turn Confirm email OFF, or configure custom SMTP. |
| Check-in can't get a location | Location permission denied, or the page isn't HTTPS. | Allow location in the browser; use the https address. |
| The whole site stopped working after a quiet period | Supabase Free project was **paused**. | Supabase dashboard → **Restore project**; consider Pro. |
| You see an admin page's frame after faking a cookie | Known limitation: routing uses a browser cookie, but **data is protected by the database rules** — a faked cookie shows an empty page. | See "Known limitations" below. |

---

## 16. Reference: environment variables

| Variable | Required? | Secret? | Where to get it | Notes |
| :--- | :---: | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | No | Supabase → Project URL | Baked in at build time. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | No | Supabase → Publishable (or `anon`) key | Name still says "anon" but accepts the publishable key. Baked in at build time. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** (in practice) | **YES** | Supabase → Secret (or `service_role`) key | Needed for admin invites **and** for verifying applicants before the "application received" e-mail. Never prefix with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | For invites | No | Your live address | No trailing `/`. Used inside invite e-mails. Redeploy after changing. |
| `RESEND_API_KEY` | Recommended | **YES** | Resend → API Keys | Without it e-mails are only logged. |
| `RESEND_FROM_EMAIL` | Recommended | No | Your verified sender | Enter **without quotes** on Vercel. |
| `ALLOW_DEMO_BUILD` | **Never** for real use | No | — | Only for a deliberate public demo with fake data. |

For local development copy `.env.example` to `.env.local` and fill it in (this file is ignored by Git).

---

## 17. Reference: useful SQL

Run these in **Supabase → SQL Editor**.

**Promote a volunteer to the intern track** (unlocks Leave and Report Issue):

```sql
UPDATE public.profiles SET role = 'intern' WHERE email = 'student@example.com';
```

**Approve / reject an application by hand:**

```sql
UPDATE public.profiles
SET application_status = 'approved', reviewed_at = NOW()
WHERE email = 'student@example.com';
```
*(Approving from the portal also assigns the joinee ID; doing it by SQL does not.)*

**List all admins:**

```sql
SELECT name, email, invited_at, invite_accepted_at FROM public.profiles WHERE role = 'admin' ORDER BY created_at;
```

**Lost access to the only admin account?** Reset the password in *Authentication → Users → ⋯ → Send password
recovery* (or set a new one), or promote another registered account with the first-admin SQL in step 6.

---

### Known limitations after launch

* **Page access uses a browser cookie**, so someone who forges it can open the *frame* of an admin page — but all
  data is protected by the database's row-level security and the server API re-checks the caller, so they see no
  data and can change nothing. Validating the session on the server for every page is a sensible next improvement.
* **No Content-Security-Policy header** yet (the site does send the other standard security headers).
* **Orphan résumé files** can remain if an application fails after the upload.
* **No automated browser (end-to-end) tests** — the smoke test in step 12 is manual; repeat it after major changes.
