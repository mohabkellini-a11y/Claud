#!/usr/bin/env python3
"""Phase 5 copy pass: before and after pairs.

  python3 tools/phase5-copy.py            dry run. Shows how many times each line is found.
  python3 tools/phase5-copy.py --table F  write the before and after table to file F (Markdown).
  python3 tools/phase5-copy.py --apply    change the pages. Only after the owner approves the table.

After --apply: raise the cache versions if needed, run tools/build-llms-full.py and the checks in HANDOFF.md.
Each pair is (file, before, after). Text is matched in the page and in its JSON-LD, so FAQ schema stays in step.
"""
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = []
def add(f, b, a): P.append((f, b, a))

# ---------- faq.html ----------
add("faq.html", "Straight answers to the questions Florida contractors", "Answers to the questions Florida contractors")
add("faq.html", "control fire in buildings — primarily fire sprinkler and fire alarm systems.", "control fire in buildings. Most of the work is fire sprinkler and fire alarm systems.")
add("faq.html", "Send us your project details through our proposal form and we will respond with a fixed-fee quote — typical turnaround is 1 day.", "Send us your project details through our proposal form. We usually respond with a fixed-fee quote within one business day.")
for f in ("faq.html", "index.html"):
    add(f, "If you have architectural backgrounds or plans, attach them — but they are not required for an initial quote.", "If you have architectural backgrounds or plans, tell us. They are not required for an initial quote.")
    add(f, "prepared by someone else — typically a contractor or MEP firm.", "prepared by someone else, typically a contractor or MEP firm.")
    add(f, "Our typical fixed-fee proposal turnaround is 1 day. Submit the Request a Proposal form with your project details, or call 386-837-4057 / email info@eversafe-fire.com, and we will respond with a fixed-fee quote and schedule.", "Usually within one business day. Submit the Request a Proposal form with your project details, call 386-837-4057, or email info@eversafe-fire.com. We respond with a fixed-fee quote and schedule.")
add("faq.html", "where prescriptive code doesn't fit — such as atria, large open spaces, and complex smoke control systems — and to demonstrate to the AHJ that occupants can safely egress.", "where prescriptive code doesn't fit, such as atria, large open spaces, and complex smoke control systems. The model is used to demonstrate to the AHJ that occupants can safely egress.")
add("faq.html", " All coordination can be handled remotely, and our PE-stamped deliverables are accepted by AHJs throughout Florida.", " All coordination can be handled remotely.")

# ---------- index.html ----------
add("index.html", "EverSafe Fire Protection is a Florida-licensed professional engineering practice delivering\n            PE-stamped fire protection design, third-party plan review, and life safety consulting.\n            We deliver code-compliant, permit-ready documents with fast turnaround so your projects keep moving.", "EverSafe Fire Protection is a Florida-licensed professional engineering practice.\n            We provide PE-stamped fire protection design, third-party plan review, and life safety consulting.\n            Our documents are code-compliant and permit-ready.")
add("index.html", "<h3>Built for Speed</h3>", "<h3>Clear turnaround times</h3>")
add("index.html", "A modern, technology-driven workflow means faster hydraulic calcs, quicker drawing turnaround, and responsive comment resolution without sacrificing accuracy.", "Proposals usually arrive within one business day. PE review and seal takes 5 business days. 48 hour and 24 hour rush are available.")
add("index.html", "You work directly with the engineer of record from proposal to permit. No hand-offs, no layers, no waiting for answers.", "You work directly with the engineer of record from proposal to permit.")
add("index.html", "A structured, quality-first workflow. We stay on the project until the AHJ comments are closed.", "We stay on the project until the AHJ comments are closed.")
add("index.html", "We integrate with the firms and owners who need trusted fire protection engineering, as a partner, not a hand-off.", "We work alongside the firms and owners who need fire protection engineering.")
for b, a in (("Licensed &amp; Accountable", "Licensed and accountable"), ("One Point of Contact", "One point of contact"), ("Flexible Engagement", "Flexible engagement"),
             ("Scope &amp; Proposal", "Scope and proposal"), ("Design &amp; Analysis", "Design and analysis"), ("QC &amp; PE Seal", "QC and PE seal"), ("Permit Support", "Permit support")):
    add("index.html", "<h3>%s</h3>" % b, "<h3>%s</h3>" % a)

# ---------- service pages ----------
add("fire-alarm-system-design.html", " meet NFPA 72 requirements — which shortens plan review and avoids costly resubmittals.", " meet NFPA 72 requirements.")
add("fire-code-consulting-florida.html", "Hazardous Materials Inventory Statements (HMIS) — ", "Hazardous Materials Inventory Statements (HMIS): ")
add("fire-code-consulting-florida.html", "Maximum Allowable Quantity (MAQ) analysis per IFC Table 5003.1.1 — ", "Maximum Allowable Quantity (MAQ) analysis per IFC Table 5003.1.1: ")
add("high-piled-storage-florida.html", "Warehouses and distribution centers live or die on their storage configuration. EverSafe evaluates your commodity classification, storage heights, and rack arrangements, then sets the sprinkler design criteria — density, ESFR, or in-rack — per NFPA 13 and IFC Chapter 32, so the design protects the actual hazard instead of the assumed one.", "Fire protection for warehouses and distribution centers depends on the storage configuration. EverSafe evaluates your commodity classification, storage heights, and rack arrangements. We then set the sprinkler design criteria (density, ESFR, or in-rack) per NFPA 13 and IFC Chapter 32, so the design matches the actual hazard.")
add("high-piled-storage-florida.html", "High-piled storage is where generic sprinkler designs fail — the wrong commodity class or a missed in-rack requirement shows up as an AHJ rejection or, worse, an unprotected rack. Engineer-set criteria before the shop drawings start keeps the project, and the building, protected.", "A wrong commodity class or a missed in-rack requirement can lead to AHJ comments or an unprotected rack. We set the criteria before the shop drawings start.")
add("hmis-inventory-statement-florida.html", "the AHJ wants an inventory statement before the permit moves. EverSafe prepares HMIS documentation listing material classifications, quantities, and storage/use locations per the Florida Building Code and IFC Chapter 50 — the deliverable hazmat permits are built on.", "the AHJ asks for an inventory statement. EverSafe prepares HMIS documentation listing material classifications, quantities, and storage and use locations per the Florida Building Code and IFC Chapter 50.")
add("life-safety-plans-florida.html", "Most AHJ plan-review comments trace back to incomplete life safety documentation — missing occupant loads, unproven travel distances, or barrier ratings that don’t match the occupancy. A sealed life safety analysis answers those questions before the reviewer asks them, cutting a review cycle out of your permit timeline.", "Many AHJ plan-review comments trace back to incomplete life safety documentation: missing occupant loads, unproven travel distances, or barrier ratings that don’t match the occupancy. A sealed life safety analysis documents those items before submittal.")
add("maq-analysis-florida.html", "Exceed the maximum allowable quantity in a control area and the occupancy classification changes — with it, the construction type, fire protection, and permit path. EverSafe runs the MAQ analysis per IFC Table 5003.1.1, accounting for sprinkler and storage-cabinet increases, so you know exactly where your project stands before the AHJ decides for you.", "If you exceed the maximum allowable quantity in a control area, the occupancy classification changes. The construction type, fire protection, and permit path change with it. EverSafe runs the MAQ analysis per IFC Table 5003.1.1, accounting for sprinkler and storage-cabinet increases, so you know where your project stands before you submit.")
add("maq-analysis-florida.html", "MAQ is the hinge between a standard occupancy and a high-hazard one. Getting it right early tells you whether the design needs another control area, a different occupancy, or nothing at all — a decision worth making on paper, not in plan review.", "MAQ decides whether a space is a standard occupancy or a high-hazard one. An early analysis tells you whether the design needs another control area, a different occupancy, or no change.")
add("pe-stamping-plan-review.html", '<option value="std">Standard — 5 business days</option>', '<option value="std">Standard: 5 business days</option>')
add("pe-stamping-plan-review.html", '<option value="r48">Rush — 48 hours</option>', '<option value="r48">Rush: 48 hours</option>')
add("pe-stamping-plan-review.html", '<option value="r24">Rush — 24 hours</option>', '<option value="r24">Rush: 24 hours</option>')
add("pe-stamping-plan-review.html", "</span>Fast turnaround for permit-driven schedules</li>", "</span>5 business days standard. 48 hour and 24 hour rush available.</li>")
add("pe-stamping-plan-review.html", "but cannot legally seal them — only a Florida-licensed professional engineer can.", "but cannot legally seal them. Only a Florida-licensed professional engineer can.")
add("quote.js", '" review, sign & seal — " + d.count', '" review, sign & seal: " + d.count')
add("smoke-studies-florida.html", "need engineered proof that smoke stays manageable. EverSafe performs smoke control studies — rational analysis, pressurization design, and exhaust sizing per NFPA 92 — and backs them with CFD modeling when the AHJ wants to see the smoke move.", "need an engineered smoke control analysis. EverSafe performs smoke control studies: rational analysis, pressurization design, and exhaust sizing per NFPA 92. We add CFD modeling when the AHJ asks for it.")
add("smoke-studies-florida.html", "Smoke control is performance-based by nature — the AHJ approves the analysis, not just the equipment. A sealed rational analysis with modeled tenability gives reviewers the engineering basis they are looking for.", "Smoke control is performance-based. The AHJ reviews the analysis as well as the equipment. A sealed rational analysis with modeled tenability gives reviewers the engineering basis for the design.")
add("special-hazards-design-florida.html", "that standard sprinkler design doesn't address — we engineer the right protection for the hazard.", "that standard sprinkler design doesn't address. We design the protection for the specific hazard.")
add("special-hazards-design-florida.html", "Fire and smoke modeling (FDS/CFD) — ", "Fire and smoke modeling (FDS/CFD): ")
add("special-hazards-design-florida.html", "Smoke control studies — ", "Smoke control studies: ")
add("special-hazards-design-florida.html", "Special hazard systems — clean agents, energy storage protection, mission-critical suppression — involve complex chemistry, physics, and code requirements. AHJs scrutinize these submittals closely. PE-stamped drawings from a Florida-licensed fire protection engineer give the reviewer confidence that the system is engineered for the specific hazard, not just copied from a template.", "Special hazard systems (clean agents, energy storage protection, mission-critical suppression) involve complex chemistry, physics, and code requirements. AHJs review these submittals closely. PE-stamped drawings from a Florida-licensed fire protection engineer show the reviewer that the system is engineered for the specific hazard.")

# ---------- guides ----------
G = "fire-alarm-plan-review-florida.html"
add(G, "before issuing a permit — and incomplete submittals are one of the most common causes of permit delays.", "before issuing a permit. Incomplete submittals are one of the most common causes of permit delays.")
add(G, "Additions or modifications — new devices", "Additions or modifications: new devices")
add(G, "is drawn by the local AHJ — when in doubt, ask before you build.", "is drawn by the local AHJ. When in doubt, ask before you build.")
add(G, "Most rejections come down to completeness, not design philosophy. A PE-reviewed package that includes every calculation the reviewer expects will clear plan review in fewer cycles — and keep the construction schedule intact.", "Most rejections come down to completeness. A PE-reviewed package includes every calculation the reviewer expects.")
add(G, "Confirm the AHJ's submittal checklist before you draw — requirements vary between Florida jurisdictions, and submitting to the wrong checklist guarantees a rejection. Have a", "Confirm the AHJ's submittal checklist before you draw. Requirements vary between Florida jurisdictions. Have a")
G = "fire-protection-code-consultant.html"
add(G, "tells the design team what the code actually requires — before it becomes a plan review comment or a field problem. The deliverable is certainty: documented code analysis, defensible interpretations, and a design path the AHJ will accept.", "tells the design team what the code requires, before it becomes a plan review comment or a field problem. You receive a documented code analysis and code interpretations you can defend.")
add(G, "Egress analysis — occupant loads", "Egress analysis: occupant loads")
add(G, "AHJ coordination — presenting", "AHJ coordination: presenting")
add(G, "after a plan review rejection — or worse, reworking construction in the field.", "after a plan review rejection, or reworking construction in the field.")
add(G, "Most MEP firms handle routine fire protection scope in-house — until a project needs something beyond routine.", "Most MEP firms handle routine fire protection scope in-house. Some projects need more.")
add(G, "Owners hire code consultants for a different reason: risk and money. Before acquiring or renovating a building, a code due-diligence review identifies the fire protection upgrades the AHJ will demand — so the cost is in the pro forma, not a surprise after closing. During disputes with a plan reviewer or fire marshal, a documented engineering analysis carries weight that an argument does not. And when a retrofit is on the table,", "Owners hire code consultants to manage risk and cost. Before acquiring or renovating a building, a code due-diligence review identifies the fire protection upgrades the AHJ is likely to require, so the cost is in the pro forma before closing. During a dispute with a plan reviewer or fire marshal, a documented engineering analysis supports your position. When a retrofit is on the table,")
add(G, "On many projects, one firm does both — EverSafe Fire Protection provides", "On many projects, one firm does both. EverSafe Fire Protection provides")
G = "life-safety-plan-requirements-florida.html"
add(G, "A life safety plan is a drawing sheet — or set of sheets — showing", "A life safety plan is a drawing sheet, or a set of sheets, showing")
add(G, "A life safety plan consolidates everything a plan reviewer needs to verify means of egress and passive fire protection into one coordinated set of sheets. Rather than hunting through architectural, structural, and MEP drawings for code compliance information, the reviewer checks the life safety plans first — which is why their accuracy drives the pace of the entire permit review.", "A life safety plan puts everything a plan reviewer needs to verify means of egress and passive fire protection into one coordinated set of sheets. The reviewer checks the life safety plans first, before the architectural, structural, and MEP drawings.")
add(G, "Exact requirements vary by jurisdiction — some AHJs publish a life safety plan checklist, others evaluate it as part of the architectural review. Confirm expectations with the local AHJ before the drawing set goes out, because discovering the requirement at intake costs weeks.", "Exact requirements vary by jurisdiction. Some AHJs publish a life safety plan checklist. Others evaluate it as part of the architectural review. Confirm expectations with the local AHJ before the drawing set goes out.")
add(G, "But the sheets are only as good as the analysis behind them — and that is engineering work.", "The analysis behind the sheets is engineering work.")
add(G, "Every one of these is correctable — but each correction means a resubmittal cycle. An engineering review of the life safety sheets before submittal catches them when they are still cheap to fix.", "Each of these can be corrected, but each correction means a resubmittal. An engineering review of the life safety sheets before submittal looks for them first.")
G = "who-can-stamp-fire-sprinkler-drawings-florida.html"
add(G, "before they will issue a permit — and drawings submitted without a valid Florida PE seal are routinely rejected at intake.", "before they will issue a permit. Drawings submitted without a valid Florida PE seal are routinely rejected at intake.")
add(G, "it knows a licensed engineer has certified the design — which is why sealed plans move through plan review with far less friction.", "it knows a licensed engineer has certified the design.")
add(G, "routinely prepare sprinkler layouts and hydraulic calculations — that work is a normal part of the industry. But preparation is not certification. Before those", "routinely prepare sprinkler layouts and hydraulic calculations. That work is a normal part of the industry. Before those")
add(G, "that is exactly the gap a fire protection engineering practice fills.", "a fire protection engineering practice fills that gap.")
add(G, "can serve as the Florida engineer of record — reviewing, sealing, and supporting the package through permit.", "can serve as the Florida engineer of record. We review and seal the package and answer AHJ comments on it.")


def variants(s):
    out = {s, s.replace("'", "&apos;"), s.replace("'", "&#39;"), s.replace("’", "&rsquo;"), s.replace("—", "&mdash;"), s.replace("—", "\\u2014")}
    return [v for v in out]


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "--table":
        esc = lambda s: " ".join(s.split()).replace("|", "\\|").replace("<", "&lt;")
        rows = ["| # | Page | Before | After |", "|---|---|---|---|"]
        seen = {}
        for f, b, a in P:
            if (b, a) in seen: seen[(b, a)].append(f); continue
            seen[(b, a)] = [f]
        for i, ((b, a), fs) in enumerate(seen.items(), 1):
            rows.append("| %d | %s | %s | %s |" % (i, ", ".join("`%s`" % x for x in fs), esc(b), esc(a)))
        open(sys.argv[2], "w", encoding="utf-8").write("\n".join(rows) + "\n")
        print("rows:", len(seen)); return
    missing = 0
    for f, b, a in P:
        path = os.path.join(ROOT, f); t = open(path, encoding="utf-8").read(); n = 0
        for v in variants(b):
            if v in t:
                av = a.replace("'", "&apos;") if "&apos;" in v and "'" in b else a
                n += t.count(v); t = t.replace(v, av)
        if n == 0: missing += 1; print("NOT FOUND:", f, "|", b[:70])
        elif mode == "--apply": open(path, "w", encoding="utf-8").write(t)
    print("%d pairs, %d not found%s" % (len(P), missing, ", applied" if mode == "--apply" else " (dry run)"))
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()
