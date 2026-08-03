document.addEventListener("DOMContentLoaded", function () {
  try {
  } catch (e) {}
});

window.addEventListener("load", function () {
  try {
    if (typeof checkInstallation === "function") checkInstallation();
  } catch (e) {}
});

// Funkcja pomocnicza do cachowania zdjęcia
async function cacheProfileImage(imageData) {
  try {
    // Zapisz w localStorage
    localStorage.setItem("profileImage", imageData);

    // Zapisz w Cache API dla szybszego dostępu
    const cache = await caches.open("profile-images-v1");
    const blob = await fetch(imageData).then((r) => r.blob());
    await cache.put(
      "profile-image",
      new Response(blob, {
        headers: { "Content-Type": "image/jpeg" },
      })
    );
  } catch (err) {
    console.log("Cache API not available, using localStorage only");
  }
}

// Funkcja do ładowania zdjęcia z cache
async function loadCachedProfileImage() {
  try {
    var img = document.getElementById("profileImage");
    if (!img) return;

    // Najpierw sprawdź Cache API
    try {
      const cache = await caches.open("profile-images-v1");
      const cachedResponse = await cache.match("profile-image");
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        const objectURL = URL.createObjectURL(blob);
        img.src = objectURL;
        img.style.opacity = "1";
        return;
      }
    } catch (cacheErr) {
      console.log("Cache API not available");
    }

    // Fallback do localStorage
    var savedImage = localStorage.getItem("profileImage");
    if (savedImage) {
      img.src = savedImage;
      img.style.opacity = "1";

      // Zapisz do cache dla następnego razu
      await cacheProfileImage(savedImage);
    }
  } catch (e) {
    console.error("Error loading profile image:", e);
  }
}

(function () {
  try {
    var imageInput = document.getElementById("imageInput");
    if (imageInput) {
      imageInput.addEventListener("change", function (event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = async function (e) {
          var imageUrl = e.target && e.target.result;
          var img = document.getElementById("profileImage");
          if (img && imageUrl) {
            img.src = imageUrl;
            img.style.opacity = "1";
            // Cachuj nowe zdjęcie
            await cacheProfileImage(imageUrl);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  } catch (e) {}
})();

window.addEventListener("load", function () {
  loadCachedProfileImage();
});

document.addEventListener("DOMContentLoaded", function () {
  try {
    var fieldMap = [
      ["name", "name"],
      ["surname", "surname"],
      ["nationality", "nationality"],
      ["birthDate", "birthDate"],
      ["pesel", "pesel"],
      ["lastName", "lastName"],
      ["gender", "gender"],
      ["fatherSurname", "fatherSurname"],
      ["motherSurname", "motherSurname"],
      ["placeOfBirth", "placeOfBirth"],
      ["address", "address"],
      ["postalcode", "postalcode"],
      ["registrationDate", "registrationDate"],
      // mDowód (MD_*) — używa istniejących pól
      ["idSeries", "md_idSeries"],
      ["expiryDate", "md_expiryDate"],
      ["issueDate", "md_issueDate"],
      // Dowód osobisty (DO_*) — oddzielne pola
      ["idSeries_do", "do_idSeries"],
      ["issuingAuthority_do", "do_issuingAuthority"],
      ["expiryDate_do", "do_expiryDate"],
      ["issueDate_do", "do_issueDate"],
      ["fathername", "fathername"],
      ["mothername", "mothername"],
      // DIIA.pl (DIIA_*) — tylko używane pola
      ["name_diia", "diia_name"],
      ["surname_diia", "diia_surname"],
      ["birthDate_diia", "diia_birthDate"],
      ["pesel_diia", "diia_pesel"],
      ["placeOfBirth_diia", "diia_placeOfBirth"],
      ["countryOfOrigin_diia", "diia_countryOfOrigin"],
      ["nationality_diia", "diia_nationality"],
      // Legitymacja szkolna
      ["display-name_legszk", "display-name_legszk"],
      ["display-surname_legszk", "display-surname_legszk"],
      ["display-birthDate_legszk", "display-birthDate_legszk"],
      ["display-pesel_legszk", "display-pesel_legszk"],
      ["display-cardNumber_legszk", "display-cardNumber_legszk"],
      ["display-issueDate_legszk", "display-issueDate_legszk"],
      ["display-expiryDate_legszk", "display-expiryDate_legszk"],
      ["display-schoolName_legszk", "display-schoolName_legszk"],
      ["display-schoolAddress_legszk", "display-schoolAddress_legszk"],
      ["display-schoolPhone_legszk", "display-schoolPhone_legszk"],
      ["display-schoolDirector_legszk", "display-schoolDirector_legszk"],
      // Legitymacja studencka
      ["display-name_legstu", "display-name_legstu"],
      ["display-surname_legstu", "display-surname_legstu"],
      ["display-birthDate_legstu", "display-birthDate_legstu"],
      ["display-pesel_legstu", "display-pesel_legstu"],
      ["display-dataWydania_legstu", "display-dataWydania_legstu"],
      ["display-uczelnia_legstu", "display-uczelnia_legstu"],
      ["display-albumNumber_legstu", "display-albumNumber_legstu"],
      // Prawo jazdy
      ["display-name_prawojazdy", "display-name_prawojazdy"],
      ["display-surname_prawojazdy", "display-surname_prawojazdy"],
      ["display-birthDate_prawojazdy", "display-birthDate_prawojazdy"],
      ["display-birthPlace_prawojazdy", "display-birthPlace_prawojazdy"],
      ["display-pesel_prawojazdy", "display-pesel_prawojazdy"],
      ["display-category_prawojazdy", "display-category_prawojazdy"],
      ["display-expiryDate_prawojazdy", "display-expiryDate_prawojazdy"],
      ["display-issueDate_prawojazdy", "display-issueDate_prawojazdy"],
      ["display-blanketStatus_prawojazdy", "display-blanketStatus_prawojazdy"],
      [
        "display-documentNumber_prawojazdy",
        "display-documentNumber_prawojazdy",
      ],
      ["display-blanketNumber_prawojazdy", "display-blanketNumber_prawojazdy"],
      [
        "display-issuingAuthority_prawojazdy",
        "display-issuingAuthority_prawojazdy",
      ],
      ["display-restrictions_prawojazdy", "display-restrictions_prawojazdy"],
    ];

    var up = function (s) {
      if (s == null) return s;
      try {
        return String(s).toLocaleUpperCase("pl");
      } catch (_) {
        return String(s).toUpperCase();
      }
    };

    // Prefill values from storage
    fieldMap.forEach(function (pair) {
      var id = pair[0],
        key = pair[1];
      var el = document.getElementById(id);
      if (!el) return;
      var val = localStorage.getItem(key);
      if (val != null && String(val).trim() !== "") el.value = val;
    });

    // Auto-save on change/input for instant sync
    var saveField = function (key, val) {
      var s = String(val || "").trim();
      try {
        if (s) localStorage.setItem(key, s);
        else localStorage.removeItem(key);
      } catch (_) {}
    };

    fieldMap.forEach(function (pair) {
      var id = pair[0],
        key = pair[1];
      var el = document.getElementById(id);
      if (!el) return;
      var tag = (el.tagName || "").toLowerCase();
      if (tag === "select") {
        el.addEventListener("change", function () {
          saveField(key, up(el.value));
        });
      } else if (tag === "input") {
        var type = (el.getAttribute("type") || "").toLowerCase();
        if (type === "text") {
          el.addEventListener("input", function () {
            convertToUpperCase(el);
            saveField(key, el.value);
          });
        } else {
          el.addEventListener("change", function () {
            saveField(key, el.value);
          });
        }
      }
    });

    var fixedPrawoJazdy = [
      {
        id: "display-expiryDate_prawojazdy",
        key: "display-expiryDate_prawojazdy",
        value: "Bezterminowo",
      },
      {
        id: "display-blanketStatus_prawojazdy",
        key: "display-blanketStatus_prawojazdy",
        value: "Wydany",
      },
      {
        id: "display-restrictions_prawojazdy",
        key: "display-restrictions_prawojazdy",
        value: "Brak",
      },
    ];

    fixedPrawoJazdy.forEach(function (item) {
      var el = document.getElementById(item.id);
      if (!el) return;
      try {
        el.value = item.value;
        el.readOnly = true;
        el.setAttribute("aria-readonly", "true");
        var type = (el.getAttribute("type") || "").toLowerCase();
        if (type === "date") el.setAttribute("type", "text");
      } catch (_) {}
      saveField(item.key, item.value);
    });
  } catch (e) {}
});

function convertToUpperCase(input) {
  if (!input) return;
  input.value = String(input.value || "").toUpperCase();
}

function saveData() {
  try {
    var get = function (id) {
      var el = document.getElementById(id);
      return el ? el.value : "";
    };
    var put = function (key, val) {
      var s = String(val || "").trim();
      try {
        if (s) localStorage.setItem(key, s);
        else localStorage.removeItem(key);
      } catch (_) {}
    };

    put("name", get("name"));
    put("surname", get("surname"));
    put("nationality", get("nationality"));
    put("birthDate", get("birthDate"));
    put("pesel", get("pesel"));
    put("lastName", get("lastName"));
    put("gender", get("gender"));
    put("fatherSurname", get("fatherSurname"));
    put("motherSurname", get("motherSurname"));
    put("placeOfBirth", get("placeOfBirth"));
    put("address", get("address"));
    put("postalcode", get("postalcode"));
    put("registrationDate", get("registrationDate"));
    // mDowód
    put("md_idSeries", get("idSeries"));
    put("md_expiryDate", get("expiryDate"));
    put("md_issueDate", get("issueDate"));
    // Dowód osobisty
    put("do_idSeries", get("idSeries_do"));
    put("do_issuingAuthority", get("issuingAuthority_do"));
    put("do_expiryDate", get("expiryDate_do"));
    put("do_issueDate", get("issueDate_do"));
    put("fathername", get("fathername"));
    put("mothername", get("mothername"));
    // DIIA.pl — tylko używane pola
    put("diia_name", get("name_diia"));
    put("diia_surname", get("surname_diia"));
    put("diia_birthDate", get("birthDate_diia"));
    put("diia_pesel", get("pesel_diia"));
    put("diia_placeOfBirth", get("placeOfBirth_diia"));
    put("diia_countryOfOrigin", get("countryOfOrigin_diia"));
    put("diia_nationality", get("nationality_diia"));
    // Legitymacja szkolna
    put("display-name_legszk", get("display-name_legszk"));
    put("display-surname_legszk", get("display-surname_legszk"));
    put("display-birthDate_legszk", get("display-birthDate_legszk"));
    put("display-pesel_legszk", get("display-pesel_legszk"));
    put("display-cardNumber_legszk", get("display-cardNumber_legszk"));
    put("display-issueDate_legszk", get("display-issueDate_legszk"));
    put("display-expiryDate_legszk", get("display-expiryDate_legszk"));
    put("display-schoolName_legszk", get("display-schoolName_legszk"));
    put("display-schoolAddress_legszk", get("display-schoolAddress_legszk"));
    put("display-schoolPhone_legszk", get("display-schoolPhone_legszk"));
    put("display-schoolDirector_legszk", get("display-schoolDirector_legszk"));
    // Legitymacja studencka
    put("display-name_legstu", get("display-name_legstu"));
    put("display-surname_legstu", get("display-surname_legstu"));
    put("display-birthDate_legstu", get("display-birthDate_legstu"));
    put("display-pesel_legstu", get("display-pesel_legstu"));
    put("display-dataWydania_legstu", get("display-dataWydania_legstu"));
    put("display-uczelnia_legstu", get("display-uczelnia_legstu"));
    put("display-albumNumber_legstu", get("display-albumNumber_legstu"));
    // Prawo jazdy
    put("display-name_prawojazdy", get("display-name_prawojazdy"));
    put("display-surname_prawojazdy", get("display-surname_prawojazdy"));
    put("display-birthDate_prawojazdy", get("display-birthDate_prawojazdy"));
    put(
      "display-birthPlace_prawojazdy",
      get("display-birthPlace_prawojazdy")
    );
    put("display-pesel_prawojazdy", get("display-pesel_prawojazdy"));
    put("display-category_prawojazdy", get("display-category_prawojazdy"));
    put("display-expiryDate_prawojazdy", "Bezterminowo");
    put("display-issueDate_prawojazdy", get("display-issueDate_prawojazdy"));
    put(
      "display-blanketStatus_prawojazdy",
      "Wydany"
    );
    put(
      "display-documentNumber_prawojazdy",
      get("display-documentNumber_prawojazdy")
    );
    put(
      "display-blanketNumber_prawojazdy",
      get("display-blanketNumber_prawojazdy")
    );
    put(
      "display-issuingAuthority_prawojazdy",
      get("display-issuingAuthority_prawojazdy")
    );
    put(
      "display-restrictions_prawojazdy",
      "Brak"
    );

  } catch (e) {}
}
