/**
 * PWA Gate - enforce mobile-only and standalone mode
 * Include this script at the top of protected pages
 */

(function () {
  "use strict";

  // Check for dev mode
  const DEV_MODE = window.DEV_CONFIG && window.DEV_CONFIG.DEV_MODE;
  if (DEV_MODE) {
    console.warn("[PWA Gate] 🔧 DEV_MODE - Zabezpieczenia wyłączone");
    return; // Exit early - skip all checks
  }

  /**
   * Check if device is mobile
   */
  function isMobile() {
    // Dev override
    if (window.DEV_CONFIG && window.DEV_CONFIG.SKIP_MOBILE_CHECK) {
      return true;
    }

    // Check screen size
    const isMobileScreen =
      window.innerWidth <= 768 || window.screen.width <= 768;

    // Check user agent
    const ua = navigator.userAgent.toLowerCase();
    const isMobileUA =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
        ua
      );

    // Check touch support
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    return isMobileUA || (isMobileScreen && hasTouch);
  }

  /**
   * Check if running in standalone mode (PWA)
   */
  function isStandalone() {
    // Dev override
    if (window.DEV_CONFIG && window.DEV_CONFIG.SKIP_PWA_CHECK) {
      return true;
    }

    // iOS
    if (window.navigator.standalone === true) {
      return true;
    }

    // Android/Chrome
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return true;
    }

    // Fallback check
    if (window.matchMedia("(display-mode: fullscreen)").matches) {
      return true;
    }

    return false;
  }

  /**
   * Check if authenticated - uses session cache from index.html validation
   */
  async function isAuthenticated() {
    try {
      // Check session cache first (validation done in index.html)
      const sessionValidated = sessionStorage.getItem("auth_validated");
      if (sessionValidated === "true") {
        console.log("[PWA Gate] Session already validated");
        return true;
      }

      // Fallback: check if device is activated (has refresh token)
      // This shouldn't happen if index.html routing works correctly
      const db = await openDB();
      const authState = await getFromDB(db, "auth_state");

      if (!authState || !authState.refreshToken) {
        console.log("[PWA Gate] No refresh token - not activated");
        return false;
      }

      // If we get here, session cache is missing but device is activated
      // This might happen if user manually navigated to a page
      // Redirect to index to validate properly
      console.warn(
        "[PWA Gate] Session not validated but device activated - redirecting to index"
      );
      return false;
    } catch (err) {
      console.error("Auth check failed:", err);
      return false;
    }
  }

  // IndexedDB helpers
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("obywatel_auth", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("auth_state")) {
          db.createObjectStore("auth_state");
        }
      };
    });
  }

  function getFromDB(db, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("auth_state", "readonly");
      const store = tx.objectStore("auth_state");
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Show blocking page
   */
  function showBlockPage(type) {
    const messages = {
      desktop: {
        title: "Dostęp tylko na urządzeniach mobilnych",
        subtitle: "Ta aplikacja działa wyłącznie na smartfonach i tabletach",
        icon: "📱",
      },
      install: {
        title: "Zainstaluj aplikację",
        subtitle:
          "Aby korzystać z mObywatel, dodaj aplikację do ekranu głównego",
        icon: "⬇️",
      },
      activate: {
        title: "Wymagana aktywacja",
        subtitle: "Musisz aktywować urządzenie przed pierwszym użyciem",
        icon: "🔑",
      },
    };

    const msg = messages[type] || messages.desktop;

    document.body.innerHTML = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }
        .block-card {
          background: white;
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
          max-width: 400px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .block-icon {
          font-size: 64px;
          margin-bottom: 24px;
        }
        .block-title {
          font-size: 24px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 12px;
        }
        .block-subtitle {
          font-size: 16px;
          color: #718096;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .block-instructions {
          background: #f7fafc;
          border-radius: 8px;
          padding: 16px;
          text-align: left;
          font-size: 14px;
          color: #2d3748;
          line-height: 1.8;
        }
        .block-instructions strong {
          display: block;
          margin-bottom: 8px;
          color: #1a202c;
        }
        .block-button {
          display: inline-block;
          padding: 14px 32px;
          background: #667eea;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 16px;
          transition: background 0.2s;
        }
        .block-button:hover {
          background: #5568d3;
        }
      </style>
      <div class="block-card">
        <div class="block-icon">${msg.icon}</div>
        <h1 class="block-title">${msg.title}</h1>
        <p class="block-subtitle">${msg.subtitle}</p>
        ${
          type === "install"
            ? `
          <div class="block-instructions">
            <strong>Jak zainstalować:</strong>
            <div style="margin-top: 12px;">
              <strong>iOS (Safari):</strong><br>
              1. Dotknij przycisku udostępniania 
              <svg width="16" height="16" viewBox="0 0 16 16" style="vertical-align: middle; display: inline-block;">
                <path fill="#007AFF" d="M8 0L5 3h2v6h2V3h2zM2 10v4h12v-4h-2v2H4v-2z"/>
              </svg><br>
              2. Wybierz "Dodaj do ekranu głównego"<br><br>
              
              <strong>Android (Chrome):</strong><br>
              1. Dotknij menu ⋮<br>
              2. Wybierz "Dodaj do ekranu głównego"
            </div>
          </div>
        `
            : ""
        }
        ${
          type === "activate"
            ? `
          <a href="./activate.html" class="block-button">Przejdź do aktywacji</a>
        `
            : ""
        }
      </div>
    `;
  }

  /**
   * Track auth check status (but don't block navigation)
   */
  let isAuthCheckComplete = false;
  let isAuthValid = false;

  /**
   * Main gate logic
   */
  async function checkAccess() {
    const currentPage = window.location.pathname;

    // Skip for index, activate page, login page and admin panel
    // These pages handle their own routing and authentication
    if (
      currentPage.includes("index.html") ||
      currentPage === "/" ||
      currentPage.includes("activate.html") ||
      currentPage.includes("login.html") ||
      currentPage.includes("admin.html") ||
      currentPage.includes("admin-login.html")
    ) {
      console.log("[PWA Gate] Skipping check for:", currentPage);
      isAuthCheckComplete = true;
      isAuthValid = true;
      return;
    }

    console.log("[PWA Gate] Checking access for:", currentPage);
    console.log("[PWA Gate] isMobile:", isMobile());
    console.log("[PWA Gate] isStandalone:", isStandalone());

    // Check 1: Mobile only - if not, redirect to index (will show desktop block)
    if (!isMobile()) {
      console.log(
        "[PWA Gate] BLOCKED - Desktop detected → redirecting to index"
      );
      isAuthCheckComplete = true;
      isAuthValid = false;
      window.location.href = "./index.html";
      return;
    }

    // Check 2: Standalone mode (PWA installed) - if not, redirect to index (will show install)
    if (!isStandalone()) {
      console.log(
        "[PWA Gate] BLOCKED - Not in standalone mode → redirecting to index"
      );
      isAuthCheckComplete = true;
      isAuthValid = false;
      window.location.href = "./index.html";
      return;
    }

    // Check 3: Authenticated - if not, redirect to index (will route to activate.html)
    const authenticated = await isAuthenticated();

    isAuthCheckComplete = true;
    isAuthValid = authenticated;

    if (!authenticated) {
      console.log(
        "[PWA Gate] BLOCKED - Not authenticated → redirecting to index"
      );
      window.location.href = "./index.html";
      return;
    }

    // All checks passed - allow access
    console.log("[PWA Gate] ✅ Access granted");
  }

  // Run checks on load (don't wait for DOMContentLoaded - start immediately)
  checkAccess();

  // Also check on visibility change (coming back to app)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      checkAccess();
    }
  });

  // Listen for Service Worker updates
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SW_UPDATED") {
        console.log("[PWA] Service Worker updated to:", event.data.version);
        // Opcjonalnie: pokaż toast o dostępnej aktualizacji
      }

      if (event.data && event.data.type === "CONTENT_UPDATED") {
        console.log("[PWA] Fresh content available for:", event.data.url);
        // Strona została zaktualizowana w tle - świeża zawartość przy następnym odświeżeniu
      }
    });

    // Check for updates periodically (every 30 minutes)
    setInterval(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "CHECK_UPDATE",
        });
      }
    }, 30 * 60 * 1000);
  }

  // Expose for debugging
  window.__pwaGate = {
    isMobile,
    isStandalone,
    isAuthenticated,
    checkAccess,
  };
})();
