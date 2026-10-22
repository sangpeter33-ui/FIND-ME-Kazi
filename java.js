
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const categoryGrid = document.getElementById("categoryGrid");
  const providerResults = document.getElementById("providerResults");
  const resultsTitle = document.getElementById("resultsTitle");
  const resultsDescription = document.getElementById("resultsDescription");
  const resultsCount = document.getElementById("resultsCount");
  const locationButton = document.getElementById("locationButton");
  const locationStatus = document.getElementById("locationStatus");
  const currentYear = document.getElementById("currentYear");

  currentYear.textContent = new Date().getFullYear();

  // DEMO DATA: Replace these examples with verified providers later.
  // These are not real business listings or contact details.
  const providers = [
    {
      name: "Sample Plumbing Service",
      category: "Plumbers",
      location: "Nairobi",
      icon: "♧"
    },
    {
      name: "Sample Electrical Service",
      category: "Electricians",
      location: "Nairobi",
      icon: "ϟ"
    },
    {
      name: "Sample Motor Mechanic",
      category: "Mechanics",
      location: "Nairobi",
      icon: "⚙"
    },
    {
      name: "Sample Appliance Repair",
      category: "Appliance Repair",
      location: "Nairobi",
      icon: "▣"
    },
    {
      name: "Sample Home Cleaning",
      category: "Cleaning Services",
      location: "Nairobi",
      icon: "✧"
    },
    {
      name: "Sample Phone Repair",
      category: "Phone Repair",
      location: "Nairobi",
      icon: "▯"
    },
    {
      name: "Sample Bodaboda Service",
      category: "Bodaboda",
      location: "Nairobi",
      icon: "➜"
    },
    {
      name: "Sample Taxi Service",
      category: "Taxi Services",
      location: "Nairobi",
      icon: "▰"
    },
    {
      name: "Sample Welding Service",
      category: "Welders",
      location: "Nairobi",
      icon: "⚒"
    },
    {
      name: "Sample Laundry Service",
      category: "Mama Fua",
      location: "Nairobi",
      icon: "♧"
    },
    {
      name: "Sample Home Tutor",
      category: "Tutors",
      location: "Nairobi",
      icon: "▤"
    },
    {
      name: "Sample Delivery Service",
      category: "Delivery Service",
      location: "Nairobi",
      icon: "➜"
    }
  ];

  let selectedCategory = "all";
  let userCoordinates = null;

  function renderProviders() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = providers.filter(function (provider) {
      const matchesCategory =
        selectedCategory === "all" ||
        provider.category === selectedCategory;

      const searchableText = (
        provider.name + " " +
        provider.category + " " +
        provider.location
      ).toLowerCase();

      return matchesCategory && searchableText.includes(query);
    });

    providerResults.replaceChildren();
    resultsCount.textContent =
      filtered.length + (filtered.length === 1 ? " result" : " results");

    if (query) {
      resultsTitle.textContent = "Search results";
      resultsDescription.textContent =
        'Showing demo listings matching "' + searchInput.value.trim() + '".';
    } else if (selectedCategory !== "all") {
      resultsTitle.textContent = selectedCategory;
      resultsDescription.textContent =
        "Explore sample listings in this category.";
    } else {
      resultsTitle.textContent = "Explore service examples";
      resultsDescription.textContent =
        "These sample listings help you test the website.";
    }

    if (filtered.length === 0) {
      const message = document.createElement("p");
      message.className = "empty-state";
      message.textContent =
        "No matching demo listings found. Try another service or category.";
      providerResults.appendChild(message);
      return;
    }

    filtered.forEach(function (provider) {
      const card = document.createElement("article");
      card.className = "provider-card";

      const top = document.createElement("div");
      top.className = "provider-card-top";

      const symbol = document.createElement("div");
      symbol.className = "provider-symbol";
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = provider.icon;

      const titleArea = document.createElement("div");

      const name = document.createElement("h3");
      name.textContent = provider.name;

      const category = document.createElement("p");
      category.className = "provider-category";
      category.textContent = provider.category;

      titleArea.appendChild(name);
      titleArea.appendChild(category);
      top.appendChild(symbol);
      top.appendChild(titleArea);

      const location = document.createElement("p");
      location.className = "provider-location";
      location.textContent = "⌖ " + provider.location;

      const badge = document.createElement("span");
      badge.className = "demo-badge";
      badge.textContent = "Demo listing";

      card.appendChild(top);
      card.appendChild(location);
      card.appendChild(badge);

      providerResults.appendChild(card);
    });
  }

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    renderProviders();
    document.getElementById("listings").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  searchInput.addEventListener("input", renderProviders);

  categoryGrid.addEventListener("click", function (event) {
    const button = event.target.closest("[data-category]");

    if (!button) return;

    selectedCategory = button.dataset.category;

    categoryGrid.querySelectorAll("[data-category]").forEach(function (item) {
      const isSelected = item === button;
      item.classList.toggle("active", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });

    renderProviders();

    document.getElementById("listings").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  locationButton.addEventListener("click", function () {
    // Once location is available, a second tap opens a map nearby.
    if (userCoordinates) {
      const url =
        "https://www.google.com/maps/search/services/@" +
        userCoordinates.latitude + "," +
        userCoordinates.longitude + ",14z";

      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    if (!("geolocation" in navigator)) {
      locationStatus.textContent =
        "Location is not supported by this browser. You can still search services.";
      return;
    }

    locationButton.disabled = true;
    locationStatus.textContent = "Waiting for location permission...";

    navigator.geolocation.getCurrentPosition(
      function (position) {
        userCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        locationStatus.textContent =
          "Location received. Tap below to open a map near you.";

        locationButton.textContent = "Open Nearby Map";
        locationButton.disabled = false;
      },
      function (error) {
        locationButton.disabled = false;

        if (error.code === error.PERMISSION_DENIED) {
          locationStatus.textContent =
            "Location permission was denied. Allow it in your browser settings to try again.";
        } else if (error.code === error.TIMEOUT) {
          locationStatus.textContent =
            "Location took too long. Try again in an area with a better signal.";
        } else {
          locationStatus.textContent =
            "Unable to get your location. Check your phone settings and try again.";
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  });

  renderProviders();
});
