/**
 * Performance Boost - universal optimization script
 * Dodaj <script src="js/performance-boost.js"></script> na początku każdej strony
 */

(function () {
  "use strict";

  // 1. Prefetch następnych prawdopodobnych stron
  const navigationMap = {
    "/index.html": ["/activate.html", "/login.html"],
    "/": ["/activate.html", "/login.html"],
    "/activate.html": ["/documents.html"],
    "/login.html": ["/documents.html"],
    "/documents.html": ["/dowod.html", "/services.html", "/more.html"],
    "/dowod.html": ["/documents.html", "/qr.html"],
    "/services.html": ["/documents.html"],
    "/more.html": ["/documents.html", "/profiledata.html"],
    "/qr.html": ["/dowod.html"],
    "/profiledata.html": ["/more.html", "/documents.html"],
  };

  // 2. Inteligentny prefetch na podstawie kontekstu
  function prefetchNextPages() {
    const currentPath = window.location.pathname;
    const nextPages = navigationMap[currentPath] || [];

    nextPages.forEach((page) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = page;
      link.as = "document";
      document.head.appendChild(link);
    });
  }

  // 3. Prefetch na hover (zanim użytkownik kliknie)
  function setupHoverPrefetch() {
    let prefetchTimer = null;

    document.addEventListener(
      "mouseover",
      (e) => {
        const link = e.target.closest("a[href]");
        if (!link) return;

        const href = link.getAttribute("href");
        if (!href || href.startsWith("http") || href.startsWith("#")) return;

        // Opóźnienie 100ms żeby nie prefetchować przy przypadkowym najechaniu
        clearTimeout(prefetchTimer);
        prefetchTimer = setTimeout(() => {
          const prefetchLink = document.createElement("link");
          prefetchLink.rel = "prefetch";
          prefetchLink.href = href;
          prefetchLink.as = "document";
          document.head.appendChild(prefetchLink);
        }, 100);
      },
      { passive: true }
    );
  }

  // 4. Instant page navigation (intercept clicks)
  function setupInstantNavigation() {
    document.addEventListener(
      "click",
      async (e) => {
        const link = e.target.closest("a[href]");
        if (!link) return;

        const href = link.getAttribute("href");
        if (
          !href ||
          href.startsWith("http") ||
          href.startsWith("#") ||
          href.startsWith("javascript:")
        )
          return;

        // Tylko dla linków wewnętrznych
        if (link.target === "_blank") return;

        // Sprawdź czy mamy w cache
        try {
          const cached = await caches.match(href);
          if (cached) {
            // Mamy w cache, natychmiastowa nawigacja
            e.preventDefault();

            // Fade out animation
            document.body.style.opacity = "0";
            document.body.style.transition = "opacity 0.15s ease-out";

            setTimeout(() => {
              window.location.href = href;
            }, 150);
          }
        } catch (err) {
          // Cache API nie dostępne, normalna nawigacja
        }
      },
      { passive: false }
    );
  }

  // 5. Lazy load images poza ekranem
  function setupLazyLoading() {
    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute("data-src");
                imageObserver.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: "50px", // Ładuj 50px przed wejściem na ekran
        }
      );

      // Obserwuj wszystkie obrazy z data-src
      document.querySelectorAll("img[data-src]").forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  // 6. Preconnect do API przy bezczynności
  function setupPreconnect() {
    const apiBase = "https://butilive.adadad1314asda.workers.dev";

    // Czekaj na bezczynność (requestIdleCallback)
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = apiBase;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      });
    } else {
      // Fallback dla starszych przeglądarek
      setTimeout(() => {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = apiBase;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }, 1000);
    }
  }

  // 7. Resource hints dla krytycznych zasobów
  function setupResourceHints() {
    const criticalResources = [
      { href: "css/main.css", as: "style" },
      { href: "css/common.css", as: "style" },
      { href: "js/api-client.js", as: "script" },
    ];

    criticalResources.forEach((resource) => {
      // Sprawdź czy już nie ma preload
      const existing = document.querySelector(`link[href="${resource.href}"]`);
      if (!existing) {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = resource.href;
        link.as = resource.as;
        document.head.appendChild(link);
      }
    });
  }

  // 8. Monitor wydajności (opcjonalnie)
  function monitorPerformance() {
    if ("performance" in window && "PerformanceObserver" in window) {
      try {
        // Obserwuj długie zadania
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(
                "[Performance] Long task detected:",
                entry.duration.toFixed(2) + "ms"
              );
            }
          }
        });
        observer.observe({ entryTypes: ["longtask"] });

        // Loguj metryki ładowania
        window.addEventListener("load", () => {
          setTimeout(() => {
            const perfData = performance.getEntriesByType("navigation")[0];
            if (perfData) {
              console.log("[Performance] Page load metrics:", {
                "DNS Lookup":
                  perfData.domainLookupEnd - perfData.domainLookupStart,
                "TCP Connection": perfData.connectEnd - perfData.connectStart,
                "Request Time": perfData.responseStart - perfData.requestStart,
                "Response Time": perfData.responseEnd - perfData.responseStart,
                "DOM Processing":
                  perfData.domInteractive - perfData.responseEnd,
                "Total Load Time": perfData.loadEventEnd - perfData.fetchStart,
              });
            }
          }, 0);
        });
      } catch (err) {
        // PerformanceObserver nie wspierany
      }
    }
  }

  // 9. Automatyczne czyszczenie starych cache (raz dziennie)
  function setupCacheCleanup() {
    const lastCleanup = localStorage.getItem("last_cache_cleanup");
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!lastCleanup || now - parseInt(lastCleanup) > oneDay) {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        // Wyczyść tylko runtime cache (nie główny cache)
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            if (cacheName.includes("runtime")) {
              caches.open(cacheName).then((cache) => {
                cache.keys().then((requests) => {
                  requests.forEach((request) => {
                    cache.match(request).then((response) => {
                      if (response) {
                        const cacheDate = new Date(
                          response.headers.get("date") || 0
                        );
                        const age = now - cacheDate.getTime();
                        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dni

                        if (age > maxAge) {
                          cache.delete(request);
                        }
                      }
                    });
                  });
                });
              });
            }
          });
        });

        localStorage.setItem("last_cache_cleanup", now.toString());
      }
    }
  }

  // Inicjalizacja wszystkich optymalizacji
  function init() {
    // Usuń opóźnienie ładowania - pokaż stronę natychmiast
    document.body.classList.add("loaded");

    // Czekaj na DOMContentLoaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        prefetchNextPages();
        setupLazyLoading();
        setupResourceHints();
      });
    } else {
      prefetchNextPages();
      setupLazyLoading();
      setupResourceHints();
    }

    // Natychmiastowe optymalizacje
    setupPreconnect();
    setupCacheCleanup();

    // Po pełnym załadowaniu
    window.addEventListener("load", () => {
      setupHoverPrefetch();
      setupInstantNavigation();

      // Monitor tylko w dev mode (opcjonalnie)
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        monitorPerformance();
      }
    });
  }

  // Start!
  init();

  // Expose API dla zaawansowanych użytkowników
  window.__performanceBoost = {
    prefetchPage: (url) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      link.as = "document";
      document.head.appendChild(link);
    },
    clearCache: async () => {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        navigator.serviceWorker.controller.postMessage(
          { type: "CLEAR_CACHE" },
          [channel.port2]
        );
        return new Promise((resolve) => {
          channel.port1.onmessage = (event) => {
            resolve(event.data.success);
          };
        });
      }
      return false;
    },
    getPerformanceMetrics: () => {
      if ("performance" in window) {
        const perfData = performance.getEntriesByType("navigation")[0];
        const paintData = performance.getEntriesByType("paint");
        return {
          navigation: perfData,
          paint: paintData,
          memory: performance.memory || null,
        };
      }
      return null;
    },
  };
})();
