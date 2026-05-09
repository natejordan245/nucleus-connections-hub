/* Connections Hub embed loader.
 *
 * Drop into any third-party site (Squarespace, Webflow, plain HTML):
 *
 *   <script async src="https://YOUR-HOST/embed.js"></script>
 *   <button data-nucleus-embed>Join Connections Hub</button>
 *
 * Any element with `data-nucleus-embed` becomes a trigger that opens the
 * signup flow in a modal iframe. When the user finishes the flow, the
 * iframe posts back a "complete" message with a redirect URL — we then
 * navigate the top-level page there so they land on their new profile,
 * already signed in.
 *
 * No bundler, no framework, no globals leaked beyond `window.NucleusEmbed`.
 */
(function () {
  if (window.NucleusEmbed && window.NucleusEmbed.__loaded) return;

  // Resolve the host this script was served from. Fallback: current page.
  function resolveOrigin() {
    var script =
      document.currentScript ||
      Array.prototype.slice
        .call(document.getElementsByTagName("script"))
        .filter(function (s) {
          return /\/embed\.js(\?|$)/.test(s.src || "");
        })
        .pop();
    if (script && script.src) {
      try {
        return new URL(script.src).origin;
      } catch (e) {
        /* ignore */
      }
    }
    return window.location.origin;
  }

  var ORIGIN = resolveOrigin();
  var SIGNUP_URL = ORIGIN + "/embed/signup";

  // ── Styles ────────────────────────────────────────────────────────────
  var STYLE_ID = "nucleus-embed-style";
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      ".nucleus-embed-backdrop{",
      "  position:fixed;inset:0;z-index:2147483600;",
      "  background:rgba(15,23,42,0.55);",
      "  display:flex;align-items:center;justify-content:center;",
      "  padding:24px;opacity:0;transition:opacity 150ms ease;",
      "}",
      ".nucleus-embed-backdrop.is-open{opacity:1;}",
      ".nucleus-embed-frame-wrap{",
      "  position:relative;width:100%;max-width:560px;height:min(720px,90vh);",
      "  background:#fff;border-radius:18px;overflow:hidden;",
      "  box-shadow:0 24px 60px -20px rgba(15,23,42,0.45);",
      "  transform:translateY(8px);transition:transform 150ms ease;",
      "}",
      ".nucleus-embed-backdrop.is-open .nucleus-embed-frame-wrap{transform:translateY(0);}",
      ".nucleus-embed-frame{width:100%;height:100%;border:0;display:block;background:#fff;}",
      ".nucleus-embed-close{",
      "  position:absolute;top:10px;right:10px;z-index:2;",
      "  width:32px;height:32px;border:0;border-radius:9999px;",
      "  background:rgba(15,23,42,0.06);color:#0f172a;cursor:pointer;",
      "  font:600 16px/1 system-ui,-apple-system,sans-serif;",
      "  display:inline-flex;align-items:center;justify-content:center;",
      "}",
      ".nucleus-embed-close:hover{background:rgba(15,23,42,0.12);}",
      "@media (max-width:480px){",
      "  .nucleus-embed-backdrop{padding:0;}",
      "  .nucleus-embed-frame-wrap{max-width:100%;height:100%;border-radius:0;}",
      "}",
    ].join("");
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  // ── Modal ─────────────────────────────────────────────────────────────
  var backdrop = null;
  var iframe = null;
  var lastFocus = null;

  function open() {
    injectStyles();
    if (backdrop) {
      // Already open — focus and bail.
      iframe && iframe.focus && iframe.focus();
      return;
    }
    lastFocus = document.activeElement;

    backdrop = document.createElement("div");
    backdrop.className = "nucleus-embed-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "Connections Hub signup");

    var wrap = document.createElement("div");
    wrap.className = "nucleus-embed-frame-wrap";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "nucleus-embed-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", close);

    iframe = document.createElement("iframe");
    iframe.className = "nucleus-embed-frame";
    iframe.src = SIGNUP_URL;
    iframe.title = "Join Connections Hub";
    iframe.setAttribute("loading", "eager");
    iframe.setAttribute(
      "allow",
      "clipboard-write; clipboard-read; web-share",
    );

    wrap.appendChild(closeBtn);
    wrap.appendChild(iframe);
    backdrop.appendChild(wrap);

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) close();
    });
    document.addEventListener("keydown", onKey);

    document.body.appendChild(backdrop);
    // Lock background scroll.
    document.body.style.overflow = "hidden";
    // Trigger transition.
    requestAnimationFrame(function () {
      backdrop.classList.add("is-open");
    });
  }

  function close() {
    if (!backdrop) return;
    document.removeEventListener("keydown", onKey);
    var node = backdrop;
    backdrop = null;
    iframe = null;
    node.classList.remove("is-open");
    setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, 160);
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  // ── Handoff ───────────────────────────────────────────────────────────
  // The iframe posts { source:"nucleus-embed", type:"complete", url } when
  // signup finishes. We navigate the top-level page so the user lands on
  // their profile already signed in.
  window.addEventListener("message", function (event) {
    if (!event.data || typeof event.data !== "object") return;
    if (event.data.source !== "nucleus-embed") return;
    if (event.origin !== ORIGIN) return;
    if (event.data.type === "complete" && typeof event.data.url === "string") {
      window.location.href = event.data.url;
    } else if (event.data.type === "close") {
      close();
    }
  });

  // ── Trigger wiring ────────────────────────────────────────────────────
  function bindTriggers(root) {
    var nodes = (root || document).querySelectorAll("[data-nucleus-embed]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.__nucleusBound) continue;
      el.__nucleusBound = true;
      el.addEventListener("click", function (e) {
        e.preventDefault();
        open();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindTriggers(document);
    });
  } else {
    bindTriggers(document);
  }

  // Re-bind when new triggers are inserted dynamically (e.g. Squarespace
  // section reflows after the page loads).
  if ("MutationObserver" in window) {
    var obs = new MutationObserver(function () {
      bindTriggers(document);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  // ── Public API ────────────────────────────────────────────────────────
  window.NucleusEmbed = {
    __loaded: true,
    origin: ORIGIN,
    open: open,
    close: close,
  };
})();
