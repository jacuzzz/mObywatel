/**
 * Adjusts the dashboard page's minimum height to ensure the header covers the title properly,
 * accounting for dynamic viewport changes and safe areas on mobile devices.
 * This prevents layout shifts and maintains visual consistency during scrolling.
 */
function setDashboardScrollLimit() {
  try {
    const body = document.body;
    if (!body || !body.classList.contains("dashboard-page")) return;
    const header = document.querySelector("header.app-header");
    const title = document.getElementById("main-title");
    if (!header || !title) return;

    // Measure current viewport height (dynamic where supported)
    const viewportH =
      (window.visualViewport && window.visualViewport.height) ||
      window.innerHeight ||
      document.documentElement.clientHeight ||
      0;
    const headerH = Math.ceil(header.getBoundingClientRect().height || 0);
    const titleRect = title.getBoundingClientRect();
    const coverDistance = Math.max(
      0,
      Math.ceil(titleRect.bottom - headerH + 1)
    );

    // Subtract any bottom safe-area spacer from ::after to keep net extra scroll precise
    let afterH = 0;
    try {
      const afterStyle = window.getComputedStyle(body, "::after");
      const h = afterStyle && afterStyle.getPropertyValue("height");
      afterH = h ? Math.max(0, parseFloat(h)) : 0;
    } catch (_) {
      afterH = 0;
    }

    const extra = Math.max(0, coverDistance - afterH);
    const minH = Math.max(0, Math.round(viewportH + extra));

    // Apply in px to work across browsers (fallback for dvh)
    body.style.minHeight = minH + "px";
  } catch (_) {}
}

// ===== DOCUMENT CARDS MANAGEMENT =====

// Check if coming from login and apply animation
function applyEntryAnimation() {
  try {
    const fromLogin = sessionStorage.getItem("from-login");
    if (fromLogin === "true") {
      sessionStorage.removeItem("from-login");
      const section = document.getElementById("wybor-p");
      if (section) {
        section.style.opacity = "0";
        section.style.transform = "translateY(100vh)";
        requestAnimationFrame(() => {
          section.classList.add("slide-up-enter");
        });
      }
    }
  } catch (e) {}
}

const AVAILABLE_DOCS = {
  mdowod: {
    id: "mdowod",
    title: "mDowód",
    image: "assets/icons/mdowod_bg_big.webp",
    logo: "assets/icons/logo_mdowod.svg",
    href: "dowod.html",
  },
  diia: {
    id: "diia",
    title: "Diia.pl",
    image: "assets/icons/diia_bg_big.webp",
    logo: "assets/icons/logo_mdowod.svg",
    href: "diia.html",
  },
  legszk: {
    id: "legszk",
    title: "Legitymacja szkolna",
    image: "assets/icons/leg_szkolna_bg_big.webp",
    logo: "assets/icons/logo_mdowod.svg",
    href: "legszk.html",
  },
  legstu: {
    id: "legstu",
    title: "Legitymacja studencka",
    image: "assets/icons/leg_studencka_bg_big.webp",
    logo: "assets/icons/logo_mdowod.svg",
    href: "legstu.html",
  },
  prawojazdy: {
    id: "prawojazdy",
    title: "Prawo jazdy",
    image: "assets/icons/prawo_jazdy_bg_big.webp",
    logo: "assets/icons/logo_mdowod.svg",
    href: "prawojazdy.html",
  },
};

let cardOrder = [];
let visibleCards = [];

// Load settings from localStorage
function loadSettings() {
  try {
    const savedOrder = localStorage.getItem("doc-cards-order");
    const savedVisible = localStorage.getItem("doc-cards-visible");

    if (savedOrder) {
      cardOrder = JSON.parse(savedOrder);
    } else {
      cardOrder = ["mdowod", "diia", "legszk", "legstu", "prawojazdy"];
    }

    if (savedVisible) {
      visibleCards = JSON.parse(savedVisible);
    } else {
      visibleCards = ["mdowod"]; // Default: tylko mDowód
    }
  } catch (e) {
    cardOrder = ["mdowod", "diia", "legszk", "legstu", "prawojazdy"];
    visibleCards = ["mdowod"];
  }
}

// Save settings to localStorage
function saveSettings() {
  try {
    localStorage.setItem("doc-cards-order", JSON.stringify(cardOrder));
    localStorage.setItem("doc-cards-visible", JSON.stringify(visibleCards));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}

// Render cards with stacking effect
function renderCards() {
  const container = document.getElementById("cards-container");
  if (!container) return;

  container.innerHTML = "";

  // Filter and sort cards
  const cardsToRender = cardOrder.filter((id) => visibleCards.includes(id));

  // Update container min-height based on number of cards
  const baseHeight = 240; // aspect-ratio height in px (approximate)
  const offsetPerCard = 80; // px offset for each stacked card (increased from 60)
  const totalHeight =
    baseHeight + Math.max(0, cardsToRender.length - 1) * offsetPerCard;
  container.style.minHeight = totalHeight + "px";

  cardsToRender.forEach((docId, index) => {
    const doc = AVAILABLE_DOCS[docId];
    if (!doc) return;

    const card = document.createElement("a");
    card.className = "id-card";
    card.href = doc.href;
    card.dataset.docId = docId;
    card.style.top = index * offsetPerCard + "px";
    card.style.zIndex = index + 1; // Dolne karty mają wyższy z-index

    card.innerHTML = `
      <img
        src="${doc.image}"
        alt="${doc.title}"
        class="id-card-image"
        loading="eager"
        decoding="async"
        width="400"
        height="240"
      />
      <div class="id-card-header">
        <span class="id-card-title">${doc.title}</span>
        <img
          src="${doc.logo}"
          alt="Logo ${doc.title}"
          class="id-card-logo"
          loading="eager"
          width="64"
          height="64"
        />
      </div>
    `;

    // Add click handler with animation
    card.addEventListener("click", function (e) {
      try {
        e.preventDefault();
      } catch (_) {}

      if (card.classList.contains("is-activating")) return;
      card.classList.add("is-activating");
      card.style.pointerEvents = "none";

      setTimeout(function () {
        window.location.href = card.getAttribute("href");
      }, 320);
    });

    container.appendChild(card);
  });
}

// Render sortable list in customize overlay
function renderSortableList() {
  const sortableContainer = document.getElementById("sortable-cards");
  if (!sortableContainer) return;

  sortableContainer.innerHTML = "";

  visibleCards.forEach((docId) => {
    const doc = AVAILABLE_DOCS[docId];
    if (!doc) return;

    const item = document.createElement("div");
    item.className = "sortable-item";
    item.draggable = true;
    item.dataset.docId = docId;

    item.innerHTML = `
      <div class="drag-handle">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="sortable-item-label">${doc.title}</span>
    `;

    sortableContainer.appendChild(item);
  });

  initDragAndDrop();
}

// Initialize drag and drop
let draggedElement = null;
let draggedOverElement = null;
let touchStartY = 0;
let touchCurrentY = 0;
let isDragging = false;

function initDragAndDrop() {
  const items = document.querySelectorAll(".sortable-item");

  items.forEach((item) => {
    // Desktop drag events
    item.addEventListener("dragstart", function (e) {
      draggedElement = this;
      this.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", this.innerHTML);
    });

    item.addEventListener("dragend", function (e) {
      this.classList.remove("dragging");

      // Remove all dragover classes
      const allItems = document.querySelectorAll(".sortable-item");
      allItems.forEach((el) => el.classList.remove("dragover"));

      draggedElement = null;
      draggedOverElement = null;

      // Update order after drag ends
      updateOrderFromDOM();
    });

    item.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (draggedElement && draggedElement !== this) {
        draggedOverElement = this;

        const container = this.parentNode;
        const afterElement = getDragAfterElement(container, e.clientY);

        if (afterElement == null) {
          container.appendChild(draggedElement);
        } else {
          container.insertBefore(draggedElement, afterElement);
        }
      }
    });

    item.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
    });

    // Touch events for mobile
    item.addEventListener(
      "touchstart",
      function (e) {
        isDragging = false;
        touchStartY = e.touches[0].clientY;

        // Add a small delay to distinguish between scroll and drag
        setTimeout(() => {
          if (!isDragging) {
            draggedElement = this;
            this.classList.add("dragging");
            isDragging = true;

            // Prevent scrolling on overlay content
            const overlayContent = document.querySelector(
              "#customize-overlay .overlay-content"
            );
            if (overlayContent) {
              overlayContent.classList.add("dragging-active");
            }
          }
        }, 150);
      },
      { passive: false }
    );

    item.addEventListener(
      "touchmove",
      function (e) {
        if (!isDragging || !draggedElement) return;

        // Prevent scrolling when dragging
        e.preventDefault();
        e.stopPropagation();

        touchCurrentY = e.touches[0].clientY;
        const touch = e.touches[0];

        // Find element under touch
        const elementBelow = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        );
        const sortableItem = elementBelow?.closest(".sortable-item");

        if (sortableItem && sortableItem !== draggedElement) {
          const container = draggedElement.parentNode;
          const afterElement = getDragAfterElement(container, touch.clientY);

          if (afterElement == null) {
            container.appendChild(draggedElement);
          } else {
            container.insertBefore(draggedElement, afterElement);
          }
        }
      },
      { passive: false }
    );

    item.addEventListener(
      "touchend",
      function (e) {
        if (isDragging && draggedElement) {
          draggedElement.classList.remove("dragging");

          // Remove all dragover classes
          const allItems = document.querySelectorAll(".sortable-item");
          allItems.forEach((el) => el.classList.remove("dragover"));

          // Re-enable scrolling on overlay content
          const overlayContent = document.querySelector(
            "#customize-overlay .overlay-content"
          );
          if (overlayContent) {
            overlayContent.classList.remove("dragging-active");
          }

          draggedElement = null;
          isDragging = false;

          // Update order after drag ends
          updateOrderFromDOM();
        }
      },
      { passive: false }
    );

    item.addEventListener(
      "touchcancel",
      function (e) {
        if (draggedElement) {
          draggedElement.classList.remove("dragging");

          // Re-enable scrolling on overlay content
          const overlayContent = document.querySelector(
            "#customize-overlay .overlay-content"
          );
          if (overlayContent) {
            overlayContent.classList.remove("dragging-active");
          }

          draggedElement = null;
          isDragging = false;
        }
      },
      { passive: false }
    );
  });
}

// Helper function to determine where to insert the dragged element
function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".sortable-item:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// Update order from DOM after drag
function updateOrderFromDOM() {
  const items = document.querySelectorAll(".sortable-item");
  const newOrder = [];

  items.forEach((item) => {
    const docId = item.dataset.docId;
    if (docId && visibleCards.includes(docId)) {
      newOrder.push(docId);
    }
  });

  // Update both visibleCards and cardOrder
  visibleCards = newOrder;

  // Update cardOrder to reflect new positions of visible cards
  cardOrder = cardOrder.filter((id) => !visibleCards.includes(id));
  cardOrder = [...visibleCards, ...cardOrder];

  saveSettings();
  renderCards();
}

// Update checkbox states in add overlay
function updateCheckboxStates() {
  const checkboxes = document.querySelectorAll(
    '#add-doc-overlay input[type="checkbox"]'
  );

  checkboxes.forEach((checkbox) => {
    const docId = checkbox.dataset.docId;
    checkbox.checked = visibleCards.includes(docId);
  });
}

// Show overlay
function showOverlay(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;

  overlay.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Update content based on overlay type
  if (overlayId === "add-doc-overlay") {
    updateCheckboxStates();
  } else if (overlayId === "customize-overlay") {
    renderSortableList();
  }
}

// Hide overlay
function hideOverlay(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;

  overlay.style.display = "none";
  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", function () {
  // Load settings and render initial cards
  loadSettings();
  renderCards();

  // Apply entry animation if coming from login
  applyEntryAnimation();

  // Header title observer for floating button
  const addBtn = document.querySelector(".floating-add-doc-btn");
  try {
    if (typeof initHeaderTitleObserver === "function") {
      initHeaderTitleObserver({
        onEnter: function () {
          if (addBtn) addBtn.classList.remove("compact");
        },
        onLeave: function () {
          if (addBtn) addBtn.classList.add("compact");
        },
      });
    }
  } catch (_) {}

  // Set precise scroll limit so the header can just cover the title
  setDashboardScrollLimit();

  // === OVERLAY HANDLERS ===

  // Show add document overlay
  const addDocBtn = document.getElementById("add-doc-btn");
  if (addDocBtn) {
    addDocBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showOverlay("add-doc-overlay");
    });
  }

  // Close add document overlay
  const closeAddBtn = document.getElementById("close-add-overlay");
  if (closeAddBtn) {
    closeAddBtn.addEventListener("click", function () {
      hideOverlay("add-doc-overlay");
    });
  }

  // Handle checkbox changes
  const docCheckboxes = document.querySelectorAll(
    '#add-doc-overlay input[type="checkbox"]'
  );
  docCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const docId = this.dataset.docId;

      if (this.checked) {
        // Sprawdź konflikty przed dodaniem
        let conflictingDocs = [];

        // mdowod i diia wykluczają się
        if (docId === "mdowod" && visibleCards.includes("diia")) {
          conflictingDocs = ["diia"];
        } else if (docId === "diia" && visibleCards.includes("mdowod")) {
          conflictingDocs = ["mdowod"];
        }

        // legitymacja szkolna i studencka wykluczają się
        if (docId === "legszk" && visibleCards.includes("legstu")) {
          conflictingDocs.push("legstu");
        } else if (docId === "legstu" && visibleCards.includes("legszk")) {
          conflictingDocs.push("legszk");
        }

        // Usuń konfliktujące dokumenty
        if (conflictingDocs.length > 0) {
          conflictingDocs.forEach((conflictId) => {
            visibleCards = visibleCards.filter((id) => id !== conflictId);
            // Odznacz checkbox konfliktującego dokumentu
            const conflictCheckbox = document.querySelector(
              `input[data-doc-id="${conflictId}"]`
            );
            if (conflictCheckbox) conflictCheckbox.checked = false;
          });
        }

        // Add to visible cards if not already there
        if (!visibleCards.includes(docId)) {
          visibleCards.push(docId);
        }
      } else {
        // Remove from visible cards
        visibleCards = visibleCards.filter((id) => id !== docId);
      }

      saveSettings();
      renderCards();
    });
  });

  // Show customize view overlay
  const customizeBtn = document.getElementById("customize-view-btn");
  if (customizeBtn) {
    customizeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showOverlay("customize-overlay");
    });
  }

  // Close customize overlay
  const closeCustomizeBtn = document.getElementById("close-customize-overlay");
  if (closeCustomizeBtn) {
    closeCustomizeBtn.addEventListener("click", function () {
      hideOverlay("customize-overlay");
    });
  }

  // Close overlays on backdrop click
  const overlays = document.querySelectorAll(".overlay");
  overlays.forEach((overlay) => {
    const backdrop = overlay.querySelector(".overlay-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        hideOverlay(overlay.id);
      });
    }
  });
});

window.addEventListener("load", setDashboardScrollLimit);
window.addEventListener("resize", setDashboardScrollLimit);
window.addEventListener("orientationchange", setDashboardScrollLimit);
if (window.visualViewport) {
  try {
    window.visualViewport.addEventListener("resize", setDashboardScrollLimit);
  } catch (_) {}
}
