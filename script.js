/* ============================================================
   EverSafe Fire Protection — Interactions
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Current year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Sticky header state ---- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Primary navigation ----
     Sub-menus open on click, Enter or Space (they are buttons). Escape closes.
     Below 1024px the hamburger shows the whole menu as one panel. */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  var subBtns = nav ? Array.prototype.slice.call(nav.querySelectorAll(".nav-btn")) : [];
  function closeSubs(except) {
    subBtns.forEach(function (b) { if (b !== except) b.setAttribute("aria-expanded", "false"); });
  }
  function closeMenu() {
    if (!nav || !toggle) return;
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
  subBtns.forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = b.getAttribute("aria-expanded") === "true";
      closeSubs(b);
      b.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });
  if (toggle && nav) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (toggle.getAttribute("aria-expanded") === "true") { closeMenu(); closeSubs(); }
      else {
        nav.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close menu");
      }
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { closeSubs(); closeMenu(); });
    });
    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) { closeSubs(); closeMenu(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var openBtn = subBtns.filter(function (b) { return b.getAttribute("aria-expanded") === "true"; })[0];
      if (openBtn) { closeSubs(); openBtn.focus(); }
      else if (nav.classList.contains("open")) { closeMenu(); toggle.focus(); }
    });
    nav.addEventListener("focusout", function (e) {
      if (e.relatedTarget && !nav.contains(e.relatedTarget) && window.matchMedia("(min-width: 1024px)").matches) closeSubs();
    });
  }

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Candlelight halo trailing the cursor in the Services section ---- */
  var glow = document.getElementById("servicesGlow");
  var glowSection = document.getElementById("services");
  if (glow && glowSection && !reduceMotion &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var gx = 0, gy = 0, tx = 0, ty = 0, active = false, rafId = null;
    function glowLoop() {
      gx += (tx - gx) * 0.11;           // lag: ease toward the cursor
      gy += (ty - gy) * 0.11;
      var t = performance.now() / 320;  // gentle flame flicker
      var flick = 1 + Math.sin(t) * 0.02 + Math.sin(t * 2.7) * 0.015;
      var sway = Math.sin(t * 1.9) * 2 + Math.sin(t * 3.3) * 1;
      glow.style.transform = "translate(" + gx.toFixed(1) + "px," + (gy - Math.abs(sway)).toFixed(1) + "px) scale(" + flick.toFixed(3) + ")";
      rafId = requestAnimationFrame(glowLoop);
    }
    glowSection.addEventListener("mousemove", function (e) {
      var r = glowSection.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!active) {
        active = true; gx = tx; gy = ty;
        glow.classList.add("on");
        if (!rafId) glowLoop();
      }
    });
    glowSection.addEventListener("mouseleave", function () {
      active = false;
      glow.classList.remove("on");
      setTimeout(function () { if (!active && rafId) { cancelAnimationFrame(rafId); rafId = null; } }, 700);
    });
  }

  /* ---- Contact form ----
     With JavaScript: checks each field when you leave it, sends to /api/contact.php and shows the result on the page.
     Without JavaScript, or if the API fails: the form posts to FormSubmit.co as before, so no request is lost. */
  var cf = document.getElementById("contactForm");
  if (cf && window.fetch && window.FormData) {
    cf.setAttribute("novalidate", "");
    var cfNote = document.getElementById("cfNote"), cfBtn = document.getElementById("cfSubmit");
    var cfFields = ["name", "company", "email", "need", "message"];
    var cfMsg = { name: "Enter your name.", company: "Enter your company.", email: "Enter a valid email address.", need: "Choose what you need.", message: "Tell us about the project." };
    var cfCheck = function (n, serverMsg) {
      var el = cf.elements[n], err = document.getElementById("cf-" + n + "-err");
      var v = el.value.trim(), bad = serverMsg || (!v || (n === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? cfMsg[n] : "");
      err.textContent = bad; err.hidden = !bad;
      if (bad) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
      return !bad;
    };
    cfFields.forEach(function (n) {
      cf.elements[n].addEventListener("blur", function () { cfCheck(n); });
      cf.elements[n].addEventListener("input", function () { if (cf.elements[n].getAttribute("aria-invalid")) cfCheck(n); });
    });
    var cfFallback = false;
    cf.addEventListener("submit", function (e) {
      if (cfFallback) return;                       // second pass: normal post to FormSubmit
      e.preventDefault();
      if (cfBtn.disabled) return;
      var bad = cfFields.filter(function (n) { return !cfCheck(n); });
      if (bad.length) { cf.elements[bad[0]].focus(); return; }
      cfBtn.disabled = true; cfBtn.textContent = "Sending…"; cfNote.className = "form-note"; cfNote.textContent = "";
      var data = new FormData(cf);
      fetch("/api/contact.php", { method: "POST", headers: { "Accept": "application/json" }, body: data })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (res) {
          if (res.body && res.body.ok) {
            cf.classList.add("sent"); cfNote.className = "form-note success";
            cfNote.textContent = "Request received. We will follow up with a fixed-fee proposal, usually within one business day.";
            cfNote.setAttribute("tabindex", "-1"); cfNote.focus(); return;
          }
          if (res.status === 400 && res.body && res.body.fields) {
            var first = null;
            Object.keys(res.body.fields).forEach(function (n) { if (cf.elements[n]) { cfCheck(n, res.body.fields[n]); first = first || n; } });
            cfBtn.disabled = false; cfBtn.textContent = "Request a Proposal"; if (first) cf.elements[first].focus(); return;
          }
          if (res.status === 429) { cfBtn.disabled = false; cfBtn.textContent = "Request a Proposal"; cfNote.className = "form-note error"; cfNote.textContent = "Too many requests. Please wait a few minutes, or call 386-837-4057."; return; }
          throw new Error("api");
        })
        .catch(function () { cfFallback = true; cf.submit(); });
    });
  }

  /* ---- Smooth-scroll offset correction for sticky header ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id === "#" || id === "#top") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });
})();
