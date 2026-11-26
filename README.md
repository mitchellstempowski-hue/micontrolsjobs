# MI Controls Jobs — site build & deploy

Plain static site (HTML/CSS/vanilla JS, zero dependencies, no build step) for
**micontrolsjobs.com** — every PLC & controls job in Michigan. Employer-paid:
$99 Standard post / 30 days, $199 Featured / 30 days. Candidates always free.

## Files

| File | Purpose |
|---|---|
| `index.html` | Board homepage: hero with live count (rendered from data), search/region/shift filters, listings, newsletter + employer CTA blocks |
| `job.html` | Single-listing view (`job.html?id=<id>`), generates schema.org JobPosting JSON-LD client-side for Google for Jobs |
| `post-a-job.html` | Employer intake form + $99/$199 plan cards. Checkout button is a **placeholder** (`#stripe-checkout-todo`) until Stripe is wired — see below |
| `listings.json` | All live listings. Starts as `[]`; generated from seed data by the converter. The homepage count is always this file's true length at render time |
| `styles.css` / `app.js` | Shared styling + all client logic (board render/filter, job detail, form stubs) |
| `tools/seed_to_listings.py` | Converts `../hidden_files/seed-listings-2026-10-26.json` → `listings.json` (adds `id`, `featured:false`, `seeded:true`, `region`; dedupes company+title+city). Plain python3, no installs |

Listing schema (per item): `id, title, company, city, region, pay, shift,
source` (source site name, shown as “via …” on seeded listings), `apply_url`
(employer's apply/source link), `posted_date, description, featured, seeded`.

## Deploy to Hostinger (shared hosting)

1. **Domain/DNS:** point `micontrolsjobs.com` at the Hostinger plan (hPanel →
   Domains → connect to hosting; enable the free SSL certificate and force HTTPS).
2. **Upload:** hPanel → File Manager (or FTP/SFTP) → the domain's docroot
   (`domains/micontrolsjobs.com/public_html/`) → upload everything in `site/`
   **except** `README.md` and `tools/` (they're harmless if uploaded, just noise).
   `index.html` must sit at the docroot root.
3. **Seed data:** before or right after upload, generate the real listings:
   ```bash
   python3 tools/seed_to_listings.py
   ```
   This reads `../hidden_files/seed-listings-2026-10-26.json` and overwrites
   `listings.json`, giving every listing a sequential `id` plus
   `featured:false` / `seeded:true`. Re-run it whenever the seed file is
   refreshed, then re-upload `listings.json`. (Missing/empty seed file → warns
   and writes `[]` so the board still deploys.)
4. **Smoke test on a phone:** homepage count matches `listings.json` length,
   filters work, a listing → “View / Apply” reaches the employer page in
   ≤3 taps, `job.html?id=1` renders with the right title.

## Wire before launch (the stubs are deliberate — do not skip)

- **Stripe checkout (post-a-job.html):** create two Stripe Payment Links —
  “MI Controls Jobs — Standard Post, 30 days” ($99) and “…Featured Post,
  30 days” ($199) — in the existing Stripe account. Replace the
  `#stripe-checkout-todo` href on `#checkout-btn` with the matching link
  (the page's inline script already swaps the button label by plan; extend it
  to swap the href). Route the intake form to a real endpoint/inbox so the
  job details arrive with the payment; every paid post is **manually reviewed**
  before going live for the first 90 days, then added to `listings.json`
  with `featured` set per plan and a 30-day expiry tracked.
  **Test end-to-end in Stripe test mode, then one live $1 self-test,
  including the refund path, before any employer is asked to pay** (master
  plan §9 — no exceptions).
- **Newsletter (index.html / job.html `#newsletter-form`):** create the
  “Michigan Controls Jobs” list in Zoho Campaigns/Mailing Lists and point
  the form's submit (stub in `app.js → initNewsletter`) at the Zoho signup
  endpoint (or swap the `<form>` action to Zoho's hosted form URL). Send #1
  must be rehearsed to a test list first, containing only that week's
  QA-passed listings.
- **Post-a-job submit (app.js → initPost):** the stub shows the
  “We’ll email you a checkout link” state and offers a mailto fallback.
  Replace with a POST to the intake endpoint once hosting-side handling
  (simple PHP mail script on Hostinger is fine) is in place.

## Ongoing data QA (master plan §9 — accuracy is the product)

- Every seeded listing is real, current, source-linked, deduped — never
  invented, never padded with out-of-state/off-trade filler.
- Re-check every listing's source weekly; pull anything dead at the source
  within that cycle. Paid posts expire hard at 30 days unless renewed.
- Counts anywhere on the site are the true live count at render time
  (the homepage count is computed from `listings.json` — keep it that way).

## Launch gate — no employer is charged until ALL five are true (§9)

- [ ] 1. Niche locked by research **+ 50+ seeded listings QA-verified live**
- [ ] 2. Board + post-a-job flow live on the real domain (micontrolsjobs.com, HTTPS)
- [ ] 3. Stripe checkout **and** cancellation/refund flows tested end-to-end (test mode, then one live $1 self-test)
- [ ] 4. First 100-company outreach list built and DNC-screened (never Dynamic Media or any business Mitchell already deals with)
- [ ] 5. Newsletter send #1 rehearsed to a test list with only QA-passed listings

Plus the §9 standing checks before announcing launch: apply flow ≤3 taps on
a phone; weekly dashboard live (live listings, seeded vs paid split,
subscribers, newsletter opens, paid posts, revenue, QA removals) with true
numbers only.
