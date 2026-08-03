document.addEventListener("DOMContentLoaded", function () {
  try {
    if (typeof initHeaderTitleObserver === "function")
      initHeaderTitleObserver();
  } catch (_) {}
});
