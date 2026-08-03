document.addEventListener("DOMContentLoaded", function () {
  try {
  } catch (e) {}
  const introLabel = document.querySelector(".intro__label");
  try {
    if (typeof initHeaderTitleObserver === "function") {
      initHeaderTitleObserver({
        onEnter: function () {
          if (introLabel) introLabel.classList.remove("is-hidden");
        },
        onLeave: function () {
          if (introLabel) introLabel.classList.add("is-hidden");
        },
      });
    }
  } catch (_) {}

  try {
    window.logoutUser = function (ev) {
      try {
        if (ev && ev.preventDefault) ev.preventDefault();
      } catch (_) {}
      try {
        sessionStorage.removeItem("userUnlocked");
        localStorage.removeItem("userPasswordHash");
      } catch (_) {}
      window.location.replace("login.html");
    };
  } catch (_) {}

  try {
    var themeOverlay = document.getElementById("themeOverlay");
    if (themeOverlay) {
      var applyBtn = document.getElementById("themeApply");
      var cancelBtn = document.getElementById("themeCancel");
      var radios = themeOverlay.querySelectorAll('input[name="theme-mode"]');

      var openOverlay = function () {
        try {
          var mode =
            (window.Theme && window.Theme.getMode && window.Theme.getMode()) ||
            "auto";
          Array.prototype.forEach.call(radios, function (r) {
            r.checked = r.value === mode;
          });
        } catch (_) {}
        try {
          document.body.classList.add("camera-open");
          document.body.classList.add("no-scroll");
        } catch (_) {}
        try {
          themeOverlay.removeAttribute("hidden");
        } catch (_) {}
      };

      var closeOverlay = function () {
        try {
          themeOverlay.setAttribute("hidden", "");
        } catch (_) {}
        try {
          document.body.classList.remove("camera-open");
          document.body.classList.remove("no-scroll");
        } catch (_) {}
      };
      try {
        window.closeThemeOverlay = closeOverlay;
      } catch (_) {}

      if (applyBtn)
        applyBtn.addEventListener("click", function () {
          try {
            var selected = themeOverlay.querySelector(
              'input[name="theme-mode"]:checked'
            );
            if (
              selected &&
              window.Theme &&
              typeof window.Theme.setMode === "function"
            ) {
              window.Theme.setMode(selected.value);
            }
          } catch (_) {}
          closeOverlay();
        });

      if (cancelBtn) cancelBtn.addEventListener("click", closeOverlay);
      try {
        var themeCards = themeOverlay.querySelectorAll(".card[data-theme]");
        Array.prototype.forEach.call(themeCards, function (card) {
          var applyMode = function () {
            try {
              var mode = card.getAttribute("data-theme");
              var r = card.querySelector('input[name="theme-mode"]');
              if (r) {
                r.checked = true;
                try {
                  r.dispatchEvent(new Event("change", { bubbles: true }));
                } catch (_) {}
              } else if (
                mode &&
                window.Theme &&
                typeof window.Theme.setMode === "function"
              ) {
                window.Theme.setMode(mode);
              }
            } catch (_) {}
          };
          card.addEventListener("click", function () {
            applyMode();
          });
          card.addEventListener("keydown", function (e) {
            if (e && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              applyMode();
            }
          });
        });
      } catch (_) {}
      var radiosLive = themeOverlay.querySelectorAll(
        'input[name="theme-mode"]'
      );
      Array.prototype.forEach.call(radiosLive, function (r) {
        r.addEventListener("change", function () {
          try {
            var v = r.value;
            if (window.Theme && typeof window.Theme.setMode === "function" && v)
              window.Theme.setMode(v);
          } catch (_) {}
        });
      });

      var appearanceCardIcon = document.querySelector(
        'img[src$="assets/icons/aa073_mode.svg"], img[src$="aa073_mode.svg"]'
      );
      if (appearanceCardIcon && appearanceCardIcon.closest) {
        var card = appearanceCardIcon.closest(".card");
        if (card) {
          card.style.cursor = "pointer";
          card.addEventListener("click", openOverlay);
          card.addEventListener("keydown", function (e) {
            if (e && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              openOverlay();
            }
          });
          try {
            card.setAttribute("tabindex", "0");
            card.setAttribute("role", "button");
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  // Obsługa karty "Dane paszportu" - wymaga 3 kliknięć
  try {
    const passportCard = document.getElementById("passportCard");
    if (passportCard) {
      let clickCount = 0;
      let clickTimer = null;

      passportCard.style.cursor = "pointer";
      passportCard.addEventListener("click", function () {
        clickCount++;

        // Wyczyść poprzedni timer
        if (clickTimer) {
          clearTimeout(clickTimer);
        }

        // Jeśli to trzecie kliknięcie, przejdź do profiledata.html
        if (clickCount >= 3) {
          window.location.href = "profiledata.html";
          return;
        }

        // Zresetuj licznik po 2 sekundach od ostatniego kliknięcia
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 2000);
      });
    }
  } catch (_) {}

  // Obsługa przycisku "O aplikacji" - wymuszenie sprawdzenia aktualizacji
  try {
    const aboutAppCard = document.getElementById("aboutAppCard");
    if (aboutAppCard) {
      aboutAppCard.style.cursor = "pointer";
      aboutAppCard.addEventListener("click", async function () {
        try {
          // Sprawdź czy jest update checker
          if (
            window.__updateChecker &&
            typeof window.__updateChecker.check === "function"
          ) {
            console.log("[More] Wymuszanie sprawdzenia aktualizacji...");
            window.__updateChecker.check();

            // Pokaż krótkie powiadomienie
            const notification = document.createElement("div");
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background: #4299e1;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              z-index: 10000;
              font-size: 14px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            `;
            notification.textContent = "Sprawdzanie aktualizacji...";
            document.body.appendChild(notification);

            setTimeout(() => {
              notification.remove();
            }, 2000);
          }
        } catch (err) {
          console.error("[More] Błąd przy sprawdzaniu aktualizacji:", err);
        }
      });
    }
  } catch (_) {}
});
