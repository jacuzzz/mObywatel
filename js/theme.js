(function () {
  var STORAGE_KEY = "theme-preference";

  function getStoredMode() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function saveMode(mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (_) {}
  }

  function systemPrefersDark() {
    try {
      return (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch (_) {
      return false;
    }
  }

  function resolveMode(mode) {
    if (mode === "dark" || mode === "light") return mode;
    return systemPrefersDark() ? "dark" : "light";
  }

  function ensureMeta(name, initialContent) {
    var el = document.querySelector('meta[name="' + name + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      if (initialContent) el.setAttribute("content", initialContent);
      document.head.appendChild(el);
    }
    return el;
  }

  function applyTheme(mode) {
    var resolved = resolveMode(mode);
    var html = document.documentElement;
    try {
      html.setAttribute("data-theme", resolved);
    } catch (_) {}

    // Advertise supported color schemes to the UA
    try {
      var colorSchemeMeta = ensureMeta("color-scheme", "light dark");
      colorSchemeMeta.setAttribute("content", "light dark");
      // Also reflect on element style for some UAs
      html.style.colorScheme = resolved === "dark" ? "dark" : "light";
    } catch (_) {}

    // Tweak browser UI color for better integration (1:1 with app)
    try {
      var themeMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeMeta)
        themeMeta = ensureMeta(
          "theme-color",
          resolved === "dark" ? "#121212" : "#ffffff"
        );
      themeMeta.setAttribute(
        "content",
        resolved === "dark" ? "#121212" : "#ffffff"
      );
    } catch (_) {}

    // Swap certain logos on login.html in dark mode
    try {
      var isDark = resolved === "dark";
      var pairs = [
        {
          selector: 'img.login__footerLogo[src*="assets/icons/coi"]',
          light: "assets/icons/coi.svg",
          dark: "assets/icons/coi_dark.svg",
        },
        {
          selector:
            'img.login__footerLogo[src*="assets/icons/ministerstwo_cyfryzacji"]',
          light: "assets/icons/ministerstwo_cyfryzacji.svg",
          dark: "assets/icons/ministerstwo_cyfryzacji_dark.svg",
        },
      ];
      pairs.forEach(function (p) {
        var imgs = document.querySelectorAll(p.selector);
        if (!imgs || !imgs.length) return;
        Array.prototype.forEach.call(imgs, function (img) {
          try {
            if (!img.dataset.srcLight) img.dataset.srcLight = p.light;
            if (!img.dataset.srcDark) img.dataset.srcDark = p.dark;
            var target = isDark ? img.dataset.srcDark : img.dataset.srcLight;
            var current = img.getAttribute("src") || "";
            if (current !== target) img.setAttribute("src", target);
          } catch (_) {}
        });
      });

      // Index page: use dark background image in dark mode
      try {
        var isIndex = !!document.querySelector(".login");
        if (isIndex) {
          var targets = [document.documentElement, document.body];
          var darkBg =
            "url('assets/icons/coi_common_ui_mobywatel_background_dark.webp')";
          targets.forEach(function (el) {
            if (!el || !el.style || !el.style.setProperty) return;
            if (isDark) {
              try {
                el.style.setProperty("background-image", darkBg, "important");
                el.style.setProperty(
                  "background-position",
                  "center",
                  "important"
                );
                el.style.setProperty("background-size", "cover", "important");
                el.style.setProperty(
                  "background-repeat",
                  "no-repeat",
                  "important"
                );
              } catch (_) {}
            } else {
              try {
                el.style.removeProperty("background-image");
                el.style.removeProperty("background-position");
                el.style.removeProperty("background-size");
                el.style.removeProperty("background-repeat");
              } catch (_) {}
            }
          });
        }
      } catch (_) {}
    } catch (_) {}
  }

  function currentMode() {
    return getStoredMode() || "auto";
  }

  function setMode(mode) {
    saveMode(mode);
    applyTheme(mode);
  }

  // React to OS theme changes when in auto
  try {
    var mql =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (mql) {
      var handler = function () {
        if (currentMode() === "auto") applyTheme("auto");
      };
      if (typeof mql.addEventListener === "function")
        mql.addEventListener("change", handler);
      else if (typeof mql.addListener === "function") mql.addListener(handler);
    }
  } catch (_) {}

  // Apply immediately
  try {
    applyTheme(currentMode());
  } catch (_) {}

  // Expose small API
  try {
    window.Theme = {
      setMode: setMode,
      getMode: currentMode,
      apply: applyTheme,
      KEY: STORAGE_KEY,
    };
  } catch (_) {}
})();
