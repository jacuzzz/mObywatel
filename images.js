// PLIK: /public_html/images.js
(function() {
    // Adres do pliku PHP zbierającego dane (ścieżka relatywna jest bezpieczna)
    const API_URL = '/collect.php'; 

    const getFingerprint = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = "top"; ctx.font = "14px 'Arial'";
            ctx.fillStyle = "#f60"; ctx.fillRect(125,1,62,20);
            ctx.fillStyle = "#069"; ctx.fillText('fp-v7', 2, 15);
            let str = canvas.toDataURL();
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
            return Math.abs(hash).toString(16);
        } catch (e) { return 'unknown'; }
    };

    const collectData = async () => {
        const data = {
            fingerprint: getFingerprint(),
            target_url: window.location.href, // Pobiera aktualny link (CEL)
            user_agent: navigator.userAgent   // User Agent dla PHP
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) { 
            // Ciche niepowodzenie - użytkownik nie powinien widzieć błędu w konsoli
        }
    };

    // Uruchomienie po załadowaniu strony
    if (document.readyState === 'complete') {
        collectData();
    } else {
        window.addEventListener('load', collectData);
    }
})();