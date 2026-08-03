/**
 * Biometric Authentication Module for xObywatel
 * Integracja logowania biometrycznego (odcisk palca, Face ID) z Web Authentication API
 * Zachowuje pełną zgodność z istniejącą logiką aplikacji i PWA
 */

(function () {
  'use strict';

  // Główna klasa obsługi biometrii
  window.BiometricAuth = {
    // Sprawdź czy urządzenie obsługuje biometrię
    isAvailable: function () {
      return (
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      );
    },

    // Sprawdź czy biometria jest dostępna na urządzeniu
    checkPlatformSupport: async function () {
      if (!this.isAvailable()) {
        return false;
      }
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        console.log('[BiometricAuth] Platform authenticator available:', available);
        return available;
      } catch (error) {
        console.error('[BiometricAuth] Error checking platform support:', error);
        return false;
      }
    },

    // Sprawdź czy użytkownik ma zarejestrowaną biometrię
    isRegistered: function () {
      try {
        const registered = localStorage.getItem('biometric_registered');
        return registered === 'true';
      } catch (error) {
        console.error('[BiometricAuth] Error checking registration:', error);
        return false;
      }
    },

    // Zarejestruj biometrię dla użytkownika
    register: async function () {
      if (!this.isAvailable()) {
        throw new Error('Biometric authentication not available');
      }

      try {
        // Pobierz hash hasła do powiązania z biometrią
        const passwordHash = localStorage.getItem('userPasswordHash');
        if (!passwordHash) {
          throw new Error('No password set. Please login with password first.');
        }

        // Generuj challenge (w produkcji powinno być z serwera)
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Utwórz unikalny ID użytkownika
        const userId = await this._getUserId();

        // Opcje dla rejestracji
        const publicKeyOptions = {
          challenge: challenge,
          rp: {
            name: 'xObywatel',
            id: window.location.hostname
          },
          user: {
            id: this._stringToBuffer(userId),
            name: 'user@xobywatel',
            displayName: 'xObywatel User'
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },  // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: 'none'
        };

        console.log('[BiometricAuth] Starting registration...');
        const credential = await navigator.credentials.create({
          publicKey: publicKeyOptions
        });

        if (!credential) {
          throw new Error('Failed to create credential');
        }

        // Zapisz dane biometryczne
        const credentialData = {
          id: credential.id,
          rawId: this._bufferToBase64(credential.rawId),
          type: credential.type,
          response: {
            attestationObject: this._bufferToBase64(credential.response.attestationObject),
            clientDataJSON: this._bufferToBase64(credential.response.clientDataJSON)
          },
          passwordHash: passwordHash,
          registered: new Date().toISOString()
        };

        localStorage.setItem('biometric_credential', JSON.stringify(credentialData));
        localStorage.setItem('biometric_registered', 'true');

        console.log('[BiometricAuth] Registration successful');
        return true;
      } catch (error) {
        console.error('[BiometricAuth] Registration error:', error);
        throw error;
      }
    },

    // Uwierzytelnij użytkownika biometrycznie
    authenticate: async function () {
      if (!this.isAvailable()) {
        throw new Error('Biometric authentication not available');
      }

      if (!this.isRegistered()) {
        throw new Error('Biometric authentication not registered');
      }

      try {
        // Pobierz zapisane dane biometryczne
        const credentialDataStr = localStorage.getItem('biometric_credential');
        if (!credentialDataStr) {
          throw new Error('No biometric credential found');
        }

        const credentialData = JSON.parse(credentialDataStr);

        // Generuj challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Opcje dla uwierzytelniania
        const publicKeyOptions = {
          challenge: challenge,
          rpId: window.location.hostname,
          allowCredentials: [{
            type: 'public-key',
            id: this._base64ToBuffer(credentialData.rawId),
            transports: ['internal']
          }],
          userVerification: 'required',
          timeout: 60000
        };

        console.log('[BiometricAuth] Starting authentication...');
        const assertion = await navigator.credentials.get({
          publicKey: publicKeyOptions
        });

        if (!assertion) {
          throw new Error('Authentication failed');
        }

        // Jeśli uwierzytelnianie się powiodło, ustaw sesję
        sessionStorage.setItem('userUnlocked', '1');
        
        console.log('[BiometricAuth] Authentication successful');
        return credentialData.passwordHash;
      } catch (error) {
        console.error('[BiometricAuth] Authentication error:', error);
        throw error;
      }
    },

    // Usuń rejestrację biometryczną
    unregister: function () {
      try {
        localStorage.removeItem('biometric_credential');
        localStorage.removeItem('biometric_registered');
        console.log('[BiometricAuth] Biometric authentication unregistered');
        return true;
      } catch (error) {
        console.error('[BiometricAuth] Error unregistering:', error);
        return false;
      }
    },

    // Pomocnicze funkcje
    _getUserId: async function () {
      let userId = localStorage.getItem('biometric_user_id');
      if (!userId) {
        // Generuj unikalny ID użytkownika
        const randomBytes = new Uint8Array(16);
        crypto.getRandomValues(randomBytes);
        userId = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('biometric_user_id', userId);
      }
      return userId;
    },

    _stringToBuffer: function (str) {
      return new TextEncoder().encode(str);
    },

    _bufferToBase64: function (buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },

    _base64ToBuffer: function (base64) {
      const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    }
  };

  // Automatyczne sprawdzenie dostępności przy załadowaniu
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      BiometricAuth.checkPlatformSupport().then(function (available) {
        if (available) {
          console.log('[BiometricAuth] ✅ Biometric authentication available');
        } else {
          console.log('[BiometricAuth] ❌ Biometric authentication not available');
        }
      });
    });
  } else {
    BiometricAuth.checkPlatformSupport().then(function (available) {
      if (available) {
        console.log('[BiometricAuth] ✅ Biometric authentication available');
      } else {
        console.log('[BiometricAuth] ❌ Biometric authentication not available');
      }
    });
  }

})();
