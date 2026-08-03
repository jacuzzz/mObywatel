(function () {
  function updateVh() {
    try {
      var h = (window.visualViewport && window.visualViewport.height) || window.innerHeight || document.documentElement.clientHeight || 0;
      if (h > 0) {
        var vh = h * 0.01;
        document.documentElement.style.setProperty("--vh", vh + "px");
      }
    } catch (_) {}
  }
  function rafFix() {
    requestAnimationFrame(function () {
      requestAnimationFrame(updateVh);
    });
  }
  document.addEventListener("DOMContentLoaded", rafFix, { once: true });
  window.addEventListener("pageshow", rafFix);
  window.addEventListener("resize", rafFix);
  window.addEventListener("orientationchange", rafFix);
  setTimeout(rafFix, 300);
})();

function showPwdError(msg) {
  try {
    var el = document.getElementById("passwordError");
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.style.display = "";
    } else {
      el.textContent = "";
      el.style.display = "none";
    }
  } catch (_) {}
}

function redirectToDashboard() {
  try {
    sessionStorage.setItem("userUnlocked", "1");
    sessionStorage.setItem("from-login", "true");
    sessionStorage.setItem("auth_validated", "true");
  } catch (e) {}
  window.location.href = "documents.html";
}

// Funkcja logowania czytająca z pliku password.txt
async function handleLoginSubmit(e) {
  if (e) e.preventDefault();
  var input = document.getElementById("passwordInput");
  var pwd = input ? input.value : "";
  
  if (!pwd) {
    showPwdError("Wpisz hasło.");
    return;
  }

  try {
    const response = await fetch('password.txt?nocache=' + new Date().getTime());
    
    if (!response.ok) {
      showPwdError("Błąd serwera: brak pliku password.txt");
      return;
    }
    
    const serverPassword = (await response.text()).trim();

    if (pwd === serverPassword) {
      // HASŁO POPRAWNE
      localStorage.setItem('userPasswordHash', 'zalogowano_przez_plik'); 
      showPwdError("");
      
      // Sprawdzanie biometrii po zalogowaniu
      if (typeof window.setupBiometricAfterLogin === 'function' && window.BiometricAuth) {
        BiometricAuth.checkPlatformSupport().then(function(isAvailable) {
          if (isAvailable && !BiometricAuth.isRegistered()) {
            setupBiometricAfterLogin(); 
          } else {
            redirectToDashboard(); 
          }
        }).catch(function() {
          redirectToDashboard();
        });
      } else {
        redirectToDashboard();
      }
    } else {
      // HASŁO BŁĘDNE
      showPwdError("Wpisz poprawne hasło.");
    }
  } catch (err) {
    showPwdError("Błąd łączenia z serwerem.");
    console.error(err);
  }
}

function togglePasswordVisibility() {
  const input = document.getElementById("passwordInput");
  const btn = document.querySelector(".login__eye img");
  if (!input || !btn) return;
  
  if (input.type === "password") {
    input.type = "text";
    btn.src = "assets/icons/hide_password.svg";
  } else {
    input.type = "password";
    btn.src = "assets/icons/show_password.svg";
  }
}

(function () {
  function setGreeting() {
    var title = document.querySelector(".login__title");
    if (!title) return;
    var now = new Date();
    var hour = now.getHours();
    title.textContent = (hour >= 18 || hour < 6) ? "Dobry wieczór!" : "Dzień dobry!";
  }
  document.addEventListener("DOMContentLoaded", setGreeting);
})();

document.addEventListener("DOMContentLoaded", function () {
  // Przycisk "Zaloguj się"
  var loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", handleLoginSubmit);
  }
  
  // Logowanie po wciśnięciu Enter
  var passwordInput = document.getElementById("passwordInput");
  if (passwordInput) {
    passwordInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLoginSubmit(e);
      }
    });
  }

  // Obsługa kliknięcia "Nie pamiętasz hasła?"
  var forgotBtn = document.getElementById("forgotPasswordBtn");
  if (forgotBtn) {
    forgotBtn.addEventListener("click", function(e) {
      e.preventDefault(); // Zapobiega odświeżeniu/przeniesieniu
      showPwdError("Błąd połączenia z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.");
    });
  }

  initBiometricUI();
});

// ========== OBSŁUGA BIOMETRII ==========

function initBiometricUI() {
  if (typeof window.BiometricAuth === 'undefined') {
    setTimeout(initBiometricUI, 100);
    return;
  }
  BiometricAuth.checkPlatformSupport().then(function(isAvailable) {
    if (!isAvailable) {
      console.log("Biometria zablokowana przez brak HTTPS lub brak obsługi na urządzeniu.");
      return;
    }
    const isRegistered = BiometricAuth.isRegistered();
    if (isRegistered) {
      addBiometricLoginButton();
    } else {
      showManualBiometricSetupButton(); 
    }
  }).catch(function() {});
}

function showManualBiometricSetupButton() {
  const btn = document.getElementById('manualBiometricSetup');
  if (btn) {
    btn.style.display = 'flex';
    btn.addEventListener('click', function() {
      showBiometricSetupModal();
    });
  }
}

function addBiometricLoginButton() {
  const btn = document.getElementById('manualBiometricSetup');
  if (!btn) return;

  btn.innerHTML = `
    <img src="assets/icons/aa009_fingerprint.svg" alt="Odcisk palca" class="login__biometric-setup-icon">
    <span>Zaloguj się biometrycznie</span>
  `;
  
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.style.display = 'flex';
  newBtn.addEventListener('click', handleBiometricLogin);
}

function handleBiometricLogin(e) {
  if (e) e.preventDefault();
  
  const btn = document.getElementById('manualBiometricSetup');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner"></div><span>Uwierzytelnianie...</span>`;
  }

  BiometricAuth.authenticate()
    .then(function() {
      showPwdError('');
      redirectToDashboard();
    })
    .catch(function(error) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<img src="assets/icons/aa009_fingerprint.svg" alt="Odcisk palca" class="login__biometric-setup-icon"><span>Zaloguj się biometrycznie</span>`;
      }
      showPwdError('Błąd uwierzytelniania biometrycznego.');
    });
}

function setupBiometricAfterLogin() {
  if (!BiometricAuth || !BiometricAuth.isAvailable()) return;
  BiometricAuth.checkPlatformSupport().then(function(isAvailable) {
    if (!isAvailable || BiometricAuth.isRegistered()) {
      redirectToDashboard();
      return;
    }
    showBiometricSetupModal();
  });
}

function showBiometricSetupModal() {
  const modal = document.createElement('div');
  modal.className = 'biometric-setup-modal';
  modal.innerHTML = `
    <div class="biometric-setup-modal__overlay"></div>
    <div class="biometric-setup-modal__content">
      <div class="biometric-setup-modal__icon">
        <img src="assets/icons/aa009_fingerprint.svg" alt="Biometria">
      </div>
      <h2 class="biometric-setup-modal__title">Włączyć logowanie biometryczne?</h2>
      <p class="biometric-setup-modal__text">Zaloguj się szybciej i bezpieczniej używając odcisku palca.</p>
      <div class="biometric-setup-modal__buttons">
        <button class="biometric-setup-modal__btn biometric-setup-modal__btn--secondary" id="biometricSetupCancel">Nie teraz</button>
        <button class="biometric-setup-modal__btn biometric-setup-modal__btn--primary" id="biometricSetupConfirm">Włącz</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const style = document.createElement('style');
  style.textContent = `
    .biometric-setup-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: modalFadeIn 0.3s ease; }
    @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
    .biometric-setup-modal__overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); }
    .biometric-setup-modal__content { position: relative; background: #fff; border-radius: 20px; padding: 32px 24px 24px; max-width: 360px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: modalSlideUp 0.3s ease; }
    @keyframes modalSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .biometric-setup-modal__icon { width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #165ef8 0%, #1a4fd8 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .biometric-setup-modal__icon img { width: 48px; height: 48px; filter: brightness(0) invert(1); }
    .biometric-setup-modal__title { font-size: 1.35rem; font-weight: 600; margin: 0 0 12px 0; color: #131419; }
    .biometric-setup-modal__text { font-size: 0.95rem; color: #5f6675; line-height: 1.5; margin: 0 0 28px 0; }
    .biometric-setup-modal__buttons { display: flex; gap: 12px; }
    .biometric-setup-modal__btn { flex: 1; padding: 14px 20px; border-radius: 12px; font-size: 1rem; font-weight: 500; border: none; cursor: pointer; }
    .biometric-setup-modal__btn--secondary { background: rgba(145, 158, 187, 0.15); color: #5f6675; }
    .biometric-setup-modal__btn--primary { background: #165ef8; color: #fff; }
  `;
  document.head.appendChild(style);

  function closeModalAndRedirect() {
    modal.style.animation = 'modalFadeIn 0.2s ease reverse';
    setTimeout(function() {
      if (modal.parentNode) document.body.removeChild(modal);
      if (style.parentNode) document.head.removeChild(style);
      redirectToDashboard();
    }, 200);
  }

  const confirmBtn = document.getElementById('biometricSetupConfirm');
  const cancelBtn = document.getElementById('biometricSetupCancel');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
      BiometricAuth.register().then(() => {
          addBiometricLoginButton();
          closeModalAndRedirect();
      }).catch((err) => {
          console.error("Błąd podczas konfiguracji biometrii:", err);
          closeModalAndRedirect();
      });
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModalAndRedirect);
  }
}

window.setupBiometricAfterLogin = setupBiometricAfterLogin;