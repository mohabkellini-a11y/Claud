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
     Submits as a native HTML POST to FormSubmit.co (see index.html form
     action). A native submission is required for FormSubmit's autoresponse
     and _next redirect to work, so there is no JS submit handler here.
     Client-side "required" validation is enforced by the browser via the
     required attributes on the Name, Email, and Phone fields.
  */

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
