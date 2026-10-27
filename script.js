
/* =====================================================
   FIND-ME WEBSITE — COMPLETE SCRIPT
   Search, service categories, location, registration,
   and approved public business listings.
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {

  // ---------------------------------------------------
  // 1. APPROVED PUBLIC BUSINESS LISTINGS
  // Only add information approved for public display.
  // ---------------------------------------------------

  const approvedBusinesses = [
    {
      name: "Pyrex delivery",
      category: "Taxi Services",
      area: "Nairobi",
      phone: "0182000479"
    }

    // Add more approved businesses below.
    // Separate each business object with a comma.
  ];

  // ---------------------------------------------------
  // 2. FIND WEBSITE ELEMENTS
  // ---------------------------------------------------

  const searchForm = document.getElementById("searchForm");
  const serviceSearch = document.getElementById("serviceSearch");
  const searchResults = document.getElementById("searchResults");
  const serviceGrid = document.getElementById("serviceGrid");

  const locationButton = document.getElementById("locationButton");
  const locationStatus = document.getElementById("locationStatus");

  const registrationModal =
    document.getElementById("registrationModal");
  const openRegistration =
    document.getElementById("openRegistration");
  const closeRegistration =
    document.getElementById("closeRegistration");

  const providerForm = document.getElementById("providerForm");
  const registrationMessage =
    document.getElementById("registrationMessage");

  // ---------------------------------------------------
  // 3. CURRENT YEAR
  // ---------------------------------------------------

  const currentYear = document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // ---------------------------------------------------
  // 4. CREATE APPROVED BUSINESS LISTING SECTION
  // ---------------------------------------------------

  let approvedGrid = document.getElementById(
    "approvedBusinessesGrid"
  );

  if (!approvedGrid) {
    const approvedSection = document.createElement("section");
    approvedSection.className = "approved-businesses-section";
    approvedSection.id = "approved-businesses";

    const heading = document.createElement("div");
    heading.className = "section-heading";

    const eyebrow = document.createElement("span");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "APPROVED LISTINGS";

    const title = document.createElement("h2");
    title.textContent = "Find a Service Provider";

    const description = document.createElement("p");
    description.textContent =
      "Explore publicly approved local business listings.";

    heading.append(eyebrow, title, description);

    approvedGrid = document.createElement("div");
    approvedGrid.id = "approvedBusinessesGrid";
    approvedGrid.className = "approved-businesses-grid";

    approvedSection.append(heading, approvedGrid);

    const servicesSection = document.getElementById("services");

    if (servicesSection) {
      servicesSection.insertAdjacentElement(
        "afterend",
        approvedSection
      );
    } else {
      document.querySelector("main")?.appendChild(approvedSection);
    }
  }

  // ---------------------------------------------------
  // 5. DISPLAY APPROVED BUSINESS CARDS
  // ---------------------------------------------------

  function renderApprovedServices() {
    if (!approvedGrid) return;

    approvedGrid.replaceChildren();

    if (approvedBusinesses.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent =
        "No approved business listings are available yet.";
      approvedGrid.appendChild(emptyMessage);
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

        const safePhone = String(business.phone).replace(
          /[^\d+]/g,
          ""
        );

        callButton.href = "tel:" + safePhone;
        callButton.textContent =
          "📞 Call Now: " + business.phone;

        card.appendChild(callButton);
      }

      approvedGrid.appendChild(card);
    });
  }

  renderApprovedServices();

  // ---------------------------------------------------
  // 6. SEARCH SERVICE CATEGORIES AND BUSINESS LISTINGS
  // ---------------------------------------------------

  function performSearch(searchTerm) {
    const query = searchTerm.trim().toLowerCase();
    let matchingCategories = 0;
    let matchingBusinesses = 0;

    const categoryCards = document.querySelectorAll(
      "#serviceGrid .service-card"
    );

    categoryCards.forEach(function (card) {
      const category = (
        card.dataset.service || card.textContent
      ).toLowerCase();

      const matches = !query || category.includes(query);

      card.hidden = !matches;

      if (matches) matchingCategories++;
    });

    const businessCards = document.querySelectorAll(
      "#approvedBusinessesGrid .business-card"
    );

    businessCards.forEach(function (card) {
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
        "Found " + matchingCategories + " matching service categories and " +
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
      if (serviceSearch.value.trim() === "") {
        performSearch("");
      }
    });
  }

  // ---------------------------------------------------
  // 7. SERVICE CATEGORY BUTTONS
  // ---------------------------------------------------

  if (serviceGrid) {
    serviceGrid.addEventListener("click", function (event) {
      const card = event.target.closest(".service-card");

      if (!card) return;

      const selectedService =
        card.dataset.service || card.textContent.trim();

      if (serviceSearch) {
        serviceSearch.value = selectedService;
      }

      performSearch(selectedService);

      if (searchResults) {
        searchResults.textContent =
          "Selected " + selectedService +
          ". Matching approved listings are shown below when available.";
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

  // ---------------------------------------------------
  // 8. LOCATION BUTTON
  // ---------------------------------------------------

  if (locationButton) {
    locationButton.addEventListener("click", function () {
      if (!navigator.geolocation) {
        if (locationStatus) {
          locationStatus.textContent =
            "Your browser does not support location. Please search by service or town.";
        }
        return;
      }

      if (locationStatus) {
        locationStatus.textContent =
          "Requesting your location. Please respond to the browser permission prompt.";
      }

      navigator.geolocation.getCurrentPosition(
        function (position) {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          if (locationStatus) {
            locationStatus.textContent =
              "Location received. Your coordinates are available, but nearby search requires a connected location-based provider directory.";
          }

          // Coordinates are not sent or saved by this script.
          // A backend is required for real nearby-provider searches.
          console.info(
            "FIND-ME location received:",
            latitude,
            longitude
          );
        },

        function () {
          if (locationStatus) {
            locationStatus.textContent =
              "Location access was not granted. Enable location permission or search by town.";
          }
        },

        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // ---------------------------------------------------
  // 9. REGISTRATION POPUP
  // ---------------------------------------------------

  function showRegistrationModal() {
    if (!registrationModal) return;

    registrationModal.hidden = false;
    document.body.classList.add("modal-open");

    if (registrationMessage) {
      registrationMessage.textContent = "";
      registrationMessage.className = "form-message";
    }

    const businessName =
      document.getElementById("businessName");

    if (businessName) businessName.focus();
  }

  function hideRegistrationModal() {
    if (!registrationModal) return;

    registrationModal.hidden = true;
    document.body.classList.remove("modal-open");

    if (openRegistration) {
      openRegistration.focus();
    }
  }

  if (openRegistration) {
    openRegistration.addEventListener(
      "click",
      showRegistrationModal
    );
  }

  if (closeRegistration) {
    closeRegistration.addEventListener(
      "click",
      hideRegistrationModal
    );
  }

  if (registrationModal) {
    registrationModal.addEventListener(
      "click",
      function (event) {
        if (event.target === registrationModal) {
          hideRegistrationModal();
        }
      }
    );
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

  // ---------------------------------------------------
  // 10. REGISTRATION FORM VALIDATION AND MESSAGE
  // ---------------------------------------------------

  if (providerForm) {
    providerForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!providerForm.reportValidity()) return;

      if (registrationMessage) {
        registrationMessage.textContent =
          "Your details have been checked in this browser, but they have NOT been sent or saved online. A secure backend or connected form service is required to receive your registration.";

        registrationMessage.className =
          "form-message warning";
      }
    });
  }

  // ---------------------------------------------------
  // 11. STARTUP MESSAGE
  // ---------------------------------------------------

  console.info(
    "FIND-ME loaded successfully. Approved public listings:",
    approvedBusinesses.length
  );

});
