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

  /* ---- Dropdown menu ---- */
  var toggle = document.getElementById("navToggle");
  var menuPanel = document.getElementById("menuPanel");
  function openMenu() {
    menuPanel.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  }
  function closeMenu() {
    menuPanel.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
  if (toggle && menuPanel) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (toggle.getAttribute("aria-expanded") === "true") closeMenu();
      else openMenu();
    });
    menuPanel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("click", function (e) {
      if (menuPanel.classList.contains("open") &&
          !menuPanel.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuPanel.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
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
