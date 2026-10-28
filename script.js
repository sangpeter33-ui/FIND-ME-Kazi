
/* =========================================================
   FIND-ME — COMPLETE WEBSITE SCRIPT
   Registration popup, Web3Forms, GPS, search and categories
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // -------------------------------------------------------
  // 1. WEB3FORMS CONFIGURATION
  // -------------------------------------------------------

  const WEB3FORMS_ACCESS_KEY =
    "c03d37ca-27dc-4a67-b56d-107f5eb94232";

  const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

  // -------------------------------------------------------
  // 2. FIND HTML ELEMENTS
  // -------------------------------------------------------

  const openRegistration = document.getElementById("openRegistration");
  const registrationModal = document.getElementById("registrationModal");
  const closeRegistration = document.getElementById("closeRegistration");

  const providerForm = document.getElementById("providerForm");
  const registrationMessage = document.getElementById("registrationMessage");
  const submitRegistration = document.getElementById("submitRegistration");

  const getBusinessLocation = document.getElementById("getBusinessLocation");
  const locationStatus = document.getElementById("locationStatus");
  const gpsMapPreview = document.getElementById("gpsMapPreview");

  const gpsLatitude = document.getElementById("phoneGPSLatitude");
  const gpsLongitude = document.getElementById("phoneGPSLongitude");
  const gpsAccuracy = document.getElementById("phoneGPSAccuracy");
  const gpsMapLink = document.getElementById("phoneGPSMapLink");

  const locationConsent = document.getElementById("locationConsent");

  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const searchLocation = document.getElementById("searchLocation");
  const searchResults = document.getElementById("searchResults");

  const serviceGrid = document.getElementById("serviceGrid");
  const approvedBusinessesGrid =
    document.getElementById("approvedBusinessesGrid");

  // -------------------------------------------------------
  // 3. REGISTRATION POPUP
  // -------------------------------------------------------

  function showRegistration() {
    if (!registrationModal) {
      console.error("FIND-ME: registrationModal was not found.");
      return;
    }

    registrationModal.classList.add("is-open");
    registrationModal.setAttribute("aria-hidden", "false");

    document.body.classList.add("registration-open");

    const firstField = document.getElementById("businessName");

    if (firstField) {
      window.setTimeout(function () {
        firstField.focus();
      }, 100);
    }
  }

  function hideRegistration() {
    if (!registrationModal) return;

    registrationModal.classList.remove("is-open");
    registrationModal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("registration-open");
  }

  if (openRegistration) {
    openRegistration.addEventListener("click", showRegistration);
  } else {
    console.error(
      "FIND-ME: Cannot find the button with id='openRegistration'."
    );
  }

  if (closeRegistration) {
    closeRegistration.addEventListener("click", hideRegistration);
  }

  if (registrationModal) {
    registrationModal.addEventListener("click", function (event) {
      if (event.target === registrationModal) {
        hideRegistration();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && registrationModal) {
      hideRegistration();
    }
  });

  // -------------------------------------------------------
  // 4. REGISTRATION MESSAGE
  // -------------------------------------------------------

  function showRegistrationMessage(message, success) {
    if (!registrationMessage) return;

    registrationMessage.textContent = message;
    registrationMessage.setAttribute(
      "role",
      success ? "status" : "alert"
    );

    registrationMessage.style.color = success ? "#176b32" : "#b42318";
  }

  // -------------------------------------------------------
  // 5. CAPTURE THE PHONE'S GPS LOCATION
  // -------------------------------------------------------

  function clearGPSFields() {
    if (gpsLatitude) gpsLatitude.value = "";
    if (gpsLongitude) gpsLongitude.value = "";
    if (gpsAccuracy) gpsAccuracy.value = "";
    if (gpsMapLink) gpsMapLink.value = "";

    if (gpsMapPreview) {
      gpsMapPreview.removeAttribute("href");
      gpsMapPreview.hidden = true;
      gpsMapPreview.textContent = "";
    }
  }

  function capturePhoneLocation() {
    if (!navigator.geolocation) {
      if (locationStatus) {
        locationStatus.textContent =
          "GPS is not supported by this browser. Please use a supported browser.";
      }
      return;
    }

    clearGPSFields();

    if (locationStatus) {
      locationStatus.textContent =
        "Requesting your phone's location permission...";
    }

    if (getBusinessLocation) {
      getBusinessLocation.disabled = true;
      getBusinessLocation.textContent = "Getting location...";
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        const mapURL =
          "https://www.google.com/maps?q=" +
          encodeURIComponent(latitude + "," + longitude);

        if (gpsLatitude) {
          gpsLatitude.value = String(latitude);
        }

        if (gpsLongitude) {
          gpsLongitude.value = String(longitude);
        }

        if (gpsAccuracy) {
          gpsAccuracy.value = String(Math.round(accuracy));
        }

        if (gpsMapLink) {
          gpsMapLink.value = mapURL;
        }

        if (gpsMapPreview) {
          gpsMapPreview.href = mapURL;
          gpsMapPreview.textContent = "View captured location on Google Maps";
          gpsMapPreview.target = "_blank";
          gpsMapPreview.rel = "noopener noreferrer";
          gpsMapPreview.hidden = false;
        }

        if (locationStatus) {
          locationStatus.textContent =
            "Location captured successfully. Accuracy: approximately " +
            Math.round(accuracy) +
            " metres.";
        }

        if (getBusinessLocation) {
          getBusinessLocation.textContent = "Refresh Phone GPS Location";
        }
      },

      function (error) {
        let message = "Unable to capture your phone's location.";

        if (error.code === 1) {
          message =
            "Location permission was denied. Allow location access for this website in your browser settings, then try again.";
        } else if (error.code === 2) {
          message =
            "Your location is unavailable. Turn on Location on your phone and try again.";
        } else if (error.code === 3) {
          message =
            "The location request timed out. Turn on Location and try again.";
        }

        if (locationStatus) {
          locationStatus.textContent = message;
        }

        clearGPSFields();
      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );

    // Re-enable the button even if the GPS request fails.
    // The browser callback may take several seconds.
    window.setTimeout(function () {
      if (getBusinessLocation) {
        getBusinessLocation.disabled = false;

        if (
          !gpsLatitude ||
          !gpsLongitude ||
          !gpsLatitude.value ||
          !gpsLongitude.value
        ) {
          getBusinessLocation.textContent = "Capture Phone GPS Location";
        }
      }
    }, 21000);
  }

  if (getBusinessLocation) {
    getBusinessLocation.addEventListener("click", capturePhoneLocation);
  }

  // -------------------------------------------------------
  // 6. SUBMIT BUSINESS REGISTRATION TO WEB3FORMS
  // -------------------------------------------------------

  if (providerForm) {
    providerForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      showRegistrationMessage("", false);

      if (!providerForm.checkValidity()) {
        providerForm.reportValidity();
        return;
      }

      if (!locationConsent || !locationConsent.checked) {
        showRegistrationMessage(
          "Please read and accept the location and registration consent before submitting.",
          false
        );

        if (locationConsent) locationConsent.focus();
        return;
      }

      if (
        !gpsLatitude ||
        !gpsLongitude ||
        !gpsLatitude.value ||
        !gpsLongitude.value
      ) {
        showRegistrationMessage(
          "Please capture your phone GPS location before submitting your registration.",
          false
        );
        return;
      }

      if (
        !gpsMapLink ||
        !gpsMapLink.value ||
        !gpsAccuracy ||
        !gpsAccuracy.value
      ) {
        showRegistrationMessage(
          "Your GPS information is incomplete. Please capture your location again.",
          false
        );
        return;
      }

      if (
        !WEB3FORMS_ACCESS_KEY ||
        WEB3FORMS_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE"
      ) {
        showRegistrationMessage(
          "Registration email is not configured. Please contact the website administrator.",
          false
        );
        return;
      }

      const formData = new FormData(providerForm);

      // Ensure the required Web3Forms fields are included.
      formData.set("access_key", WEB3FORMS_ACCESS_KEY);
      formData.set("subject", "New FIND-ME Business Registration");
      formData.set("from_name", "FIND-ME Website");
      formData.set(
        "business_name",
        document.getElementById("businessName")?.value.trim() || ""
      );
      formData.set(
        "business_category",
        document.getElementById("businessCategory")?.value || ""
      );
      formData.set(
        "business_location",
        document.getElementById("businessLocation")?.value.trim() || ""
      );
      formData.set(
        "business_address",
        document.getElementById("businessAddress")?.value.trim() || ""
      );
      formData.set(
        "business_phone",
        document.getElementById("businessPhone")?.value.trim() || ""
      );
      formData.set("phone_gps_latitude", gpsLatitude.value);
      formData.set("phone_gps_longitude", gpsLongitude.value);
      formData.set("phone_gps_accuracy_metres", gpsAccuracy.value);
      formData.set("phone_gps_google_maps_link", gpsMapLink.value);
      formData.set(
        "location_consent",
        "The registrant accepted the location and registration consent."
      );

      if (submitRegistration) {
        submitRegistration.disabled = true;
        submitRegistration.textContent = "Submitting...";
      }

      try {
        const response = await fetch(WEB3FORMS_ENDPOINT, {
          method: "POST",
          body: formData
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "The registration service rejected the request."
          );
        }

        showRegistrationMessage(
          "Registration submitted successfully! FIND-ME has received your details for review. Your business will not appear in public listings until it is approved.",
          true
        );

        providerForm.reset();
        clearGPSFields();

        if (locationStatus) {
          locationStatus.textContent =
            "Capture your phone GPS location for your next registration.";
        }

        // Keep the popup open so the confirmation can be read.
      } catch (error) {
        console.error("FIND-ME registration error:", error);

        showRegistrationMessage(
          "Registration could not be sent. Check your internet connection and Web3Forms configuration, then try again.",
          false
        );
      } finally {
        if (submitRegistration) {
          submitRegistration.disabled = false;
          submitRegistration.textContent = "Submit Registration";
        }

        if (getBusinessLocation) {
          getBusinessLocation.disabled = false;
        }
      }
    });
  } else {
    console.error(
      "FIND-ME: Cannot find the registration form with id='providerForm'."
    );
  }

  // -------------------------------------------------------
  // 7. APPROVED PUBLIC BUSINESS LISTINGS
  // -------------------------------------------------------
  // Only add businesses here after you have approved them
  // and have permission to publish their contact details.
  //
  // Example:
  // {
  //   name: "Example Business",
  //   category: "Plumbers",
  //   location: "Nairobi",
  //   address: "Public business address",
  //   phone: "Business phone number",
  //   description: "Approved public business listing"
  // }

  const approvedBusinesses = Array.isArray(
    window.FIND_ME_APPROVED_BUSINESSES
  )
    ? window.FIND_ME_APPROVED_BUSINESSES
    : [];

  // -------------------------------------------------------
  // 8. DISPLAY APPROVED BUSINESS CARDS SAFELY
  // -------------------------------------------------------

  function createBusinessCard(business) {
    const card = document.createElement("article");
    card.className = "business-card";

    const heading = document.createElement("h3");
    heading.textContent = business.name || "Business";

    const category = document.createElement("p");
    category.textContent = "Service: " + (business.category || "Not specified");

    const location = document.createElement("p");
    location.textContent = "Area: " + (business.location || "Not specified");

    card.appendChild(heading);
    card.appendChild(category);
    card.appendChild(location);

    if (business.description) {
      const description = document.createElement("p");
      description.textContent = business.description;
      card.appendChild(description);
    }

    if (business.address) {
      const address = document.createElement("p");
      address.textContent = "Address: " + business.address;
      card.appendChild(address);
    }

    if (business.phone) {
      const phone = document.createElement("p");
      phone.textContent = "Phone: " + business.phone;
      card.appendChild(phone);

      const callLink = document.createElement("a");
      callLink.textContent = "Call Business";
      callLink.href = "tel:" + String(business.phone).replace(/[^\d+]/g, "");
      callLink.className = "business-call-link";
      card.appendChild(callLink);
    }

    if (business.mapLink) {
      try {
        const parsedURL = new URL(business.mapLink);

        if (
          parsedURL.protocol === "https:" &&
          (
            parsedURL.hostname === "maps.google.com" ||
            parsedURL.hostname === "www.google.com" ||
            parsedURL.hostname === "maps.app.goo.gl"
          )
        ) {
          const mapLink = document.createElement("a");
          mapLink.href = parsedURL.href;
          mapLink.target = "_blank";
          mapLink.rel = "noopener noreferrer";
          mapLink.textContent = "View on Map";
          card.appendChild(mapLink);
        }
      } catch (error) {
        // Ignore invalid map links.
      }
    }

    return card;
  }

  function renderBusinesses(container, businesses, emptyMessage) {
    if (!container) return;

    container.replaceChildren();

    if (businesses.length === 0) {
      const message = document.createElement("p");
      message.className = "empty-listings-message";
      message.textContent = emptyMessage;
      container.appendChild(message);
      return;
    }

    businesses.forEach(function (business) {
      container.appendChild(createBusinessCard(business));
    });
  }

  renderBusinesses(
    approvedBusinessesGrid,
    approvedBusinesses,
    "No approved businesses are listed yet. Please check again later."
  );

  // -------------------------------------------------------
  // 9. SEARCH APPROVED BUSINESSES
  // -------------------------------------------------------

  function runSearch(event) {
    if (event) event.preventDefault();

    if (!searchResults) return;

    const query = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const area = searchLocation
      ? searchLocation.value.trim().toLowerCase()
      : "";

    const matches = approvedBusinesses.filter(function (business) {
      const searchableText = [
        business.name,
        business.category,
        business.location,
        business.address,
        business.description
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || searchableText.includes(query);

      const businessArea = [
        business.location,
        business.address
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesArea = !area || businessArea.includes(area);

      return matchesQuery && matchesArea;
    });

    renderBusinesses(
      searchResults,
      matches,
      "No approved businesses match your search yet. Try another service or area."
    );
  }

  if (searchForm) {
    searchForm.addEventListener("submit", runSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("input", runSearch);
  }

  if (searchLocation) {
    searchLocation.addEventListener("input", runSearch);
  }

  // -------------------------------------------------------
  // 10. SERVICE CATEGORY BUTTONS
  // -------------------------------------------------------

  if (serviceGrid) {
    serviceGrid.addEventListener("click", function (event) {
      const categoryButton = event.target.closest("[data-category]");

      if (!categoryButton || !serviceGrid.contains(categoryButton)) {
        return;
      }

      const category = categoryButton.getAttribute("data-category");

      if (searchInput) {
        searchInput.value = category;
      }

      runSearch();

      if (searchResults) {
        searchResults.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  }

  console.log("FIND-ME script loaded successfully.");
});
