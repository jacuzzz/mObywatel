let localStream;
let qrTimerInterval = null;
let qrTimerEndTs = 0;
const typeNumber = 5; // QR Code version 5 (37x37 modules)

function closeCamera() {
  const cameraContainer = document.getElementById("camera-container");
  if (cameraContainer) cameraContainer.style.display = "none";
  if (localStream) {
    try {
      localStream.getTracks().forEach((track) => track.stop());
    } catch (_) {}
  }
  localStream = null;
  try {
    document.body.classList.remove("camera-open");
    document.body.classList.remove("camera-opening");
  } catch (_) {}
}

function closeShowQr() {
  const qrContainer = document.getElementById("qr-code-container");
  if (qrContainer) qrContainer.style.display = "none";
  const img = document.getElementById("qr-image");
  if (img) img.src = "";
  if (qrTimerInterval) {
    clearInterval(qrTimerInterval);
    qrTimerInterval = null;
  }
  qrTimerEndTs = 0;
  try {
    document.body.classList.remove("camera-open");
    document.body.classList.remove("camera-opening");
  } catch (_) {}
}

window.addEventListener("load", () => {
  try {
    if (typeof checkInstallation === "function") checkInstallation();
  } catch (_) {}
});

document.addEventListener("DOMContentLoaded", () => {
  let overlayHeaderObserverInitialized = false;

  function ensureOverlayHeaderObserver() {
    if (overlayHeaderObserverInitialized) return;
    try {
      if (typeof initHeaderTitleObserver === "function") {
        initHeaderTitleObserver({
          headerSelector: "#qr-code-container header",
          mainTitleId: "overlay-main-title",
          headerTitleId: "overlay-header-title",
        });
      }
    } catch (_) {}
    overlayHeaderObserverInitialized = true;
  }

  const scanButton = document.getElementById("scan-qr-button");
  const cameraContainer = document.getElementById("camera-container");
  const video = document.getElementById("camera-view");

  const showQrButton = document.getElementById("show-qr-button");
  const qrContainer = document.getElementById("qr-code-container");
  const qrNumberEl = document.getElementById("qr-code-number");
  const qrImgEl = document.getElementById("qr-image");
  const refreshBtn = document.getElementById("refresh-qr");
  const timerValueEl = document.getElementById("qr-timer-value");
  const timerFillEl = document.getElementById("qr-timer-bar-fill");

  const generateCode = () =>
    String(Math.floor(100000 + Math.random() * 900000));

  const setQr = (code) => {
    if (qrNumberEl) qrNumberEl.textContent = code;
    if (!qrImgEl) return;

    const qrFactory =
      typeof qrcode !== "undefined" && typeof qrcode === "function"
        ? qrcode
        : typeof window !== "undefined" &&
            typeof window.qrcode === "function"
          ? window.qrcode
          : null;

    if (qrFactory) {
      try {
        const ecc = "H";
        const quiet = 4;
        const qr = qrFactory(typeNumber, ecc);
        qr.addData(code);
        qr.make();
        const count = qr.getModuleCount();
        const target = 300;
        const scale = Math.max(2, Math.floor(target / (count + quiet * 2)));
        const size = (count + quiet * 2) * scale;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, size, size);
          ctx.fillStyle = "#000";
          for (let r = 0; r < count; r += 1) {
            for (let c = 0; c < count; c += 1) {
              if (qr.isDark(r, c)) {
                ctx.fillRect(
                  (c + quiet) * scale,
                  (r + quiet) * scale,
                  scale,
                  scale
                );
              }
            }
          }
          qrImgEl.src = canvas.toDataURL("image/png");
          qrImgEl.alt = "Kod QR: " + code;
          return;
        }
      } catch (error) {
        console.error("QR generation error:", error);
      }
    }

    console.error("QR code library not loaded");
    const fallbackCanvas = document.createElement("canvas");
    fallbackCanvas.width = 300;
    fallbackCanvas.height = 300;
    const fallbackCtx = fallbackCanvas.getContext("2d");
    if (fallbackCtx) {
      fallbackCtx.fillStyle = "#f0f0f0";
      fallbackCtx.fillRect(0, 0, 300, 300);
      fallbackCtx.fillStyle = "#333";
      fallbackCtx.font = "16px Arial";
      fallbackCtx.textAlign = "center";
      fallbackCtx.fillText("Blad ladowania", 150, 140);
      fallbackCtx.fillText("biblioteki QR", 150, 160);
      qrImgEl.src = fallbackCanvas.toDataURL("image/png");
      qrImgEl.alt = "Blad generowania kodu QR: " + code;
    }
  };

  const startQrCountdown = () => {
    const total = 3 * 60 * 1000;
    qrTimerEndTs = Date.now() + total;
    if (timerFillEl) {
      timerFillEl.style.transition = "none";
      timerFillEl.style.width = "100%";
      void timerFillEl.offsetWidth;
      timerFillEl.style.transition = "width " + total / 1000 + "s linear";
      requestAnimationFrame(() => {
        if (timerFillEl) timerFillEl.style.width = "0%";
      });
    }

    const update = () => {
      const now = Date.now();
      const left = Math.max(0, qrTimerEndTs - now);
      const mins = Math.floor(left / 60000);
      const secs = Math.floor((left % 60000) / 1000);
      if (timerValueEl)
        timerValueEl.textContent = mins + " min " + secs + " sek";
      if (left <= 0) {
        if (qrTimerInterval) {
          clearInterval(qrTimerInterval);
          qrTimerInterval = null;
        }
        const newCode = generateCode();
        setQr(newCode);
        startQrCountdown();
      }
    };

    update();
    if (qrTimerInterval) {
      clearInterval(qrTimerInterval);
    }
    qrTimerInterval = setInterval(update, 1000);
  };

  const openShowQr = () => {
    const code = generateCode();
    setQr(code);
    try {
      document.body.classList.add("camera-opening");
      document.body.classList.add("camera-open");
    } catch (_) {}
    if (qrContainer) qrContainer.style.display = "block";
    requestAnimationFrame(() => {
      ensureOverlayHeaderObserver();
      requestAnimationFrame(() => {
        try {
          document.body.classList.remove("camera-opening");
        } catch (_) {}
      });
    });
    startQrCountdown();
  };

  const openCamera = async () => {
    if (!cameraContainer || !video) return;
    try {
      document.body.classList.add("camera-opening");
      document.body.classList.add("camera-open");
    } catch (_) {}
    cameraContainer.style.display = "block";

    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (_) {}
    localStream = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
          });
        } catch (_) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        try {
          video.muted = true;
        } catch (_) {}
        video.srcObject = stream;
        localStream = stream;

        const viewport = document.querySelector(".camera-viewport");
        const applyAR = () => {
          if (!viewport) return;
          try {
            const vw = video.videoWidth || 0;
            const vh = video.videoHeight || 0;
            if (vw > 0 && vh > 0) {
              const ar = vw / vh;
              if ("aspectRatio" in viewport.style) {
                viewport.style.aspectRatio = String(ar);
              } else {
                const wpx = viewport.clientWidth || window.innerWidth;
                viewport.style.height = Math.round(wpx / ar) + "px";
              }
            }
          } catch (_) {}
        };

        if (video.readyState >= 1) {
          applyAR();
        } else {
          video.addEventListener("loadedmetadata", applyAR, { once: true });
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        cameraContainer.style.display = "none";
        try {
          document.body.classList.remove("camera-open");
          document.body.classList.remove("camera-opening");
        } catch (_) {}
        alert(
          "Nie mozna uzyskac dostepu do aparatu. Sprawdz uprawnienia w przegladarce."
        );
        return;
      } finally {
        try {
          requestAnimationFrame(() => {
            document.body.classList.remove("camera-opening");
          });
        } catch (_) {}
      }
    } else {
      cameraContainer.style.display = "none";
      try {
        document.body.classList.remove("camera-open");
        document.body.classList.remove("camera-opening");
      } catch (_) {}
      alert("Twoja przegladarka nie wspiera dostepu do aparatu.");
    }
  };

  try {
    window.openCamera = openCamera;
    window.openQrCamera = openCamera;
  } catch (_) {}

  if (scanButton) scanButton.addEventListener("click", openCamera);
  if (showQrButton) showQrButton.addEventListener("click", openShowQr);
  if (refreshBtn)
    refreshBtn.addEventListener("click", () => setQr(generateCode()));

  const podpisKwalifikowany = document.getElementById("podpis_kwalifikowany");
  if (podpisKwalifikowany)
    podpisKwalifikowany.addEventListener("click", openCamera);

  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("scan") === "1" || url.hash === "#scan") {
      openCamera();
    }
  } catch (_) {}
});
