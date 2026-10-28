
/* =====================================================
   FIND-ME WEBSITE — UPDATED SCRIPT
   Search, categories, location, registration popup,
   Web3Forms submissions and approved public listings.
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

  // 1. APPROVED PUBLIC BUSINESS LISTINGS
  // Publish only businesses approved for public display.
  const approvedBusinesses = [
    {
      name: "Pyrex delivery",
      category: "Taxi Services",
      area: "Nairobi",
      phone: "0182000479"
    }
  ];

  // 2. PAGE ELEMENTS
  const searchForm = document.getElementById("searchForm");
  const serviceSearch = document.getElementById("serviceSearch");
  const searchResults = document.getElementById("searchResults");
  const serviceGrid = document.getElementById("serviceGrid");

  const locationButton = document.getElementById("locationButton");
  const locationStatus = document.getElementById("locationStatus");

  const registrationModal = document.getElementById("registrationModal");
  const openRegistration = document.getElementById("openRegistration");
  const closeRegistration = document.getElementById("closeRegistration");

  const providerForm = document.getElementById("providerForm");
  const registrationMessage = document.getElementById("registrationMessage");

  const currentYear = document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // 3. DISPLAY APPROVED BUSINESS LISTINGS
  const approvedGrid = document.getElementById("approvedBusinessesGrid");

  function renderApprovedServices() {
    if (!approvedGrid) return;

    approvedGrid.replaceChildren();

    if (approvedBusinesses.length === 0) {
      const message = document.createElement("p");
      message.textContent =
        "No approved business listings are available yet.";
      approvedGrid.appendChild(message);
      return;
    }

    approvedBusinesses.forEach(function (business) {
      const card = document.createElement("article");
      card.className = "business-card";

      const category = document.createElement("span");
      category.className = "badge-category";
      category.textContent = business.category || "Local Service";

      const name = document.createElement("h3");
      name.textContent = business.name || "Business";

      const area = document.createElement("p");
      area.className = "location-text";
      area.textContent = "📍 " + (business.area || "Area not provided");

      card.append(category, name, area);

      if (business.phone) {
        const callButton = document.createElement("a");
        callButton.className = "call-btn";

        const safePhone = String(business.phone).replace(/[^\d+]/g, "");
        callButton.href = "tel:" + safePhone;
        callButton.textContent = "📞 Call Now: " + business.phone;

        card.appendChild(callButton);
      }

      approvedGrid.appendChild(card);
    });
  }

  renderApprovedServices();

  // 4. SEARCH CATEGORIES AND APPROVED BUSINESSES
  function performSearch(searchTerm) {
    const query = String(searchTerm || "").trim().toLowerCase();
    let matchingCategories = 0;
    let matchingBusinesses = 0;

    document.querySelectorAll("#serviceGrid .service-card")
      .forEach(function (card) {
        const category = (
          card.dataset.service || card.textContent
        ).toLowerCase();

        const matches = !query || category.includes(query);
        card.hidden = !matches;

        if (matches) matchingCategories++;
      });

    document.querySelectorAll(
      "#approvedBusinessesGrid .business-card"
    ).forEach(function (card) {
      const matches = !query ||
        card.textContent.toLowerCase().includes(query);

      card.hidden = !matches;

      if (matches) matchingBusinesses++;
    });

    if (!searchResults) return;

    if (!query) {
      searchResults.textContent = "";
    } else if (matchingCategories + matchingBusinesses > 0) {
      searchResults.textContent =
        "Found " + matchingCategories +
        " matching service categories and " +
        matchingBusinesses + " matching business listings.";
    } else {
      searchResults.textContent =
        "No matches found. Try another service or area.";
    }
  }

  if (searchForm && serviceSearch) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      performSearch(serviceSearch.value);

      const servicesSection = document.getElementById("services");
      if (servicesSection) {
        servicesSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });

    serviceSearch.addEventListener("input", function () {
      if (!serviceSearch.value.trim()) performSearch("");
    });
  }

  if (serviceGrid) {
    serviceGrid.addEventListener("click", function (event) {
      const card = event.target.closest(".service-card");
      if (!card) return;

      const selectedService =
        card.dataset.service || card.textContent.trim();

      if (serviceSearch) serviceSearch.value = selectedService;
      performSearch(selectedService);

      if (searchResults) {
        searchResults.textContent =
          "Selected " + selectedService +
          ". Matching approved listings are shown when available.";
      }

      const approvedSection =
        document.getElementById("approved-businesses");

      if (approvedSection) {
        approvedSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  }

  // 5. LOCATION ERROR MESSAGES
  function explainLocationFailure(error) {
    if (!locationStatus) return;

    if (!navigator.geolocation) {
      locationStatus.textContent =
        "Your browser does not support location. Please use a supported browser and enable location access.";
      return;
    }

    if (error && error.code === 1) {
      locationStatus.textContent =
        "Location permission was denied. Turn on Location in your phone settings, then allow location access for this website and try again.";
    } else if (error && error.code === 2) {
      locationStatus.textContent =
        "Your location could not be detected. Turn on your phone's Location setting, check your connection, and try again.";
    } else if (error && error.code === 3) {
      locationStatus.textContent =
        "Location request timed out. Turn on Location, make sure you have a connection, and try again.";
    } else {
      locationStatus.textContent =
        "Location is required. Turn on Location in your phone settings and allow this website to access it.";
    }
  }

  // This checks location permission by requesting the current position.
  // Coordinates are not included in the registration form or sent to Web3Forms.
  function requestCurrentLocation() {
    return new Promise(function (resolve, reject) {
      if (!window.isSecureContext) {
        reject({
          code: 0,
          message: "A secure HTTPS connection is required for location."
        });
        return;
      }

      if (!navigator.geolocation) {
        reject({ code: 0 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        function (position) {
          resolve(position);
        },
        function (error) {
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }

  // 6. FIND SERVICES NEAR MY LOCATION BUTTON
  if (locationButton) {
    locationButton.addEventListener("click", function () {
      if (locationStatus) {
        locationStatus.textContent =
          "Requesting location. Please allow access when your browser asks.";
      }

      requestCurrentLocation()
        .then(function () {
          if (locationStatus) {
            locationStatus.textContent =
              "Location access is working. Nearby search is not yet connected to a location-based provider directory.";
          }
        })
        .catch(function (error) {
          explainLocationFailure(error);
        });
    });
  }

  // 7. REGISTRATION POPUP
  function showRegistrationModal() {
    if (!registrationModal) return;

    registrationModal.hidden = false;
    document.body.classList.add("modal-open");

    if (registrationMessage) {
      registrationMessage.textContent = "";
      registrationMessage.className = "form-message";
    }

    const businessName = document.getElementById("businessName");
    if (businessName) businessName.focus();
  }

  function hideRegistrationModal() {
    if (!registrationModal) return;

    registrationModal.hidden = true;
    document.body.classList.remove("modal-open");

    if (openRegistration) openRegistration.focus();
  }

  if (openRegistration) {
    openRegistration.addEventListener("click", showRegistrationModal);
  }

  if (closeRegistration) {
    closeRegistration.addEventListener("click", hideRegistrationModal);
  }

  if (registrationModal) {
    registrationModal.addEventListener("click", function (event) {
      if (event.target === registrationModal) {
        hideRegistrationModal();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      registrationModal &&
      !registrationModal.hidden
    ) {
      hideRegistrationModal();
    }
  });

  // 8. WEB3FORMS REGISTRATION
  // Location must be successfully obtained before the request is sent.
  // The coordinates themselves are never sent to Web3Forms.
  if (providerForm) {
    providerForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!providerForm.reportValidity()) return;

      const submitButton = providerForm.querySelector(
        'button[type="submit"]'
      );

      if (submitButton && submitButton.disabled) return;

      const accessKeyInput = providerForm.querySelector(
        'input[name="access_key"]'
      );

      if (
        !accessKeyInput ||
        !accessKeyInput.value.trim() ||
        accessKeyInput.value.includes("YOUR_ACCESS_KEY_HERE")
      ) {
        if (registrationMessage) {
          registrationMessage.textContent =
            "Registration is not configured. Please contact findme.feedback33@gmail.com.";
          registrationMessage.className = "form-message error";
        }
        return;
      }

      const originalButtonText = submitButton
        ? submitButton.textContent
        : "";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Checking location...";
      }

      if (registrationMessage) {
        registrationMessage.textContent =
          "Please allow location access so your registration can continue.";
        registrationMessage.className = "form-message";
      }

      try {
        // Require successful location access before sending the form.
        try {
          await requestCurrentLocation();
        } catch (locationError) {
          explainLocationFailure(locationError);

          if (registrationMessage) {
            registrationMessage.textContent =
              "Registration was not sent because location access is required. Turn on Location in your phone settings, allow access for this website, and try again.";
            registrationMessage.className = "form-message error";
          }

          return;
        }

        if (submitButton) {
          submitButton.textContent = "Sending registration...";
        }

        if (registrationMessage) {
          registrationMessage.textContent =
            "Location confirmed. Sending your registration request...";
          registrationMessage.className = "form-message";
        }

        const formData = new FormData(providerForm);

        const response = await fetch(
          "https://api.web3forms.com/submit",
          {
            method: "POST",
            body: formData
          }
        );

        let result;

        try {
          result = await response.json();
        } catch {
          throw new Error("The form service returned an unreadable response.");
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "The form service rejected the submission."
          );
        }

        if (registrationMessage) {
          registrationMessage.textContent =
            "Thank you! Your registration request was sent successfully. FIND-ME will review your details before any public listing is approved.";
          registrationMessage.className = "form-message success";
        }

        providerForm.reset();

      } catch (error) {
        console.error("FIND-ME registration error:", error);

        if (registrationMessage) {
          registrationMessage.textContent =
            "Sorry, your request could not be sent. Check your internet connection and try again. If the problem continues, contact findme.feedback33@gmail.com.";
          registrationMessage.className = "form-message error";
        }

      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    });
  }

  console.info(
    "FIND-ME loaded successfully. Approved public listings:",
    approvedBusinesses.length
  );
});
