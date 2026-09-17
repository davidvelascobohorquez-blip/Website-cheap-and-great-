(function () {
  "use strict";

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn("[" + name + "]", e); }
  }

  // Sticky nav shrink/shadow state
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 8) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = $("[data-nav-toggle]");
    var links = $("[data-nav-links]");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.getAttribute("data-open") === "true";
        links.setAttribute("data-open", open ? "false" : "true");
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
      });
      $$("a", links).forEach(function (a) {
        a.addEventListener("click", function () {
          links.setAttribute("data-open", "false");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  // Scroll reveal — functional micro-interaction, not gated by reduced-motion
  function initReveals() {
    var targets = $$("[data-reveal]");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });

    targets.forEach(function (el) { io.observe(el); });

    // Safety net: force-reveal anything already in view after 6s
    setTimeout(function () {
      targets.forEach(function (el) {
        if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  function initYear() {
    var el = $("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // Language toggle (EN default, ES available) — pure client-side swap.
  // The served HTML is already valid, complete English content, so a user
  // with JS disabled simply sees the English site (never a blank/broken page).
  var LANG_KEY = "cg-lang";

  function detectLang() {
    try {
      var stored = window.localStorage.getItem(LANG_KEY);
      if (stored === "en" || stored === "es") return stored;
    } catch (e) {}
    var nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return nav.indexOf("es") === 0 ? "es" : "en";
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    $$("[data-en]").forEach(function (el) {
      var value = el.getAttribute(lang === "es" ? "data-es" : "data-en");
      if (value == null) return;
      if (el.tagName === "META") el.setAttribute("content", value);
      else el.textContent = value;
    });
    $$("[data-aria-en]").forEach(function (el) {
      var value = el.getAttribute(lang === "es" ? "data-aria-es" : "data-aria-en");
      if (value != null) el.setAttribute("aria-label", value);
    });
    $$("[data-lang-btn]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang-btn") === lang);
    });
  }

  function initLang() {
    var buttons = $$("[data-lang-btn]");
    if (!buttons.length) return;
    applyLang(detectLang());
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lang = btn.getAttribute("data-lang-btn");
        applyLang(lang);
        try { window.localStorage.setItem(LANG_KEY, lang); } catch (e) {}
      });
    });
  }

  // 3D tilt on service cards — fine-pointer/hover devices only.
  // Functional micro-interaction: not gated by reduced-motion (mouse-driven, not a loop).
  function initCardTilt() {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    $$(".service-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        var rx = (py * -6).toFixed(2);
        var ry = (px * 8).toFixed(2);
        card.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-6px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  function boot() {
    safe(initNav, "initNav");
    safe(initReveals, "initReveals");
    safe(initYear, "initYear");
    safe(initLang, "initLang");
    safe(initCardTilt, "initCardTilt");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
