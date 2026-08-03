// Zabezpieczenia przed kopiowaniem i menu kontekstowym
(function () {
  "use strict";

  // Sprawdź czy blokada klawiatury jest wyłączona w trybie deweloperskim
  function isProtectionDisabled() {
    return (
      window.DEV_CONFIG &&
      window.DEV_CONFIG.DISABLE_KEYBOARD_PROTECTION === true
    );
  }

  // Blokuj prawy przycisk myszy (menu kontekstowe)
  document.addEventListener(
    "contextmenu",
    function (e) {
      if (isProtectionDisabled()) return;
      e.preventDefault();
      return false;
    },
    false
  );

  // Blokuj zaznaczanie tekstu
  document.addEventListener(
    "selectstart",
    function (e) {
      if (isProtectionDisabled()) return;
      e.preventDefault();
      return false;
    },
    false
  );

  // Blokuj kopiowanie
  document.addEventListener(
    "copy",
    function (e) {
      if (isProtectionDisabled()) return;
      e.preventDefault();
      return false;
    },
    false
  );

  // Blokuj wycinanie
  document.addEventListener(
    "cut",
    function (e) {
      if (isProtectionDisabled()) return;
      e.preventDefault();
      return false;
    },
    false
  );

  // Blokuj przytrzymanie (long press) na urządzeniach dotykowych
  var longPressTimer = null;

  document.addEventListener(
    "touchstart",
    function (e) {
      // Jeśli to input/textarea, pozwól normalnie działać
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      longPressTimer = setTimeout(function () {
        e.preventDefault();
      }, 500);
    },
    { passive: false }
  );

  document.addEventListener(
    "touchend",
    function () {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    },
    false
  );

  document.addEventListener(
    "touchmove",
    function () {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    },
    false
  );

  // Blokuj skróty klawiszowe do kopiowania/wycinania
  document.addEventListener(
    "keydown",
    function (e) {
      if (isProtectionDisabled()) return;

      // Sprawdź czy to pole input/textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      // Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A, Ctrl+U, Ctrl+S, F12, Ctrl+Shift+I
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "C")) ||
        (e.ctrlKey && (e.key === "x" || e.key === "X")) ||
        (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
        (e.ctrlKey && (e.key === "s" || e.key === "S")) ||
        (e.ctrlKey && (e.key === "a" || e.key === "A")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "i" || e.key === "I")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "j" || e.key === "J")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "c" || e.key === "C")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "k" || e.key === "K")) ||
        (e.metaKey && (e.key === "c" || e.key === "C")) || // Mac Command+C
        (e.metaKey && (e.key === "x" || e.key === "X")) || // Mac Command+X
        (e.metaKey && (e.key === "a" || e.key === "A")) || // Mac Command+A
        (e.metaKey && e.altKey && (e.key === "i" || e.key === "I")) // Mac Cmd+Alt+I
      ) {
        e.preventDefault();
        return false;
      }
    },
    false
  );

  // Blokuj drag & drop
  document.addEventListener(
    "dragstart",
    function (e) {
      if (isProtectionDisabled()) return;
      e.preventDefault();
      return false;
    },
    false
  );

  // Blokuj print screen poprzez wyczyszczenie clipboardu
  document.addEventListener("keyup", function (e) {
    if (isProtectionDisabled()) return;
    // Print Screen (klawisz 44)
    if (e.keyCode === 44 || e.key === "PrintScreen") {
      try {
        navigator.clipboard.writeText("");
      } catch (err) {
        // Ignore clipboard errors
      }
    }
  });

  // Wykrywanie narzędzi deweloperskich (próba)
  var devtoolsOpen = false;
  var threshold = 160;

  setInterval(function () {
    if (isProtectionDisabled()) return;

    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        // Opcjonalnie: można przekierować użytkownika lub wyczyścić dane
        console.clear();
      }
    } else {
      devtoolsOpen = false;
    }
  }, 1000);

  // Nadpisz console.log w trybie produkcyjnym
  if (!isProtectionDisabled()) {
    var noop = function () {};
    console.log = noop;
    console.warn = noop;
    console.error = noop;
    console.info = noop;
    console.debug = noop;
  }

  // Blokuj screenshot na Androidzie (częściowo)
  if (
    !isProtectionDisabled() &&
    navigator.userAgent.toLowerCase().includes("android")
  ) {
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        // Gdy aplikacja idzie w tło, możliwy screenshot
        document.body.style.filter = "blur(20px)";
      } else {
        document.body.style.filter = "none";
      }
    });
  }

  // Dodatkowa ochrona CSS
  if (!isProtectionDisabled()) {
    var style = document.createElement("style");
    style.textContent = `
    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
      pointer-events: auto !important;
    }
    
    input, textarea {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
    
    img {
      pointer-events: none !important;
      -webkit-user-drag: none !important;
      -khtml-user-drag: none !important;
      -moz-user-drag: none !important;
      -o-user-drag: none !important;
      user-drag: none !important;
    }
    
    .help-icon {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    
    /* Dodatkowa ochrona przed screenshotami */
    @media print {
      body { display: none !important; }
    }
  `;
    document.head.appendChild(style);

    // Dodaj watermark do body (niewidoczny, ale widoczny na screenshotach)
    var watermark = document.createElement("div");
    watermark.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 48px;
      opacity: 0.03;
      pointer-events: none;
      z-index: 99999;
      white-space: nowrap;
      color: #000;
      user-select: none;
    `;
    watermark.textContent = "discord.gg/shadxwshxp";
    document.body.appendChild(watermark);
  }
})();
