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

  /* ---- Blueprint: draw the sprinkler layout on scroll ---- */
  var bpTrack = document.getElementById("bpTrack");
  if (bpTrack) {
    var pipes = bpTrack.querySelectorAll(".pipe");
    var marks = bpTrack.querySelectorAll(".head, .dim");
    function drawLayout(p) {
      pipes.forEach(function (el) {
        var s = parseFloat(el.dataset.start), e = parseFloat(el.dataset.end);
        var f = e > s ? (p - s) / (e - s) : 1;
        f = f < 0 ? 0 : f > 1 ? 1 : f;
        el.style.strokeDashoffset = String(1 - f);
      });
      marks.forEach(function (el) {
        var at = parseFloat(el.dataset.at);
        var o = (p - at) / 0.05;
        el.style.opacity = String(o < 0 ? 0 : o > 1 ? 1 : o);
      });
    }
    if (reduceMotion) {
      drawLayout(1);
    } else {
      var bpTicking = false;
      function bpUpdate() {
        var total = bpTrack.offsetHeight - window.innerHeight;
        var scrolled = -bpTrack.getBoundingClientRect().top;
        var p = total > 0 ? scrolled / total : 0;
        drawLayout(p < 0 ? 0 : p > 1 ? 1 : p);
        bpTicking = false;
      }
      window.addEventListener("scroll", function () {
        if (!bpTicking) { bpTicking = true; requestAnimationFrame(bpUpdate); }
      }, { passive: true });
      window.addEventListener("resize", bpUpdate);
      bpUpdate();
    }
  }

  /* ---- Contact form ----
     Submits to Formspree (works on any static host). Until the endpoint
     below is set to your real form ID, it falls back to the visitor's
     email client so the form is never dead.

     SETUP: create a free form at https://formspree.io, then replace
     "your-form-id" with your form ID (e.g. "xmyzabcd").
  */
  var FORMSPREE_ENDPOINT = "https://formspree.io/f/your-form-id";

  var form = document.getElementById("contactForm");
  var note = document.getElementById("formNote");
  var submitBtn = document.getElementById("cfSubmit");
  var nameEl = document.getElementById("cf-name");
  var emailEl = document.getElementById("cf-email");
  var messageEl = document.getElementById("cf-message");

  function setNote(msg, type) {
    note.className = "form-note" + (type ? " " + type : "");
    note.textContent = msg;
  }

  function mailtoFallback(name, email, message) {
    var subject = "Proposal request — " + name;
    var body =
      "Name: " + name + "\n" +
      "Email: " + email + "\n\n" +
      "Project details:\n" + (message || "(none provided)") + "\n";
    window.location.href = "mailto:info@eversafefl.com" +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setNote("", "");

      var name = nameEl.value.trim();
      var email = emailEl.value.trim();
      var message = messageEl.value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !emailOk) {
        setNote(!name ? "Please enter your name." : "Please enter a valid email address.", "error");
        (!name ? nameEl : emailEl).focus();
        return;
      }

      /* Honeypot filled = bot: silently pretend success, send nothing */
      var honeypot = form.querySelector('[name="_gotcha"]');
      if (honeypot && honeypot.value) {
        form.reset();
        setNote("Thank you — we'll be in touch shortly.", "success");
        return;
      }

      /* Endpoint not configured yet → open the visitor's email client */
      if (FORMSPREE_ENDPOINT.indexOf("your-form-id") !== -1) {
        setNote("Opening your email app… If nothing happens, email info@eversafefl.com directly.", "success");
        mailtoFallback(name, email, message);
        return;
      }

      /* Submit to Formspree via AJAX (no page redirect) */
      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          setNote("Thank you — your request has been sent. We'll reply within one business day.", "success");
          return;
        }
        return res.json().then(function (data) {
          var msg = (data && data.errors && data.errors.length)
            ? data.errors.map(function (er) { return er.message; }).join(", ")
            : "Something went wrong sending your request.";
          setNote(msg + " You can also email info@eversafefl.com.", "error");
        });
      }).catch(function () {
        setNote("Network error — please email info@eversafefl.com directly.", "error");
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
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
