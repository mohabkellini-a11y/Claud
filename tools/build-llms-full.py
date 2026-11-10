#!/usr/bin/env python3
"""Build llms-full.txt from the pages: every service description and every FAQ, as plain text.
Run from the repo root after you change page copy:   python3 tools/build-llms-full.py
It copies the visible text of each page's <main>. It writes no new claims."""
import html, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://eversafe-fire.com/"
PAGES = ["services.html", "pe-stamping-plan-review.html", "fire-sprinkler-system-design.html", "high-piled-storage-florida.html",
         "fire-alarm-system-design.html", "life-safety-plans-florida.html", "special-hazards-design-florida.html",
         "fire-code-consulting-florida.html", "hmis-inventory-statement-florida.html", "maq-analysis-florida.html",
         "fire-smoke-modeling-florida.html", "smoke-studies-florida.html", "for-mep-firms.html", "for-general-contractors.html",
         "about.html", "faq.html"]


def text_of(page):
    t = open(os.path.join(ROOT, page), encoding="utf-8").read()
    main = re.search(r"<main[^>]*>(.*?)</main>", t, re.S).group(1)
    for pat in (r"<!-- CONTACT:START -->.*?<!-- CONTACT:END -->", r'<section class="cta-band".*?</section>',
                r'<section class="section" id="related">.*?</section>', r'<section class="section" id="quote".*?</section>',
                r"<nav.*?</nav>", r"<svg.*?</svg>", r"<script.*?</script>", r"<style.*?</style>", r'<div class="hero-cta">.*?</div>',
                r'<ul class="svc-jump".*?</ul>'):
        main = re.sub(pat, "", main, flags=re.S)
    main = re.sub(r"<h1[^>]*>(.*?)</h1>", r"\n\n## \1\n\n", main, flags=re.S)
    main = re.sub(r"<h2[^>]*>(.*?)</h2>", r"\n\n### \1\n\n", main, flags=re.S)
    main = re.sub(r"<h3[^>]*>(.*?)</h3>", r"\n\n#### \1\n\n", main, flags=re.S)
    main = re.sub(r"<li[^>]*>", "\n- ", main)
    main = re.sub(r"</(p|div|tr|ul|ol|table|article|section)>", "\n", main)
    main = re.sub(r"</t[dh]>\s*<t[dh][^>]*>", " | ", main)
    main = html.unescape(re.sub(r"<[^>]+>", "", main))
    lines = [re.sub(r"[ \t]+", " ", l).strip() for l in main.split("\n")]
    out, blank = [], False
    for l in lines:
        if l in ("", "→", "›"):
            blank = True
            continue
        if blank and out:
            out.append("")
        out.append(l.replace(" →", "").replace("→", ""))
        blank = False
    return "\n".join(out).strip()


def main():
    parts = ["# EverSafe Fire Protection: full site text",
             "",
             "> Florida fire protection engineering firm. FBPE Registry No. 40449. Based in Central Florida. Florida projects only. "
             "Phone 386-837-4057. Email info@eversafe-fire.com. Short index: " + BASE + "llms.txt",
             ""]
    for p in PAGES:
        parts += ["", "---", "Source: " + BASE + p, "", text_of(p)]
    open(os.path.join(ROOT, "llms-full.txt"), "w", encoding="utf-8").write("\n".join(parts) + "\n")
    print("llms-full.txt written,", sum(len(x) for x in parts), "characters")


if __name__ == "__main__":
    main()
