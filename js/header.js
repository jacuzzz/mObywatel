function initHeaderTitleObserver(options) {
  try {
    var opts = options || {};
    var run = function () {
      try {
        var header = document.querySelector(opts.headerSelector || "header");
        var mainTitle = document.getElementById(
          opts.mainTitleId || "main-title"
        );
        var headerTitle = document.getElementById(
          opts.headerTitleId || "header-title"
        );
        if (
          !header ||
          !mainTitle ||
          !headerTitle ||
          typeof IntersectionObserver === "undefined"
        )
          return;

        var onEnter = typeof opts.onEnter === "function" ? opts.onEnter : null;
        var onLeave = typeof opts.onLeave === "function" ? opts.onLeave : null;

        var observer = new IntersectionObserver(
          function (entries) {
            var entry = entries && entries[0];
            if (!entry) return;
            if (entry.isIntersecting) {
              headerTitle.classList.remove("fade-in");
              if (onEnter)
                try {
                  onEnter();
                } catch (_) {}
            } else {
              headerTitle.classList.add("fade-in");
              if (onLeave)
                try {
                  onLeave();
                } catch (_) {}
            }
          },
          {
            rootMargin: "-" + header.offsetHeight + "px 0px 0px 0px",
            threshold: 0,
          }
        );
        observer.observe(mainTitle);
      } catch (_) {}
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run);
    } else {
      run();
    }
  } catch (_) {}
}
