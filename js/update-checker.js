/**
 * Update Checker - automatyczne wykrywanie i notyfikowanie o aktualizacjach
 * Dodaj jako: <script src="js/update-checker.js" defer></script>
 */

(function () {
  "use strict";

  let updateAvailable = false;
  let newWorker = null;

  /**
   * Show update notification
   */
  function showUpdateNotification() {
    // Sprawdź czy już nie pokazujemy powiadomienia
    if (document.getElementById("update-notification")) return;

    const notification = document.createElement("div");
    notification.id = "update-notification";
    notification.innerHTML = `
      <style>
        #update-notification {
          position: fixed;
          bottom: calc(90px + env(safe-area-inset-bottom, 0px));
          left: 16px;
          right: 16px;
          background: #1a202c;
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: slideUp 0.3s ease-out;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        #update-notification-content {
          flex: 1;
          margin-right: 12px;
        }
        
        #update-notification-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        #update-notification-text {
          font-size: 12px;
          color: #cbd5e0;
          line-height: 1.4;
        }
        
        #update-notification-button {
          background: #4299e1;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
        }
        
        #update-notification-button:active {
          background: #3182ce;
        }
        
        #update-notification-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: transparent;
          border: none;
          color: #a0aec0;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
        }
      </style>
      <button id="update-notification-close" aria-label="Zamknij">×</button>
      <div id="update-notification-content">
        <div id="update-notification-title">✨ Dostępna aktualizacja</div>
        <div id="update-notification-text">Nowa wersja aplikacji jest gotowa. Odśwież aby zaktualizować.</div>
      </div>
      <button id="update-notification-button">Odśwież</button>
    `;

    document.body.appendChild(notification);

    // Obsługa przycisku odświeżania
    const updateBtn = notification.querySelector("#update-notification-button");
    updateBtn.addEventListener("click", () => {
      if (newWorker) {
        newWorker.postMessage({ type: "SKIP_WAITING" });
      }
      window.location.reload();
    });

    // Obsługa przycisku zamknięcia
    const closeBtn = notification.querySelector("#update-notification-close");
    closeBtn.addEventListener("click", () => {
      notification.remove();
      // Zapamiętaj że użytkownik zamknął (opcjonalnie przypomnij później)
      sessionStorage.setItem("update-dismissed", Date.now().toString());
    });

    // Auto-hide po 30 sekundach jeśli użytkownik nie zareaguje
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideUp 0.3s ease-out reverse";
        setTimeout(() => notification.remove(), 300);
      }
    }, 30000);
  }

  /**
   * Check for updates
   */
  async function checkForUpdates() {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      // Sprawdź aktualizacje
      await registration.update();
      console.log("[Update Checker] Checked for updates");
    } catch (err) {
      console.error("[Update Checker] Failed to check updates:", err);
    }
  }

  /**
   * Setup service worker update detection
   */
  function setupUpdateDetection() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[Update Checker] Controller changed - reloading page");
      window.location.reload();
    });

    navigator.serviceWorker.ready.then((registration) => {
      // Sprawdź czy jest waiting worker (nowa wersja czeka)
      if (registration.waiting) {
        newWorker = registration.waiting;
        updateAvailable = true;
        showUpdateNotification();
      }

      // Nasłuchuj na nowe wersje
      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;

        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // Nowa wersja zainstalowana i czeka
            newWorker = installingWorker;
            updateAvailable = true;

            // Nie pokazuj natychmiast jeśli użytkownik niedawno zamknął notyfikację
            const dismissed = sessionStorage.getItem("update-dismissed");
            if (
              !dismissed ||
              Date.now() - parseInt(dismissed) > 5 * 60 * 1000
            ) {
              showUpdateNotification();
            } else {
              console.log(
                "[Update Checker] Update available but notification dismissed recently"
              );
            }
          }
        });
      });

      // Periodyczne sprawdzanie (co 30 minut)
      setInterval(() => {
        checkForUpdates();
      }, 30 * 60 * 1000);

      // Sprawdź przy każdym powrocie do aplikacji
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          checkForUpdates();
        }
      });
    });

    // Nasłuchuj wiadomości od SW o aktualizacjach
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SW_UPDATED") {
        console.log("[Update Checker] SW updated to:", event.data.version);
      }

      if (event.data && event.data.type === "CONTENT_UPDATED") {
        console.log(
          "[Update Checker] Fresh content cached for:",
          event.data.url
        );

        // Opcjonalnie: pokaż subtelny wskaźnik o świeżej zawartości
        const currentUrl = window.location.href;
        if (
          event.data.url.includes(currentUrl) ||
          currentUrl.includes(event.data.url)
        ) {
          // Obecna strona została zaktualizowana w cache
          console.log(
            "[Update Checker] Current page has fresh content in cache"
          );
        }
      }
    });
  }

  /**
   * Force update check on user action
   */
  function forceUpdateCheck() {
    checkForUpdates();
    console.log("[Update Checker] Manual update check triggered");
  }

  /**
   * Get update status
   */
  function getUpdateStatus() {
    return {
      available: updateAvailable,
      worker: newWorker,
    };
  }

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupUpdateDetection);
  } else {
    setupUpdateDetection();
  }

  // Expose API
  window.__updateChecker = {
    check: forceUpdateCheck,
    status: getUpdateStatus,
    show: showUpdateNotification,
  };

  console.log("[Update Checker] Initialized");
})();
