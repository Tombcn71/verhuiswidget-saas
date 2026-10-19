(function () {
  "use strict";

  var current =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();
  if (!current) return;

  var origin = new URL(current.src, window.location.href).origin;
  var companyId = current.getAttribute("data-company-id");
  var mode = (current.getAttribute("data-mode") || "").toLowerCase();

  function reopenIfRemembered() {
    var url = rememberedUrl();
    if (!url) return;
    if (document.body) openModal(url);
    else document.addEventListener("DOMContentLoaded", function () { openModal(url); });
  }

  // ------------------------------------------------------------------
  // Modal: widget in een pop-up met vervaagde achtergrond
  // ------------------------------------------------------------------
  var overlay = null;
  var lastFocus = null;

  // Onthoud een open pop-up: telefoons herladen de pagina soms terwijl de
  // camera-app open is. Dan openen we 'm na het herladen meteen weer.
  var OPEN_KEY = "moverai:popup";
  var OPEN_MAX_AGE = 30 * 60 * 1000;
  function rememberOpen(url) {
    try {
      if (url) sessionStorage.setItem(OPEN_KEY, JSON.stringify({ url: url, t: Date.now() }));
      else sessionStorage.removeItem(OPEN_KEY);
    } catch {}
  }
  function rememberedUrl() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(OPEN_KEY) || "null");
      if (saved && saved.url && Date.now() - saved.t < OPEN_MAX_AGE) return saved.url;
    } catch {}
    return null;
  }

  function onKey(e) {
    if (e.key === "Escape" || e.keyCode === 27) closeModal();
  }

  function closeModal() {
    if (!overlay) return;
    rememberOpen(null);
    document.removeEventListener("keydown", onKey);
    if (overlay._onMessage) window.removeEventListener("message", overlay._onMessage);
    document.documentElement.style.overflow = overlay._prevOverflow || "";
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openModal(widgetUrl) {
    if (overlay) return;
    rememberOpen(widgetUrl);
    lastFocus = document.activeElement;

    var sep = widgetUrl.indexOf("?") === -1 ? "?" : "&";
    var src =
      widgetUrl.indexOf("embed=1") === -1 ? widgetUrl + sep + "embed=1" : widgetUrl;

    // Telefoon: schermvullend (zoals een app), zonder rand. Desktop: venster.
    var mobile = window.matchMedia && window.matchMedia("(max-width: 640px)").matches;

    overlay = document.createElement("div");
    overlay._prevOverflow = document.documentElement.style.overflow;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Offerte aanvragen");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-start;" +
      "justify-content:center;overflow-y:auto;box-sizing:border-box;" +
      (mobile ? "padding:0;" : "padding:24px;") +
      "background:rgba(15,23,42,.5);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);";
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });

    var panel = document.createElement("div");
    panel.style.cssText = mobile
      ? "position:relative;width:100%;height:100dvh;background:#fff;"
      : "position:relative;margin:auto;width:100%;max-width:520px;background:#fff;" +
        "border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.35);";

    var x = document.createElement("button");
    x.type = "button";
    x.setAttribute("aria-label", "Sluiten");
    x.innerHTML = "&times;";
    x.style.cssText =
      "position:absolute;width:34px;height:34px;border:0;cursor:pointer;z-index:1;" +
      (mobile ? "top:14px;right:14px;" : "top:-14px;right:-14px;") +
      "border-radius:999px;background:#0f172a;color:#fff;font-size:20px;line-height:34px;" +
      "box-shadow:0 4px 12px rgba(0,0,0,.3);";
    x.addEventListener("click", closeModal);

    var scroller = document.createElement("div");
    scroller.style.cssText = mobile
      ? "height:100%;overflow:hidden;"
      : "max-height:88vh;overflow-y:auto;border-radius:16px;-webkit-overflow-scrolling:touch;";

    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = "Offerte aanvragen";
    iframe.setAttribute("allow", "camera; clipboard-write");
    iframe.style.cssText =
      "width:100%;border:0;overflow:hidden;display:block;background:transparent;" +
      (mobile ? "height:100%;" : "min-height:520px;");

    overlay._onMessage = function (event) {
      if (event.origin !== origin) return;
      var data = event.data || {};
      // Op de telefoon vult de widget het hele scherm en scrolt hij zelf.
      if (!mobile && data.type === "verhuiswidget:height" && typeof data.height === "number") {
        iframe.style.height = Math.ceil(data.height) + "px";
      }
    };
    window.addEventListener("message", overlay._onMessage);

    scroller.appendChild(iframe);
    panel.appendChild(x);
    panel.appendChild(scroller);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
  }

  // ------------------------------------------------------------------
  // Modus 1: pop-up-links upgraden (script één keer op de site)
  //   Elke <a href=".../widget/<id>?popup"> opent voortaan de modal.
  // ------------------------------------------------------------------
  function closestAnchor(el) {
    while (el && el !== document) {
      if (el.tagName === "A" && el.getAttribute("href")) return el;
      el = el.parentNode;
    }
    return null;
  }

  function isPopupLink(href) {
    return href.indexOf("/widget/") !== -1 && /[?&]popup(=|&|$)/.test(href);
  }

  if (mode === "links" || (!companyId && mode !== "popup" && mode !== "inline")) {
    document.addEventListener(
      "click",
      function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey)
          return;
        var a = closestAnchor(e.target);
        if (!a) return;
        var href = a.href || a.getAttribute("href");
        if (!isPopupLink(href)) return;
        e.preventDefault();
        openModal(new URL(href, window.location.href).href);
      },
      false,
    );
    reopenIfRemembered();
    return;
  }

  if (!companyId) {
    console.error("[VerhuisWidget] data-company-id ontbreekt op het <script>.");
    return;
  }

  var widgetUrl =
    origin + "/widget/" + encodeURIComponent(companyId) + "?embed=1";

  // ------------------------------------------------------------------
  // Modus 2: eigen knop die de modal opent
  // ------------------------------------------------------------------
  if (mode === "popup" || mode === "button" || mode === "modal") {
    var label = current.getAttribute("data-label") || "Offerte aanvragen";
    var color = current.getAttribute("data-color") || "#2563eb";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    function styleBtn() {
      btn.style.cssText =
        "display:inline-block;cursor:pointer;border:0;border-radius:10px;padding:13px 24px;" +
        "font:600 15px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff;" +
        "background:" + color + ";box-shadow:0 1px 2px rgba(0,0,0,.1);transition:filter .15s;";
    }
    styleBtn();
    btn.onmouseenter = function () {
      btn.style.filter = "brightness(0.92)";
    };
    btn.onmouseleave = function () {
      btn.style.filter = "";
    };
    btn.addEventListener("click", function () {
      openModal(widgetUrl);
    });
    current.parentNode.insertBefore(btn, current.nextSibling);
    reopenIfRemembered();

    if (!current.getAttribute("data-color") && window.fetch) {
      window
        .fetch(origin + "/api/widget/meta?id=" + encodeURIComponent(companyId))
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (meta) {
          if (meta && meta.primaryColor) {
            color = meta.primaryColor;
            styleBtn();
          }
        })
        .catch(function () {});
    }
    return;
  }

  // ------------------------------------------------------------------
  // Modus 3 (default): widget inline op de plek van het script
  // ------------------------------------------------------------------
  var frameId = "verhuiswidget-" + companyId;
  if (document.getElementById(frameId)) return;

  var inlineFrame = document.createElement("iframe");
  inlineFrame.id = frameId;
  inlineFrame.src = widgetUrl;
  inlineFrame.title = "Offerte aanvragen";
  inlineFrame.loading = "lazy";
  inlineFrame.setAttribute("allow", "camera; clipboard-write");
  inlineFrame.style.cssText =
    "width:100%;border:0;overflow:hidden;display:block;background:transparent;min-height:520px;";

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data || {};
    if (
      data.type === "verhuiswidget:height" &&
      data.id === companyId &&
      typeof data.height === "number"
    ) {
      inlineFrame.style.height = Math.ceil(data.height) + "px";
    }
  });

  current.parentNode.insertBefore(inlineFrame, current.nextSibling);
})();
