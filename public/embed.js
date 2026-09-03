(function () {
  "use strict";

  var current =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();

  if (!current) return;

  var companyId = current.getAttribute("data-company-id");
  if (!companyId) {
    console.error("[VerhuisWidget] data-company-id ontbreekt op het <script>.");
    return;
  }

  var origin = new URL(current.src, window.location.href).origin;
  var frameId = "verhuiswidget-" + companyId;

  if (document.getElementById(frameId)) return;

  var iframe = document.createElement("iframe");
  iframe.id = frameId;
  iframe.src = origin + "/widget/" + encodeURIComponent(companyId);
  iframe.title = "Verhuisofferte aanvragen";
  iframe.loading = "lazy";
  iframe.setAttribute("allow", "clipboard-write");
  iframe.style.cssText =
    "width:100%;border:0;overflow:hidden;display:block;background:transparent;min-height:520px;";

  current.parentNode.insertBefore(iframe, current.nextSibling);

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data || {};
    if (
      data.type === "verhuiswidget:height" &&
      data.id === companyId &&
      typeof data.height === "number"
    ) {
      iframe.style.height = Math.ceil(data.height) + "px";
    }
  });
})();
