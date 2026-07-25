# EverSafe Fire Protection — Deployment, DNS & Domain Trust Guide

Companion to the config files in this repo (`.htaccess`, `sitemap.xml`, `robots.txt`).
Canonical site address: **https://www.eversafe-fire.com**

---

## Phase 1 — Files to upload (already generated)

Upload to Hostinger via **hPanel → Files → File Manager**, into `public_html/`:

| File | Destination | Notes |
|---|---|---|
| `.htaccess` | `public_html/.htaccess` | Hidden file — enable "Show hidden files" in File Manager |
| `sitemap.xml` | `public_html/sitemap.xml` | |
| `robots.txt` | `public_html/robots.txt` | |
| `index.html` | `public_html/index.html` | Re-upload — canonical tag was added |
| `pricing-tool/index.html` | `public_html/pricing-tool/index.html` | Re-upload — `noindex` was added |

### Before you upload `.htaccess`
Make sure SSL is actually issued first, or the redirect will loop users into a
broken page. In hPanel: **Websites → Manage → Security → SSL**. Confirm the
certificate is **Active** for both `eversafe-fire.com` and `www.eversafe-fire.com`.
Only then upload `.htaccess`.

If something goes wrong after upload, renaming `.htaccess` to `.htaccess.bak`
in File Manager instantly reverts it.

---

## Phase 2 — Hostinger DNS records

All of these go in: **hPanel → Domains → DNS / Nameservers → DNS Zone Editor** — but
only if your domain uses **Hostinger's nameservers**. If you point the domain at
Cloudflare or another DNS provider, add the records there instead; the DNS Zone
Editor in hPanel will be ignored.

### 2.1 — DMARC record

> **Prerequisite:** DMARC only works on top of SPF and DKIM. Before adding it,
> check the DNS Zone Editor for an existing **SPF** TXT record on `@` (Hostinger's
> looks like `v=spf1 include:_spf.mail.hostinger.com ~all`) and a **DKIM** record.
> Hostinger creates both automatically when you activate its email. If they're
> missing, set up email first — a DMARC record with no SPF/DKIM underneath can
> cause your legitimate mail to be rejected.

Add a new record with these exact values:

| Field | Value |
|---|---|
| **Type** | `TXT` |
| **Name / Host** | `_dmarc` |
| **TTL** | `14400` (or leave default) |
| **Value / Content** | `v=DMARC1; p=none; rua=mailto:dmarc@eversafe-fire.com; fo=1; adkim=r; aspf=r` |

> Some panels want the full `_dmarc.eversafe-fire.com`. Hostinger's editor
> appends the domain for you — enter just `_dmarc`. After saving, the record
> should display as `_dmarc.eversafe-fire.com`.

**What the tags mean:**

- `p=none` — **monitor only.** Start here. It reports on mail that fails
  authentication without blocking anything. Going straight to `p=reject` on a new
  setup is the single most common way businesses accidentally kill their own
  invoicing and proposal email.
- `rua=mailto:...` — where daily aggregate reports go. Create a dedicated
  `dmarc@eversafe-fire.com` mailbox or alias first; these reports are raw XML and
  arrive daily, so you don't want them in your main inbox. (Or point it at a free
  parser like Postmark's DMARC Digests / dmarcian.)
- `fo=1` — send a report if *either* SPF or DKIM fails.
- `adkim=r` / `aspf=r` — relaxed alignment; correct for typical hosted email.

**The tightening schedule** — this is what actually builds domain trust:

| When | Change the policy to |
|---|---|
| Weeks 1–4 | `p=none` (read the reports, confirm all legitimate mail passes) |
| ~Week 5 | `p=quarantine; pct=25` — then raise `pct` to 50, then 100 |
| ~Week 9+ | `p=reject` — the end state reputation systems reward |

Only move to the next step once reports show your real mail passing cleanly.

### 2.2 — Google Search Console verification record

Google generates this token **per property** — I can't pre-fill it, and any value
you find online will fail. Get yours first:

1. Go to https://search.google.com/search-console
2. Click **Add property → Domain** and enter `eversafe-fire.com` (no `https://`, no `www` —
   the Domain property type covers every subdomain and both protocols at once)
3. Google shows you a TXT record. Copy the value.

Then in the Hostinger **DNS Zone Editor**:

| Field | Value |
|---|---|
| **Type** | `TXT` |
| **Name / Host** | `@` |
| **TTL** | `14400` (or leave default) |
| **Value / Content** | `google-site-verification=PASTE_YOUR_TOKEN_HERE` |

Example of the shape (**do not use this — it is not your token**):
`google-site-verification=rX9tK2mQvL7pN4dW8sB1cY6hJ3fA0gZ5eU2iO9nT4kM`

Save, wait 15–60 minutes for DNS propagation, then click **Verify** in Search
Console. If it fails, wait longer and retry — the record is usually correct and
just hasn't propagated.

> **Do not delete this record after verification.** Google re-checks it
> periodically and will silently drop your access if it disappears.

---

## Phase 3 — Post-deployment checklist

### 3.1 — Verify the deployment itself

- [ ] `http://eversafe-fire.com` redirects to `https://www.eversafe-fire.com` (padlock, no warning)
- [ ] `http://www.eversafe-fire.com` also redirects to HTTPS
- [ ] `https://www.eversafe-fire.com/robots.txt` loads and shows the Sitemap line
- [ ] `https://www.eversafe-fire.com/sitemap.xml` loads as XML
- [ ] Check for mixed content: open the site, press **F12 → Console**, look for
      warnings about resources loaded over `http://`. Any of these will keep the
      padlock from appearing.
- [ ] Test the SSL config at https://www.ssllabs.com/ssltest/ — aim for an **A**.
      Corporate proxies do inspect this, and a weak grade can get a site flagged.
- [ ] Confirm the contact form still sends (check the Formspree endpoint in `script.js`)

### 3.2 — Google Search Console

- [ ] Verify the domain property (Phase 2.2 above)
- [ ] **Sitemaps** → enter `sitemap.xml` → **Submit**
- [ ] **URL Inspection** → paste `https://www.eversafe-fire.com/` → **Request Indexing**
- [ ] Check **Page indexing** after ~72 hours for crawl errors
- [ ] Also submit to **Bing Webmaster Tools** (https://www.bing.com/webmasters) — it
      can import directly from Search Console. This matters more than people expect:
      several corporate web filters seed their reputation data from Bing's index.

> Realistic expectation: indexing a brand-new domain takes days to a few weeks.
> Requesting indexing does not jump the queue as much as it used to. Consistent
> uptime and real inbound links do more.

### 3.3 — Firewall / URL categorization submissions

**Why this is needed:** a newly registered domain is usually *uncategorized*, and
many corporate firewalls block uncategorized and newly-registered domains by
policy — regardless of content. Getting explicitly categorized is the fix. Expect
roughly 24 hours to a few days per vendor.

**Pick the right category name.** Each vendor has its own taxonomy, and
"Engineering/Architecture" does not exist in all of them. Use these:

| Vendor | Category to request | Submission URL |
|---|---|---|
| **Palo Alto Networks** (PAN-DB) | `Business and Economy` | https://urlfiltering.paloaltonetworks.com/ |
| **FortiGuard Labs** (Fortinet) | `Business` | https://www.fortiguard.com/faq/wfratingsubmit |
| **Cisco Talos** (Umbrella / Secure Web) | `Business and Industry` | https://talosintelligence.com/reputation_center/web_categorization |

**Per-vendor notes:**

- **Palo Alto** — search `eversafe-fire.com` on Test A Site, then use the
  *Change a Site* / *Request Change* option. **As of March 15, 2026 a login is
  required** to submit a category change, so create a free account first. An
  automated crawler checks your suggestion immediately; if it agrees, PAN-DB
  updates right away, otherwise a human reviews it.
- **FortiGuard** — you can also reach the form via
  https://www.fortiguard.com/webfilter by looking up the domain first, then
  choosing to request a review. Typically processed within ~24 hours.
- **Cisco Talos** — requires a free Cisco.com account. Submit through the
  Reputation Center's categorization request; track it under **My Tickets**.
  Most disputes resolve within one business day.

**Worth adding — these cover a large share of remaining corporate deployments:**

| Vendor | Submission URL |
|---|---|
| Zscaler | https://sitereview.zscaler.com/ |
| Symantec / Broadcom (Blue Coat) | https://sitereview.bluecoat.com/ |
| Trellix (McAfee) | https://sitelookup.mcafee.com/ |
| Forcepoint | https://csi.forcepoint.com/ |
| Trend Micro | https://global.sitesafety.trendmicro.com/ |

**What to write in the request.** Keep it factual and specific — vague requests
get deprioritized. Something like:

> EverSafe Fire Protection is a Florida-licensed professional engineering firm
> providing fire sprinkler and alarm system design, third-party plan review, and
> life safety consulting for commercial construction projects. The site is an
> informational business website with no user-generated content, downloads, or
> interactive features beyond a contact form. Requesting classification as
> Business.

### 3.4 — Ongoing trust signals

These do more for firewall reputation over time than any single submission:

- [ ] Keep the SSL certificate from lapsing (Hostinger auto-renews — confirm it's on)
- [ ] Verify the business on **Google Business Profile** — a strong real-world signal
- [ ] Ensure the LinkedIn page (already linked in your footer) points back to the site
- [ ] Get listed in Florida engineering / contractor directories — real inbound links
- [ ] Re-check categorization in ~30 days; vendors occasionally revert new domains
- [ ] Once DMARC reaches `p=reject` and stays clean, domain reputation improves measurably
