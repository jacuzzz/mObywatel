document.addEventListener("DOMContentLoaded", () => {
  // Don't clear userUnlocked - it's needed for password protection
  // Only clear navigation-specific data if needed
  // if (!document.referrer) sessionStorage.clear(); // DISABLED - was clearing userUnlocked
});
