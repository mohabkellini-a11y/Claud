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

  /* ---- Mobile nav ---- */
  var toggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");
  function closeMenu() {
    header.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    mobileNav.hidden = true;
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      if (open) {
        closeMenu();
      } else {
        header.classList.add("menu-open");
        toggle.setAttribute("aria-expanded", "true");
        mobileNav.hidden = false;
      }
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
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

  /* ---- Count-up for numeric trust stats ---- */
  var counters = document.querySelectorAll(".trust-num[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion || isNaN(target)) { return; }
    var start = 0, dur = 1100, t0 = null;
    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var val = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
      el.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---- Contact form (backend-free: opens email client via mailto) ---- */
  var form = document.getElementById("contactForm");
  var note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      note.className = "form-note";
      note.textContent = "";

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !emailOk) {
        note.classList.add("error");
        note.textContent = !name
          ? "Please enter your name."
          : "Please enter a valid email address.";
        (!name ? form.name : form.email).focus();
        return;
      }

      var subject = "Proposal request — " + name;
      var body =
        "Name: " + name + "\n" +
        "Email: " + email + "\n\n" +
        "Project details:\n" + (message || "(none provided)") + "\n";

      var mailto = "mailto:info@eversafefl.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      note.classList.add("success");
      note.textContent = "Opening your email app… If nothing happens, email info@eversafefl.com directly.";
      window.location.href = mailto;
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
