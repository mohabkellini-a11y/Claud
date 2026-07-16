# EverSafe Fire Protection — Website

A premium single-page marketing site for **EverSafe Fire Protection**, a Florida-licensed
professional engineering practice serving Central Florida and the statewide market.

Built as a fast, self-contained static site — no build step, no dependencies. Deploys to
any static host (Netlify, Vercel, GitHub Pages, S3, or plain shared hosting).

## Structure

| File | Purpose |
|------|---------|
| `index.html` | All page content and inline SVG icons/logo |
| `styles.css` | Design system + all styling (brand tokens in `:root`) |
| `script.js` | Sticky header, mobile nav, scroll reveals, stat count-up, contact form |
| `assets/favicon.svg` | Shield + flame favicon |

## Page sections

Hero → Credentials bar → **Services (6 offerings)** → Why EverSafe → How We Work →
Who We Serve → Contact → Footer.

## Brand system (from the Branding Playbook)

- **Typography:** Montserrat (loaded from Google Fonts)
- **Colors:** Deep Blue `#024479` · Fire Red `#c30a2b` · Flame Orange `#d65119` · Light Gray `#6b6b6e`
- All color/spacing values are CSS variables at the top of `styles.css` for easy tuning.

## Editing common content

- **Phone number:** search `386-837-4057` (and the `tel:+13868374057` links) in `index.html`.
- **Email / domain:** `info@eversafefl.com` / `www.eversafefl.com` in `index.html`.
- **Services copy:** the `.service-card` blocks in `index.html`.

### Placeholders to fill in later
Per the current brief, the **principal's name** and **PE license number** are intentionally
omitted. When ready, add them to the Contact and Footer sections.

## Contact form

The form submits to **[Formspree](https://formspree.io)** via AJAX (no page reload),
with inline success/error messages, a loading state, and a hidden honeypot field for spam.

### One-step setup
1. Create a free form at [formspree.io](https://formspree.io) (point it at `info@eversafefl.com`).
2. Copy your form ID (looks like `xmyzabcd`).
3. In `script.js`, set `FORMSPREE_ENDPOINT` near the top of the contact-form section:
   ```js
   var FORMSPREE_ENDPOINT = "https://formspree.io/f/xmyzabcd";
   ```

Until that ID is set, the form **falls back to the visitor's email client** (`mailto:`), so
it's never dead. Formspree's free tier covers 50 submissions/month; paid plans add more.

**Prefer Netlify Forms?** If you deploy to Netlify, add `data-netlify="true"` and a hidden
`form-name` field to the `<form>` and Netlify captures submissions with no JS — ask and I'll wire it.

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Accessibility & performance

Responsive (375 → 1440px), keyboard-navigable, respects `prefers-reduced-motion`,
WCAG-compliant contrast, semantic HTML, and no render-blocking dependencies.
