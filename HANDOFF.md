# EverSafe website: handoff plan

Written 2026-11-10. This file tells the next session what is done, what is left, and how to work.
It does not go on the public website (`.htaccess` blocks `.md` files).

Read sections 1 to 4 before you touch a file.

---

## 1. How this project works

- **Live branch: `hostinger-deploy`.** Hostinger pulls it into `public_html` a few seconds after every push or merge. `main` is old and is not the website. Never work from `main`.
- **Start every job from the newest `origin/hostinger-deploy`.** Open a pull request into `hostinger-deploy`. The owner merges. A merge is a deploy.
- Never push to `hostinger-deploy` or `main` directly.
- The site is plain HTML, one `styles.css`, one `script.js`. No build step.
- **Header, footer and contact block are shared.** Edit `partials/header.html`, `partials/footer.html`, `partials/contact.html`, then run `python3 tools/sync-partials.py`. Never edit the text between `<!-- HEADER:START -->` and `<!-- HEADER:END -->` in a page (same for FOOTER and CONTACT). `thank-you/index.html` is not synced.
- **When you change `styles.css` or `script.js`, raise the version number** in every page (`styles.css?v=9`, `script.js?v=7`). The server caches CSS and JS for one month.
- A new page needs: the three marker pairs, a line in `sitemap.xml`, a line in `llms.txt`, and a link from the menu, the footer or another page.
- The owner reads English as a second language. Write to the owner in short, simple sentences.

## 2. Hard rules

1. **No personal identity anywhere**: these strings must never appear in any file, comment, commit message or pull request: the owner's first name, last name, initials, and PE license number. The firm speaks as "we" or "EverSafe". Check before every commit:
   `grep -rIilE '<first name>|<last name>|<initials>|<license number>' . --exclude-dir=.git` must print nothing. (The owner's original brief lists the exact strings. Ask the owner for them. Do not write them in this repo.)
2. **The only registry number allowed: `FBPE Registry No. 40449`.**
3. **Do not change prices.** The `CONFIG` object in the quote tool stays exactly as it is.
4. **Do not change existing URLs or file names.** Keep the anchors on `services.html`: `#sprinkler`, `#alarm`, `#life-safety`, `#plan-review`, `#code-hazmat`, `#special-hazards`.
5. **Florida only.** Do not mention other states.
6. **No promise of permit approval** and no promise about AHJ speed.
7. **No analytics, cookies, chat widgets or third-party scripts.**
8. **Never invent facts.** No made-up clients, projects, numbers, dates, reviews or prices. If you need a fact, ask the owner.
9. **No secrets in the repo.** `config.php`, passwords and the signing secret never get committed.
10. The repo is public. Do not commit the owner's brief.

## 3. Decisions the owner already made

| Topic | Decision |
|---|---|
| Main address | `https://eversafe-fire.com` (no `www`). All canonicals, the sitemap and `llms.txt` use it. |
| Look and motion | **Keep the original look.** Keep all animation, including the animated logo shield, the see-through hero card, orange labels on blue and gradient buttons. Do not "fix" these for contrast. Ignore the brief's "remove looping animation" and "no orange on blue" lines. |
| "Permit-ready" and "AHJ-ready" | Keep these words. |
| Footer tagline | "Stay Compliant. Stay EverSafe." |
| Legal name for schema | Eversafe Fire Protection LLC |
| Upload limits | 100 MB per file, 500 MB per quote, 20 files per quote, deleted after 90 days |
| "Starts at $850" | **Do not publish.** |
| SVG logo | There is none. Use the PNG files. |
| Email | The mailbox is hosted on Gmail. Still open: is it Google Workspace with info@eversafe-fire.com? |
| Repo privacy | Repo stays public for now. |

## 4. Voice rules (every word a visitor reads)

Use the copy on `services.html` as the sample.

- Short sentences. Plain words. One idea per sentence.
- Say what we do, who it is for, and what the client receives.
- No em dashes or en dashes in visible copy. Use a period, comma or colon.
- No "not X but Y" lines. No rows of clipped fragments. No slogan that repeats the paragraph above.
- No lists of three written only for rhythm.
- No hype words: seamless, robust, cutting-edge, trusted, world-class, end to end, technology-driven, straight answers.
- Do not repeat a heading in the sentence under it.
- Do not count the services.
- Section headings in sentence case. Service names keep their capitals.
- Keep code references exact: NFPA 13, NFPA 72, NFPA 101, NFPA 101A, NFPA 855, NFPA 2001, FBC, FFPC, IFC Chapter 50.

## 5. What is done

| Phase | State |
|---|---|
| 0. Audit | Done. |
| 1. Trust, risk and brand fixes | Done and live. Risky claims replaced, new trust bar, redirects, 12px minimum text, 44px tap targets, content visible with JavaScript off. |
| Look and motion restored | Motion is live. The restored look is in pull request #7. |
| 2. Navigation and service structure | Done, in pull request #7. Check that #7 is merged before you start. |

Facts you may use: phone 386-837-4057, email info@eversafe-fire.com, LinkedIn https://www.linkedin.com/company/eversafefire/, based in Central Florida, serves all of Florida, proposals usually in one business day, PE review and seal in 5 business days standard with 48 hour and 24 hour rush, quotes valid 7 days.

Service groups (same names and order everywhere):
1. **Review and seal.** You have drawings. You need a Florida PE seal.
2. **Design.** You need drawings and calculations.
3. **Code and analysis.** You need an answer or a report.

---

## 6. What is left

Difficulty: **Easy** = text and markup work, safe for a smaller model. **Hard** = server code or security. Do the Hard tasks with the strongest model, or ask the owner first.

Suggested order: Phase 5 and Phase 4 first (Easy). Phase 3 last (Hard).

### Phase 5: copy pass (Easy)

Rewrite the home page, the FAQ, the service pages and the four guides with the voice rules. Keep every fact. Add none.

**Process: make a before and after table first. Send it to the owner. Wait for approval. Only then apply it.**

Lines to fix for certain:

- [ ] "as a partner, not a hand-off" (`index.html`, who we serve)
- [ ] "No hand-offs, no layers, no waiting for answers." (`index.html`, why section)
- [ ] "Built for Speed" and "A modern, technology-driven workflow means faster hydraulic calcs... without sacrificing accuracy." (`index.html`)
- [ ] "A structured, quality-first workflow." (`index.html`, process)
- [ ] "Straight answers to the questions..." (`faq.html`)
- [ ] "fast turnaround so your projects keep moving" (`index.html` hero) and "Fast turnaround for permit-driven schedules" (`pe-stamping-plan-review.html`). State our turnaround times. Do not promise speed.
- [ ] Every sentence with a long dash. There are about 57 on 16 pages. Find them with `python3 tools/check-links.py .` (see the "dashes" line per page).
- [ ] Section headings to sentence case.
- [ ] Guide pages: "guarantees a rejection" and similar strong claims about what an AHJ will do.

Rules for this phase:
- If a FAQ answer changes on `faq.html`, change the same text in the `FAQPage` JSON-LD block on that page. They must match word for word.
- The home page FAQ block (`index.html`, `#faq`) copies five answers from `faq.html`. Keep them the same.
- Do not touch the quote tool `CONFIG`.

### Phase 4: AI and search visibility (Easy, except where marked)

**Schema**
- [ ] One organization node on every page: `@id` `https://eversafe-fire.com/#organization`, type `ProfessionalService`, with `name`, `legalName` ("Eversafe Fire Protection LLC"), `url`, `logo`, `image`, `telephone`, `email`, `slogan`, `sameAs` (LinkedIn), `areaServed` (Florida, plus Orlando, Tampa, Miami, Jacksonville), `knowsAbout` (the codes in section 4), and an `identifier` for FBPE Registry No. 40449.
- [ ] `services.html` uses `@id` `.../#org` today. Change it to `.../#organization`.
- [ ] No `Person`, `founder` or `employee` nodes. No street address.
- [ ] `hasOfferCatalog` with the three groups (already on `index.html` and `services.html`. Keep them the same).
- [ ] `WebSite` node on the home page.
- [ ] `BreadcrumbList` on every inner page (most have it. Check `faq.html`).
- [ ] `Service` nodes on service pages point to the organization `@id` as `provider`.
- [ ] Guides: `Article` schema with the organization as author and publisher.
- [ ] `FAQPage` only on `faq.html`. Remove it from the four guides.
- [ ] Every JSON-LD block must parse. `python3 tools/check-links.py .` reports parse errors.

**Answer-first content**
- [ ] Each service page opens with two or three sentences: what it is, who it is for, what you receive, typical turnaround, how to start.
- [ ] FAQ answers: the first sentence answers the question. Use the real numbers in section 5.
- [ ] Add FAQs: "Do you work outside Florida?" (Florida projects only), "What is your Florida registry number?".
- [ ] Add these three FAQs only after Phase 3 is live: "How do I upload my drawings?", "What files do you need for a PE review?", "Is my drawing set kept private?".
- [ ] Add a visible "Last updated" date to service pages and guides. Use the real date of the edit.
- [ ] Do **not** publish "starts at $850".

**Files for crawlers**
- [ ] `llms.txt`: already has the three groups. Add upload details after Phase 3.
- [ ] Add `llms-full.txt`: one plain-text file with every service description and every FAQ. Copy the text from the pages. Do not write new claims.
- [ ] `robots.txt`: keep everything open. Add named allow blocks for `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-SearchBot`, `PerplexityBot`, `Google-Extended`, `Bingbot`. Add `Disallow: /api/` when Phase 3 exists.
- [ ] `sitemap.xml`: add a `lastmod` date on every URL.

**Page basics**
- [ ] Unique title of 60 characters or less on every page. About 13 are too long.
- [ ] Unique meta description of 155 characters or less. About 17 are too long. Update `og:description` and `twitter:description` to match.
- [ ] Two titles contain a long dash (`hmis-inventory-statement-florida.html`, `maq-analysis-florida.html`).
- [ ] Images: add `loading="lazy"` below the fold. WebP only if it helps.
- [ ] **Hard:** compression rules in `.htaccess`. A mistake in `.htaccess` takes the whole site down. Wrap new rules in `<IfModule>` and test on a local Apache before the pull request.

### Phase 3: upload in the quote tool, and the contact form (Hard)

Do not give this phase to a smaller model. It handles client files, email passwords and server security.

**Blocked until the owner answers:**
- Is the mailbox Google Workspace with info@eversafe-fire.com? The plan is Gmail SMTP (`smtp.gmail.com`, port 587) with an app password that the owner types into `config.php` on Hostinger.
- The Hostinger path above `public_html` where PHP may write the uploads folder.

**Easy parts of Phase 3 (front end only):**
- [ ] Move the quote tool's inline CSS and JS out of `pe-stamping-plan-review.html` into `quote.css` and `quote.js`. Keep `CONFIG` at the top of `quote.js`, unchanged.
- [ ] Contact form fields in `partials/contact.html`: Name, Company, Email, Phone (optional), "What do you need?" (Review and seal, Design, Code and analysis, Not sure), Project details. Then run the sync script.
- [ ] Contact copy: the form takes no files. Point review and seal clients to the quote tool. Add a one-line privacy note with a link to `privacy.html`.
- [ ] Validate on blur. Show each error under its field. Move focus to the first error on submit.

**Hard parts:**
- [ ] `api/upload.php` (5 MB chunks), `api/request.php`, `api/download.php` (random token, 30 day expiry), `api/cleanup.php` (command line only, deletes after 90 days), `api/contact.php`.
- [ ] Files stored outside `public_html`, one folder per quote ID, random names on disk, original names in a JSON manifest.
- [ ] Allowed types `pdf`, `dwg`, `dxf`, `rvt`, `zip`, `jpg`, `png`. Check extension and file signature.
- [ ] Limits as constants in one config file. Honeypot, same-origin check, signed token, per-IP rate limit. No CAPTCHA.
- [ ] PHPMailer vendored in the repo. Only `config.sample.php` is committed. Add `config.php` to `.gitignore`.
- [ ] If `api/request.php` fails, fall back to the current FormSubmit post so no lead is lost.
- [ ] Upload UI on the price card and on the custom quote card: drag and drop plus a button, file list, progress, remove, retry, `aria-live`.
- [ ] Success panel on the same page with the quote ID. No redirect.
- [ ] Update the auto reply, the Terms text and `privacy.html` for the new flow.
- [ ] **A deploy rewrites the whole `public_html` folder. Prove to the owner that a deploy cannot delete uploads before the upload goes live.**
- [ ] Tests with `php -S`: a good PDF, a 150 MB file, an `.exe` renamed to `.pdf`, a dropped connection, a double click on submit, 21 files.

### Final handover (Easy)

- [ ] Change log by phase, in plain words.
- [ ] Go-live checklist: Hostinger one-time steps first (uploads folder, `config.php`, PHP limits, cron job), then merge, then a five-minute live test.
- [ ] Rollback note: which merge commit to revert on `hostinger-deploy`.
- [ ] Owner tasks: submit the sitemap in Google Search Console and Bing Webmaster Tools, check the Google Business Profile, test the schema in Google's Rich Results Test.

---

## 7. Checks before every pull request

Run all of these. Say plainly in the pull request what you ran and what you did not run.

```bash
python3 tools/sync-partials.py --check
```

```bash
python3 tools/check-links.py .
```

```bash
python3 -m http.server 8765
```

```bash
node tools/check-pages.js
```

- `sync-partials.py --check` must say all pages match.
- `check-links.py` must show no broken link, no broken anchor, no duplicate ID, no JSON-LD error.
- `check-pages.js` must show no `OVERFLOW`, no `JS ERRORS`, no `small ::` and no `taps ::` lines. `contrast ::` lines for orange on blue, gradient buttons and the footer tagline are accepted (owner's choice). Any other contrast line is a bug.
- Search for the identity strings (section 2, rule 1). Zero hits.
- Search for "six". Zero hits about services.
- Test the menu with the keyboard: Tab, Enter, Space, Escape.
- If you changed `.htaccess`: test it on a local Apache with HTTPS first. If you cannot, do not change it.
- `git status` is clean. No secret and no client file in any commit.

Each pull request body must say: "Merging this puts it live within seconds", what changed, the checks done, a short test list for after the merge, and the rollback step.

## 8. Things that are easy to get wrong

- Starting from `main`. It is the wrong branch.
- Editing a header or footer inside a page. It is overwritten by the next sync.
- Forgetting the cache version bump. The owner then sees the old design.
- Changing a FAQ answer but not the `FAQPage` JSON-LD.
- Adding a dash, a hype word or a service count while rewriting copy.
- "Improving" contrast or removing animation. The owner asked to keep the original look.
- Deleting `googlec0d667dc3d0b7f1e.html`. It is the Google Search Console check file.
- Sending real test emails from the live forms. Ask the owner to test the forms.
