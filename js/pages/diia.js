setTimeout(function () {
  try {
    window.scrollTo(0, 1);
  } catch (e) {}
}, 0);

// Preload i cache tła dla błyskawicznego ładowania
(async function preloadBackgroundImage() {
  try {
    const bgUrl = "/assets/dowod/mid_background_main.webp";
    const cache = await caches.open("mobywatel-v3");

    // Sprawdź czy już jest w cache
    const cached = await cache.match(bgUrl);
    if (cached) {
      return; // Już mamy w cache
    }

    // Preload obrazu wtle
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = "high";

    img.onload = async function () {
      try {
        // Dodaj do cache po załadowaniu
        const response = await fetch(bgUrl);
        if (response.ok) {
          await cache.put(bgUrl, response);
        }
      } catch (_) {}
    };

    img.src = bgUrl;
  } catch (err) {
    console.log("Background preload skipped:", err);
  }
})();

async function applyProfileImage() {
  try {
    var profileImage = document.getElementById("profileImage");
    if (!profileImage) return;

    // Najpierw sprawdź Cache API (szybsze niż localStorage)
    try {
      const cache = await caches.open("profile-images-v1");
      const cachedResponse = await cache.match("profile-image");
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        const objectURL = URL.createObjectURL(blob);
        profileImage.src = objectURL;
        profileImage.style.opacity = "1";
        return;
      }
    } catch (cacheErr) {
      console.log("Cache API not available, using localStorage");
    }

    // Fallback do localStorage
    var stored =
      localStorage.getItem("profileImage") || localStorage.getItem("photo");
    if (stored) {
      profileImage.src = stored;
      profileImage.style.opacity = "1";

      // Zapisz do Cache API dla następnego razu
      try {
        const cache = await caches.open("profile-images-v1");
        const blob = await fetch(stored).then((r) => r.blob());
        await cache.put(
          "profile-image",
          new Response(blob, {
            headers: { "Content-Type": "image/jpeg" },
          })
        );
      } catch (_) {}
    }
  } catch (_) {}
}

// Funkcja do aktualizacji zdjęcia profilowego z automatycznym cachowaniem
async function updateProfileImage(imageData) {
  try {
    // Zapisz w localStorage
    localStorage.setItem("profileImage", imageData);

    // Zapisz w Cache API
    const cache = await caches.open("profile-images-v1");
    const blob = await fetch(imageData).then((r) => r.blob());
    await cache.put(
      "profile-image",
      new Response(blob, {
        headers: { "Content-Type": "image/jpeg" },
      })
    );

    // Odśwież obraz na stronie
    await applyProfileImage();
  } catch (err) {
    console.error("Error updating profile image:", err);
  }
}

let cameraStream = null;
let cameraContainerEl = null;
let cameraVideoEl = null;

function closeCamera() {
  try {
    document.body.classList.remove("camera-open");
    document.body.classList.remove("camera-opening");
  } catch (_) {}
  if (cameraStream) {
    try {
      cameraStream.getTracks().forEach(function (track) {
        try {
          track.stop();
        } catch (_) {}
      });
    } catch (_) {}
    cameraStream = null;
  }
  if (cameraVideoEl) {
    try {
      cameraVideoEl.pause();
      cameraVideoEl.srcObject = null;
    } catch (_) {}
  }
  if (cameraContainerEl) {
    try {
      cameraContainerEl.style.display = "none";
    } catch (_) {}
  }
}

async function openCamera() {
  if (!cameraContainerEl)
    cameraContainerEl = document.getElementById("camera-container");
  if (!cameraVideoEl) cameraVideoEl = document.getElementById("camera-view");
  if (!cameraContainerEl || !cameraVideoEl) {
    window.location.href = "qr.html?scan=1";
    return;
  }
  try {
    document.body.classList.add("camera-opening");
    document.body.classList.add("camera-open");
  } catch (_) {}
  try {
    cameraContainerEl.style.display = "block";
  } catch (_) {}

  if (cameraStream) {
    try {
      cameraStream.getTracks().forEach(function (track) {
        try {
          track.stop();
        } catch (_) {}
      });
    } catch (_) {}
    cameraStream = null;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    closeCamera();
    alert("Twoja przegladarka nie wspiera dostepu do aparatu.");
    return;
  }

  try {
    var stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
    } catch (_) {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
    }
    cameraVideoEl.srcObject = stream;
    cameraStream = stream;
    try {
      var playResult = cameraVideoEl.play();
      if (playResult && typeof playResult.then === "function") {
        playResult.catch(function () {});
      }
    } catch (_) {}

    var viewport = document.querySelector(".camera-viewport");
    var applyAR = function () {
      if (!viewport) return;
      try {
        var vw = cameraVideoEl.videoWidth || 0;
        var vh = cameraVideoEl.videoHeight || 0;
        if (vw > 0 && vh > 0) {
          var ar = vw / vh;
          if ("aspectRatio" in viewport.style) {
            viewport.style.aspectRatio = String(ar);
          } else {
            var wpx = viewport.clientWidth || window.innerWidth;
            viewport.style.height = Math.round(wpx / ar) + "px";
          }
        }
      } catch (_) {}
    };

    if (cameraVideoEl.readyState >= 1) {
      applyAR();
    } else {
      cameraVideoEl.addEventListener("loadedmetadata", applyAR, { once: true });
    }
  } catch (error) {
    console.error("Error accessing camera:", error);
    alert(
      "Nie mozna uzyskac dostepu do aparatu. Sprawdz uprawnienia w przegladarce."
    );
    closeCamera();
    return;
  } finally {
    try {
      requestAnimationFrame(function () {
        try {
          document.body.classList.remove("camera-opening");
        } catch (_) {}
      });
    } catch (_) {
      try {
        document.body.classList.remove("camera-opening");
      } catch (_) {}
    }
  }
}

window.addEventListener("load", function () {
  try {
    if (typeof checkInstallation === "function") checkInstallation();
  } catch (e) {}
  applyProfileImage();
});

document.addEventListener("DOMContentLoaded", function () {
  cameraContainerEl = document.getElementById("camera-container");
  cameraVideoEl = document.getElementById("camera-view");
  try {
    window.openCamera = openCamera;
    window.closeCamera = closeCamera;
  } catch (_) {}

  var notificationTimer = null;
  var hideToast = function (restoreDefault) {
    try {
      var n = document.getElementById("notification");
      if (!n) return;
      var textEl = n.querySelector(".notification-text");
      var defaultText = textEl
        ? textEl.getAttribute("data-default") || textEl.textContent
        : n.getAttribute("data-default") || n.textContent;
      if (notificationTimer) {
        clearTimeout(notificationTimer);
        notificationTimer = null;
      }
      try {
        n.classList.remove("show");
      } catch (_) {}
      try {
        n.style.display = "none";
      } catch (_) {}
      if (restoreDefault) {
        if (textEl) textEl.textContent = defaultText || "";
        else n.textContent = defaultText || "";
      }
    } catch (_) {}
  };

  var showToast = function (msg, durationMs, restoreDefault) {
    try {
      var n = document.getElementById("notification");
      if (!n) return;
      var textEl = n.querySelector(".notification-text");
      if (textEl && !textEl.getAttribute("data-default")) {
        try {
          textEl.setAttribute("data-default", textEl.textContent);
        } catch (_) {}
      }
      var defaultText = textEl
        ? textEl.getAttribute("data-default") || textEl.textContent
        : n.getAttribute("data-default") || n.textContent;
      if (!durationMs || durationMs <= 0) durationMs = 5000;
      var willRestore =
        typeof restoreDefault === "undefined" ? !!msg : !!restoreDefault;
      if (msg != null && String(msg).length) {
        if (textEl) textEl.textContent = msg;
        else n.textContent = msg;
      }
      try {
        n.style.display = "block";
      } catch (_) {}
      try {
        n.classList.add("show");
      } catch (_) {}
      if (notificationTimer) {
        clearTimeout(notificationTimer);
        notificationTimer = null;
      }
      notificationTimer = setTimeout(function () {
        hideToast(willRestore);
      }, durationMs);
    } catch (_) {}
  };

  try {
    var closeBtn = document.querySelector("#notification .notification-close");
    if (closeBtn)
      closeBtn.addEventListener("click", function () {
        hideToast(true);
      });
  } catch (_) {}
  applyProfileImage();

  try {
    var border = document.querySelector(".photo-border");
    var profileImage = document.getElementById("profileImage");
    if (border && profileImage) {
      var updateImageSize = function () {
        var rect = border.getBoundingClientRect();
        profileImage.style.width = rect.width + "px";
        profileImage.style.height = rect.height + "px";
      };
      updateImageSize();
      window.addEventListener("resize", updateImageSize);
    }
  } catch (e) {}

  try {
    var scanIcon = document.querySelector(
      '.quick-actions img[src$="ai002_confirm_identity_mini.svg"]'
    );
    if (scanIcon) {
      var scanBtn = scanIcon.closest(".qa-item") || scanIcon;
      scanBtn.style.cursor = "pointer";
      scanBtn.addEventListener("click", function (ev) {
        try {
          ev.preventDefault();
          ev.stopPropagation();
        } catch (_) {}
        if (typeof openCamera === "function") {
          try {
            openCamera();
          } catch (_) {}
        } else {
          window.location.href = "qr.html?scan=1";
        }
      });
    }
  } catch (_) {}

  try {
    var helpOverlay = document.getElementById("help-overlay");
    var openHelp = function () {
      if (helpOverlay) helpOverlay.style.display = "block";
      try {
        document.body.classList.add("camera-open");
      } catch (_) {}
      try {
        document.body.classList.add("no-scroll");
      } catch (_) {}
    };
    var closeHelp = function () {
      if (helpOverlay) helpOverlay.style.display = "none";
      try {
        document.body.classList.remove("camera-open");
      } catch (_) {}
      try {
        document.body.classList.remove("no-scroll");
      } catch (_) {}
    };
    try {
      window.openHelpOverlay = openHelp;
      window.closeHelpOverlay = closeHelp;
    } catch (_) {}
    var headerHelpIcon = document.querySelector("header.app-header .help-icon");
    if (headerHelpIcon) {
      headerHelpIcon.style.cursor = "pointer";
      headerHelpIcon.addEventListener("click", function (ev) {
        try {
          ev.preventDefault();
          ev.stopPropagation();
        } catch (_) {}
        openHelp();
      });
    }
  } catch (_) {}

  try {
    var dataOverlay = document.getElementById("idcard-data-overlay");
    var moreOverlay = document.getElementById("more-shortcuts-overlay");

    var openData = function () {
      try {
        document.body.classList.add("camera-open");
      } catch (_) {}
      try {
        document.body.classList.add("no-scroll");
      } catch (_) {}
      if (dataOverlay) dataOverlay.style.display = "block";
      try {
        var st = document.getElementById("docStatus");
        if (st) {
          st.textContent = "";
          var ic = document.createElement("img");
          ic.src = "assets/icons/b009_check_mark.svg";
          ic.alt = "";
          ic.className = "status-icon";
          st.appendChild(ic);
          st.appendChild(document.createTextNode("Wydany"));
        }
      } catch (_) {}
      try {
        var ia = document.getElementById("issuingAuthority");
        if (ia) {
          var v = localStorage.getItem("do_issuingAuthority");
          if (v && String(v).trim()) ia.textContent = v;
        }
      } catch (_) {}
      try {
        var val = localStorage.getItem("lastUpdateDate");
        var el = document.getElementById("sukadziwkakurwa_modal");
        if (el && val) el.textContent = val;
      } catch (_) {}
    };
    var closeData = function () {
      if (dataOverlay) dataOverlay.style.display = "none";
      try {
        document.body.classList.remove("camera-open");
      } catch (_) {}
      try {
        document.body.classList.remove("no-scroll");
      } catch (_) {}
    };
    var openMore = function () {
      try {
        document.body.classList.add("camera-open");
      } catch (_) {}
      try {
        document.body.classList.add("no-scroll");
      } catch (_) {}
      if (moreOverlay) moreOverlay.style.display = "block";
    };
    var closeMore = function () {
      if (moreOverlay) moreOverlay.style.display = "none";
      try {
        document.body.classList.remove("camera-open");
      } catch (_) {}
      try {
        document.body.classList.remove("no-scroll");
      } catch (_) {}
    };
    try {
      window.openIdcardDataOverlay = openData;
      window.closeIdcardDataOverlay = closeData;
    } catch (_) {}
    try {
      window.openMoreShortcutsOverlay = openMore;
      window.closeMoreShortcutsOverlay = closeMore;
    } catch (_) {}

    try {
      var dataIcon = document.querySelector(
        '.quick-actions img[src$="dane_dowoduosobistego.svg"]'
      );
      if (dataIcon) {
        var dataBtn = dataIcon.closest(".qa-item") || dataIcon;
        dataBtn.style.cursor = "pointer";
        dataBtn.addEventListener("click", function (ev) {
          try {
            ev.preventDefault();
            ev.stopPropagation();
          } catch (_) {}
          openData();
        });
      }
      var moreIcon = document.querySelector(
        '.quick-actions img[src$="ab011_more_vertical.svg"]'
      );
      if (moreIcon) {
        var moreBtn = moreIcon.closest(".qa-item") || moreIcon;
        moreBtn.style.cursor = "pointer";
        moreBtn.addEventListener("click", function (ev) {
          try {
            ev.preventDefault();
            ev.stopPropagation();
          } catch (_) {}
          openMore();
        });
      }
    } catch (_) {}

    try {
      var lastModal = document.getElementById("sukadziwkakurwa_modal");
      var btnModalUpd = document.getElementById("aktualizuj_modal");
      var pad2 = function (n) {
        return n < 10 ? "0" + n : "" + n;
      };
      var nowStr2 = function () {
        var d = new Date();
        return (
          pad2(d.getDate()) +
          "." +
          pad2(d.getMonth() + 1) +
          "." +
          d.getFullYear()
        );
      };
      if (btnModalUpd && lastModal) {
        btnModalUpd.addEventListener("click", function () {
          var v = nowStr2();
          lastModal.textContent = v;
          try {
            var mainLast = document.getElementById("sukadziwkakurwa");
            if (mainLast) mainLast.textContent = v;
          } catch (_) {}
          try {
            localStorage.setItem("lastUpdateDate", v);
          } catch (_) {}
          var n = document.getElementById("notification");
          if (n) {
            n.style.display = "block";
            n.classList.add("show");
            setTimeout(function () {
              n.classList.remove("show");
              n.style.display = "none";
            }, 3000);
          }
        });
      }
    } catch (_) {}
  } catch (_) {}

  try {
    var up = function (s) {
      if (s == null) return s;
      try {
        return String(s).toLocaleUpperCase("pl");
      } catch (_) {
        return String(s).toUpperCase();
      }
    };
    var formatDateDots = function (val) {
      if (val == null) return val;
      try {
        var s = String(val).trim();
        if (!s) return s;
        var m = s.match(/^(\d{4})[-./](\d{2})[-./](\d{2})$/);
        if (m) {
          var y = m[1],
            mo = m[2],
            d = m[3];
          return d + "." + mo + "." + y;
        }
        m = s.match(/^(\d{2})[-./](\d{2})[-./](\d{4})$/);
        if (m) {
          var d2 = m[1],
            mo2 = m[2],
            y2 = m[3];
          return d2 + "." + mo2 + "." + y2;
        }
        return s.replace(/-/g, ".");
      } catch (_) {
        return val;
      }
    };
    var setText = function (id, value, options) {
      options = options || {};
      var el = document.getElementById(id);
      if (!el) return;
      var formatted = value;
      if (typeof options.formatter === "function")
        formatted = options.formatter(value);
      if (formatted == null) return;
      var text = String(formatted).trim();
      if (!text) return;
      if (options.onlyIfEmpty && String(el.textContent || "").trim()) return;

      if (options.preserveChildren) {
        var elementChildren = Array.prototype.slice
          .call(el.childNodes || [])
          .filter(function (node) {
            return node.nodeType === Node.ELEMENT_NODE;
          });
        el.textContent = text;
        if (elementChildren.length) {
          el.appendChild(document.createTextNode(" "));
          elementChildren.forEach(function (child) {
            el.appendChild(child);
          });
        }
      } else {
        el.textContent = text;
      }
    };

    // Brak EXTRA_MAPPINGS - wszystkie pola DIIA są główne

    [
      "display-name",
      "display-surname",
      "display-birthDate",
      "display-pesel",
      "idSeriesMain",
      "expiryDateMain",
      "issueDateMain",
      "fathernameMain",
      "mothernameMain",
      "placeOfBirth",
      "countryOfOrigin",
      "nationality",
      "mdowod_idSeries",
      "mdowod_expiryDate",
      "mdowod_issueDate",
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = "Brak danych";
    });

    [
      { id: "display-name", key: "diia_name", formatter: up },
      { id: "display-surname", key: "diia_surname", formatter: up },
      {
        id: "display-birthDate",
        key: "diia_birthDate",
        formatter: formatDateDots,
      },
      { id: "display-pesel", key: "diia_pesel", formatter: up },
      { id: "placeOfBirth", key: "diia_placeOfBirth", formatter: up },
      { id: "countryOfOrigin", key: "diia_countryOfOrigin", formatter: up },
      { id: "nationality", key: "diia_nationality", formatter: up },
      { id: "idSeriesMain", key: "md_idSeries", formatter: up },
      { id: "expiryDateMain", key: "md_expiryDate", formatter: formatDateDots },
      { id: "issueDateMain", key: "md_issueDate", formatter: formatDateDots },
      { id: "fathernameMain", key: "fathername", formatter: up },
      { id: "mothernameMain", key: "mothername", formatter: up },
      { id: "idSeries", key: "do_idSeries", formatter: up },
      { id: "expiryDate", key: "do_expiryDate", formatter: formatDateDots },
      { id: "issueDate", key: "do_issueDate", formatter: formatDateDots },
      { id: "fathername", key: "fathername", formatter: up },
      { id: "mothername", key: "mothername", formatter: up },
      { id: "mdowod_idSeries", key: "md_idSeries", formatter: up },
      {
        id: "mdowod_expiryDate",
        key: "md_expiryDate",
        formatter: formatDateDots,
      },
      {
        id: "mdowod_issueDate",
        key: "md_issueDate",
        formatter: formatDateDots,
      },
    ].forEach(function (item) {
      setText(item.id, localStorage.getItem(item.key), {
        formatter: item.formatter,
        preserveChildren: item.preserveChildren,
      });
    });

    try {
      var userDataRaw = localStorage.getItem("userProfileData");
      if (userDataRaw) {
        try {
          var userData = JSON.parse(userDataRaw);
          [
            { id: "display-name", value: userData.name, formatter: up },
            { id: "display-surname", value: userData.surname, formatter: up },
            {
              id: "display-nationality",
              value: userData.nationality,
              formatter: up,
            },
            {
              id: "display-birthDate",
              value: userData.birthDate,
              formatter: formatDateDots,
            },
            { id: "display-pesel", value: userData.pesel, formatter: up },
          ].forEach(function (item) {
            setText(item.id, item.value, {
              formatter: item.formatter,
              onlyIfEmpty: true,
            });
          });
        } catch (_) {}
      }
    } catch (e) {}
  } catch (e) {}

  try {
    var copyToClipboard = function (text, customMsg) {
      if (!text) {
        showToast("Brak danych do skopiowania");
        return;
      }
      var doToast = function () {
        showToast(customMsg || "Skopiowano serię i numer mDowodu");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(doToast)
          .catch(function () {
            try {
              var ta = document.createElement("textarea");
              ta.value = text;
              ta.style.position = "fixed";
              ta.style.opacity = "0";
              document.body.appendChild(ta);
              ta.focus();
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
              doToast();
            } catch (e) {}
          });
      } else {
        try {
          var ta2 = document.createElement("textarea");
          ta2.value = text;
          ta2.style.position = "fixed";
          ta2.style.opacity = "0";
          document.body.appendChild(ta2);
          ta2.focus();
          ta2.select();
          document.execCommand("copy");
          document.body.removeChild(ta2);
          doToast();
        } catch (e) {}
      }
    };

    var getText = function (el) {
      if (!el) return "";
      var t = (el.textContent || "")
        .replace(/\s+/g, " ")
        .replace(/Kopiuj/i, "")
        .trim();
      if (!t) {
        try {
          t = String(el.innerText || "")
            .replace(/Kopiuj/i, "")
            .trim();
        } catch (_) {}
      }
      return t;
    };

    var btnMain = document.getElementById("kopiujMain");
    if (btnMain) {
      btnMain.addEventListener("click", function () {
        var t =
          getText(document.getElementById("idSeriesMain")) ||
          localStorage.getItem("md_idSeries") ||
          "";
        copyToClipboard(String(t).trim());
      });
    }

    var btnModal = document.getElementById("kopiuj");
    if (btnModal) {
      btnModal.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var t2 = localStorage.getItem("do_idSeries") || "";
        copyToClipboard(
          String(t2).trim(),
          "Skopiowano serię i numer dowodu osobistego"
        );
      });
      scanBtn.addEventListener("keydown", function (ev) {
        if (!ev) return;
        if (ev.key === "Enter" || ev.key === " ") {
          try {
            ev.preventDefault();
            ev.stopPropagation();
          } catch (_) {}
          if (typeof openCamera === "function") {
            try {
              openCamera();
            } catch (_) {}
          } else {
            window.location.href = "qr.html?scan=1";
          }
        }
      });
    }
  } catch (e) {}

  try {
    var lastUpdateEl = document.getElementById("sukadziwkakurwa");
    var btn = document.getElementById("aktualizuj");
    var pad = function (n) {
      return n < 10 ? "0" + n : "" + n;
    };
    var nowStr = function () {
      var d = new Date();
      return (
        pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear()
      );
    };

    try {
      var saved = localStorage.getItem("lastUpdateDate");
      if (saved && lastUpdateEl) lastUpdateEl.textContent = saved;
    } catch (_) {}

    if (btn && lastUpdateEl) {
      btn.addEventListener("click", function () {
        var v = nowStr();
        lastUpdateEl.textContent = v;
        try {
          localStorage.setItem("lastUpdateDate", v);
        } catch (_) {}

        var n = document.getElementById("notification");
        if (n) {
          showToast(null, 5000, false);
        }
      });
    }
  } catch (e) {}
});

try {
  document.addEventListener("DOMContentLoaded", function () {
    try {
      var backToDashboard = document.querySelector(
        'header.app-header.dowod-header .header-left a.back-link[href$="documents.html"]'
      );
      if (backToDashboard) {
        backToDashboard.addEventListener("click", function (ev) {
          try {
            ev.preventDefault();
            ev.stopPropagation();
          } catch (_) {}
          var href = backToDashboard.getAttribute("href");
          if (document.startViewTransition) {
            try {
              document.startViewTransition(function () {
                window.location.href = href;
              });
              return;
            } catch (_) {}
          }
          try {
            document.body.classList.add("page-fade-out");
          } catch (_) {}
          setTimeout(function () {
            window.location.href = href;
          }, 280);
        });
      }
    } catch (_) {}
  });
} catch (_) {}

const czasEl = document.querySelector(".czas");

function updateClockNow() {
  const now = new Date();
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const timeString = `Czas: ${pad(now.getHours())}:${pad(
    now.getMinutes()
  )}:${pad(now.getSeconds())} ${pad(now.getDate())}.${pad(
    now.getMonth() + 1
  )}.${now.getFullYear()}`;
  if (czasEl) czasEl.textContent = timeString;
}

if (czasEl) {
  updateClockNow();
  setInterval(updateClockNow, 1000);
}

const lo = document.querySelector("#extra-toggle");
const content = document.querySelector("#extra-content");
const arrow = document.querySelector("#extra-arrow");

var contentinner = content ? content.innerHTML : "";

let isOpen = false;
if (content) content.innerHTML = "";

if (arrow) {
  arrow.src = "assets/icons/ab008_chevron_down.svg";
}
if (lo) lo.style.borderRadius = "12px";

if (lo) {
  lo.addEventListener("click", function () {
    isOpen = !isOpen;
    if (isOpen) {
      lo.style.borderRadius = "12px 12px 0px 0px";
      if (content) content.innerHTML = contentinner;
      if (arrow) {
        arrow.src = "assets/icons/ab007_chevron_up.svg";
      }
    } else {
      lo.style.borderRadius = "12px";
      if (content) content.innerHTML = "";
      if (arrow) {
        arrow.src = "assets/icons/ab008_chevron_down.svg";
      }
    }
  });
}
