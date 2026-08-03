// Inicjalizacja hologramu
(function () {
  console.log("orzel.js loaded");

  function initHologram() {
    const holos = document.querySelectorAll(".holo-back");
    const bases = document.querySelectorAll(".base-back");
    const tops = document.querySelectorAll(".godlo-top");

    console.log(
      "initHologram: found",
      holos.length,
      "holo-back,",
      bases.length,
      "base-back,",
      tops.length,
      "godlo-top"
    );

    if (holos.length === 0) {
      console.warn("No .holo-back elements found!");
      return;
    }

    // Wymuszenie załadowania obrazów tła
    bases.forEach((base) => {
      base.style.display = "block";
      base.style.opacity = "1";
    });

    tops.forEach((top) => {
      top.style.display = "block";
      top.style.opacity = "1";
    });

    // Inicjalna widoczność hologramu w pozycji pionowej
    holos.forEach((holo) => {
      holo.style.opacity = "0.7";
      holo.style.backgroundPosition = "center 50%";
    });

    console.log("Hologram initialized successfully");
  }

  // Uruchom natychmiast - skrypt jest na końcu body
  initHologram();

  // KLUCZOWE: Uruchom też przy każdym pokazaniu strony (nawigacja z cache)
  window.addEventListener("pageshow", function (event) {
    console.log("pageshow event fired, persisted:", event.persisted);
    initHologram();
  });

  // Obsługa deviceorientation
  function handleOrientation(e) {
    if (e.beta === null) return;

    const beta = e.beta;
    const holos = document.querySelectorAll(".holo-back");

    // Zawsze pokazuj gradient - zmienia się intensywność i pozycja
    let t = Math.sin(((beta - 90) * Math.PI) / 180);
    t = Math.abs(t);
    t = Math.pow(t, 0.8); // bardziej wrażliwe na zmiany kąta

    // Zwiększone minimum opacity dla zakresu 60-140
    let minOpacity = 0.3;
    if (beta >= 60 && beta <= 140) {
      minOpacity = 0.7; // mocniejsze kolory w pozycji pionowej
    }
    const opacity = Math.max(minOpacity, t);

    const pos = 100 * t;

    // Zastosuj do wszystkich hologramów na stronie
    holos.forEach((holo) => {
      holo.style.backgroundPosition = `center ${pos}%`;
      holo.style.opacity = opacity;
    });
  }

  // Funkcja inicjalizująca czujniki ruchu - bez requestu, tylko attach listener
  function enableMotionSensor() {
    console.log(
      "[Orzel] Attaching orientation listener (permission should be granted from login.html)"
    );
    window.addEventListener("deviceorientation", handleOrientation);
  }

  // Automatycznie włącz czujniki przy załadowaniu strony
  enableMotionSensor();
})();
