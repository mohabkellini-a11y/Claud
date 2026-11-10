#!/usr/bin/env python3
"""Copy partials/header.html, partials/footer.html and partials/contact.html into every page.

Run from the repo root:   python3 tools/sync-partials.py
Check only (no writes):   python3 tools/sync-partials.py --check

Each page holds marker comments, for example:
    <!-- HEADER:START --> ... <!-- HEADER:END -->
Everything between a START and END marker is replaced by the partial.
The pages stay plain HTML. You can upload them as they are.
The link to the current page gets aria-current="page" in the header.
"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = {"HEADER": "header.html", "FOOTER": "footer.html", "CONTACT": "contact.html"}
SKIP = ("google",)  # search engine verification files


def mark_current(header, page):
    """Add aria-current="page" to header links that point at this page."""
    target = "/" if page == "index.html" else "/" + page

    def repl(m):
        href = m.group(2)
        if href == target:
            return m.group(1) + ' aria-current="page"' + m.group(3)
        return m.group(0)

    return re.sub(r'(<a (?:class="[^"]*" )?href="([^"#]*)")(>)', repl, header)


def main():
    check = "--check" in sys.argv
    parts = {k: open(os.path.join(ROOT, "partials", v), encoding="utf-8").read() for k, v in PARTS.items()}
    changed, missing = [], []
    for path in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        page = os.path.basename(path)
        if page.startswith(SKIP):
            continue
        text = open(path, encoding="utf-8").read()
        new = text
        for key, body in parts.items():
            start, end = "<!-- %s:START -->" % key, "<!-- %s:END -->" % key
            if start not in new or end not in new:
                if key != "CONTACT":
                    missing.append("%s (%s)" % (page, key))
                continue
            if key == "HEADER":
                body = mark_current(body, page)
            pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
            new = pattern.sub(lambda m: start + "\n" + body + "  " + end, new, count=1)
        if new != text:
            changed.append(page)
            if not check:
                open(path, "w", encoding="utf-8").write(new)
    for m in missing:
        print("MISSING MARKERS:", m)
    if check:
        print("Out of date:" if changed else "All pages match the partials.", ", ".join(changed))
        sys.exit(1 if (changed or missing) else 0)
    print("Updated %d page(s)." % len(changed), ", ".join(changed))
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()
