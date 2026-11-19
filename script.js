
/* =========================================
   FIND-ME KAZI
   Main JavaScript
   Firebase v10.12.2
========================================= */

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { auth, db, storage } from "./firebase.js";


/* =========================================
   GLOBAL VARIABLES
========================================= */

let currentUser = null;
let approvedBusinesses = [];
let activeCategory = "all";
let selectedPlan = "free";
let selectedPrice = 0;
let selectedDuration = "30 days";

let currentLatitude = null;
let currentLongitude = null;
let currentAccuracy = null;

let existingBusiness = null;

const googleProvider = new GoogleAuthProvider();


/* =========================================
   HELPER FUNCTIONS
========================================= */

function getElement(id) {
  return document.getElementById(id);
}

function showMessage(id, message, type = "info") {
  const element = getElement(id);

  if (!element) return;

  element.textContent = message;
  element.className = "form-message " + type + "-message";
  element.hidden = false;
}

function clearMessage(id) {
  const element = getElement(id);

  if (!element) return;

  element.textContent = "";
  element.className = "form-message";
  element.hidden = true;
}

function setButtonLoading(button, loading, loadingText = "Please wait...") {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function safeText(value) {
  return value === undefined || value === null ? "" : String(value);
}

function normalize(value) {
  return safeText(value).trim().toLowerCase();
}

function formatError(error) {
  const messages = {
    "auth/email-already-in-use": "This email is already registered. Please log in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Your password is too weak. Use at least 6 characters.",
    "auth/user-not-found": "No account was found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/popup-closed-by-user": "The sign-in window was closed.",
    "auth/popup-blocked": "Your browser blocked the sign-in window. Allow popups and try again.",
    "auth/network-request-failed": "Network problem. Check your internet connection.",
    "permission-denied": "Permission denied. Check your Firebase security rules.",
    "storage/unauthorized": "You do not have permission to upload this image."
  };

  return messages[error.code] ||
    error.message ||
    "Something went wrong. Please try again.";
}


/* =========================================
   POPUP NAVIGATION
========================================= */

function closeAllPopups() {
  document.querySelectorAll(".popup-modal").forEach(popup => {
    popup.hidden = true;
  });

  document.body.classList.remove("popup-open");
}

function openPopup(id) {
  closeAllPopups();

  const popup = getElement(id);

  if (!popup) return;

  popup.hidden = false;
  document.body.classList.add("popup-open");

  const panel = popup.querySelector(".popup-container");

  if (panel) panel.scrollTop = 0;
}

function goHome() {
  closeAllPopups();

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
  });

  const homeLink = document.querySelector('[data-home].nav-link');

  if (homeLink) homeLink.classList.add("active");

  closeMobileMenu();
}

document.addEventListener("click", event => {

  const popupButton = event.target.closest("[data-popup]");

  if (popupButton) {
    const popupId = popupButton.dataset.popup;

    if (popupButton.id === "openRegisterBtn") {
      showRegisterMode();
    } else if (popupButton.id === "openLoginBtn") {
      showLoginMode();
    }

    openPopup(popupId);
    closeMobileMenu();
    return;
  }

  const closeButton = event.target.closest("[data-close]");

  if (closeButton) {
    const popup = getElement(closeButton.dataset.close);

    if (popup) {
      popup.hidden = true;
      document.body.classList.remove("popup-open");
    }

    return;
  }

  const homeButton = event.target.closest("[data-home]");

  if (homeButton) {
    event.preventDefault();
    goHome();
    return;
  }

  const serviceButton = event.target.closest("[data-service-category]");

  if (serviceButton) {
    const category = serviceButton.dataset.serviceCategory;

    closeAllPopups();
    selectCategory(category);

    const directory = document.querySelector(".directory-section");

    if (directory) {
      directory.scrollIntoView({ behavior: "smooth" });
    }
  }

});

document.querySelectorAll(".popup-modal").forEach(popup => {

  popup.addEventListener("click", event => {
    if (event.target === popup) {
      popup.hidden = true;
      document.body.classList.remove("popup-open");
    }
  });

});

document.addEventListener("keydown", event => {

  if (event.key === "Escape") {
    closeAllPopups();
    closeMobileMenu();
  }

});


/* =========================================
   MOBILE MENU
========================================= */

const menuToggle = getElement("menuToggle");
const mainNav = getElement("mainNav");

function closeMobileMenu() {
  if (!menuToggle || !mainNav) return;

  mainNav.classList.remove("active");
  menuToggle.setAttribute("aria-expanded", "false");
}

if (menuToggle && mainNav) {

  menuToggle.addEventListener("click", () => {

    const isOpen = mainNav.classList.toggle("active");

    menuToggle.setAttribute("aria-expanded", String(isOpen));

  });

}


/* =========================================
   LOGIN AND REGISTER TABS
========================================= */

function showLoginMode() {

  const loginForm = getElement("loginForm");
  const registerForm = getElement("registerForm");

  if (loginForm) loginForm.hidden = false;
  if (registerForm) registerForm.hidden = true;

  getElement("loginTab")?.classList.add("active");
  getElement("registerTab")?.classList.remove("active");

  if (getElement("accountTitle")) {
    getElement("accountTitle").textContent = "Welcome Back";
  }

  if (getElement("accountSubtitle")) {
    getElement("accountSubtitle").textContent =
      "Log in to manage your business account.";
  }

  clearMessage("loginMessage");
  clearMessage("registerMessage");
  clearMessage("resetMessage");
}

function showRegisterMode() {

  const loginForm = getElement("loginForm");
  const registerForm = getElement("registerForm");

  if (loginForm) loginForm.hidden = true;
  if (registerForm) registerForm.hidden = false;

  getElement("loginTab")?.classList.remove("active");
  getElement("registerTab")?.classList.add("active");

  if (getElement("accountTitle")) {
    getElement("accountTitle").textContent = "Create Your Account";
  }

  if (getElement("accountSubtitle")) {
    getElement("accountSubtitle").textContent =
      "Join FIND-ME KAZI and register your business.";
  }

  clearMessage("loginMessage");
  clearMessage("registerMessage");
  clearMessage("resetMessage");
}

getElement("loginTab")?.addEventListener("click", showLoginMode);
getElement("registerTab")?.addEventListener("click", showRegisterMode);
getElement("showRegisterBtn")?.addEventListener("click", showRegisterMode);
getElement("showLoginBtn")?.addEventListener("click", showLoginMode);


/* =========================================
   LOGIN
========================================= */

getElement("loginForm")?.addEventListener("submit", async event => {

  event.preventDefault();

  const email = getElement("loginEmail").value.trim();
  const password = getElement("loginPassword").value;

  const button = getElement("loginBtn");

  clearMessage("loginMessage");
  clearMessage("resetMessage");

  setButtonLoading(button, true, "Logging in...");

  try {

    await signInWithEmailAndPassword(auth, email, password);

    showMessage("loginMessage", "Login successful!", "success");

    getElement("loginForm").reset();

    setTimeout(() => {
      closeAllPopups();
      openPopup("dashboardPopup");
    }, 500);

  } catch (error) {

    showMessage("loginMessage", formatError(error), "error");

  } finally {

    setButtonLoading(button, false);

  }

});


/* =========================================
   FORGOT PASSWORD
========================================= */

getElement("forgotPasswordBtn")?.addEventListener("click", async () => {

  const email = getElement("loginEmail").value.trim();

  clearMessage("resetMessage");

  if (!email) {
    showMessage(
      "resetMessage",
      "Enter your email address above first.",
      "error"
    );
    getElement("loginEmail")?.focus();
    return;
  }

  try {

    await sendPasswordResetEmail(auth, email);

    showMessage(
      "resetMessage",
      "Password reset instructions have been sent if this email is registered. Check your inbox and spam folder.",
      "success"
    );

  } catch (error) {

    showMessage("resetMessage", formatError(error), "error");

  }

});


/* =========================================
   CREATE ACCOUNT
========================================= */

getElement("registerForm")?.addEventListener("submit", async event => {

  event.preventDefault();

  const name = getElement("registerName").value.trim();
  const email = getElement("registerEmail").value.trim();
  const password = getElement("registerPassword").value;
  const confirmPassword = getElement("confirmPassword").value;

  const button = getElement("registerBtn");

  clearMessage("registerMessage");

  if (password.length < 6) {
    showMessage(
      "registerMessage",
      "Password must contain at least 6 characters.",
      "error"
    );
    return;
  }

  if (password !== confirmPassword) {
    showMessage(
      "registerMessage",
      "Your passwords do not match.",
      "error"
    );
    return;
  }

  setButtonLoading(button, true, "Creating account...");

  try {

    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateProfile(result.user, {
      displayName: name
    });

    await setDoc(
      doc(db, "users", result.user.uid),
      {
        name,
        email,
        createdAt: serverTimestamp()
      },
      { merge: true }
    );

    showMessage(
      "registerMessage",
      "Your account has been created successfully!",
      "success"
    );

    getElement("registerForm").reset();

    setTimeout(() => {
      closeAllPopups();
      openPopup("registerPopup");
      updateRegistrationNotice();
    }, 700);

  } catch (error) {

    showMessage("registerMessage", formatError(error), "error");

  } finally {

    setButtonLoading(button, false);

  }

});


/* =========================================
   GOOGLE SIGN-IN
========================================= */

async function googleSignIn() {

  try {

    const result = await signInWithPopup(auth, googleProvider);

    const user = result.user;

    await setDoc(
      doc(db, "users", user.uid),
      {
        name: user.displayName || "",
        email: user.email || "",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    closeAllPopups();
    openPopup("dashboardPopup");

  } catch (error) {

    const message = formatError(error);

    if (getElement("loginForm") && !getElement("loginForm").hidden) {
      showMessage("loginMessage", message, "error");
    } else {
      showMessage("registerMessage", message, "error");
    }

  }

}

getElement("googleLoginBtn")?.addEventListener("click", googleSignIn);
getElement("googleRegisterBtn")?.addEventListener("click", googleSignIn);


/* =========================================
   AUTHENTICATION STATE
========================================= */

onAuthStateChanged(auth, async user => {

  currentUser = user;

  updateRegistrationNotice();

  if (user) {

    if (getElement("dashboardUserName")) {
      getElement("dashboardUserName").textContent =
        user.displayName || "Welcome";
    }

    if (getElement("dashboardUserEmail")) {
      getElement("dashboardUserEmail").textContent = user.email || "";
    }

    if (getElement("accountInfoText")) {
      getElement("accountInfoText").textContent =
        "Signed in as " + (user.email || "");
    }

    await loadMyBusinessProfile();

  } else {

    existingBusiness = null;

    if (getElement("businessStatusText")) {
      getElement("businessStatusText").textContent =
        "Log in to manage your business listing.";
    }

  }

});


/* =========================================
   REGISTRATION NOTICE
========================================= */

function updateRegistrationNotice() {

  const notice = getElement("registrationAuthNotice");
  const form = getElement("businessProfileForm");

  if (!notice || !form) return;

  if (currentUser) {
    notice.hidden = true;
    form.hidden = false;
  } else {
    notice.hidden = false;
    form.hidden = true;
  }

}

getElement("registrationLoginBtn")?.addEventListener("click", () => {
  showLoginMode();
  openPopup("accountPopup");
});


/* =========================================
   LOGOUT
========================================= */

getElement("logoutBtn")?.addEventListener("click", async () => {

  try {

    await signOut(auth);

    closeAllPopups();
    goHome();

  } catch (error) {

    showMessage("dashboardMessage", formatError(error), "error");

  }

});


/* =========================================
   PRICING PLAN SELECTION
========================================= */

function updateSelectedPlan(plan, price, duration) {

  selectedPlan = plan;
  selectedPrice = Number(price);
  selectedDuration = duration;

  const names = {
    free: "Free Trial",
    growth: "Growth Plan",
    verified_pro: "Verified Pro"
  };

  if (getElement("selectedPlan")) {
    getElement("selectedPlan").value = selectedPlan;
  }

  if (getElement("selectedPlanDisplay")) {
    getElement("selectedPlanDisplay").value =
      names[selectedPlan] || "Free Trial";
  }

}

document.querySelectorAll(".select-plan-btn").forEach(button => {

  button.addEventListener("click", () => {

    updateSelectedPlan(
      button.dataset.plan,
      button.dataset.price,
      button.dataset.duration
    );

    if (currentUser) {

      closeAllPopups();
      openPopup("registerPopup");
      updateRegistrationNotice();

    } else {

      showRegisterMode();
      openPopup("accountPopup");

    }

  });

});


/* =========================================
   BUSINESS IMAGE PREVIEWS
========================================= */

function previewImages(inputId, previewId, multiple = false) {

  const input = getElement(inputId);
  const preview = getElement(previewId);

  if (!input || !preview) return;

  input.addEventListener("change", () => {

    preview.replaceChildren();

    const files = Array.from(input.files || []);

    files.forEach(file => {

      if (!file.type.startsWith("image/")) return;

      const image = document.createElement("img");

      image.alt = "Selected business image";
      image.src = URL.createObjectURL(file);

      preview.appendChild(image);

    });

  });

}

previewImages("businessLogo", "logoPreview");
previewImages("businessPhotos", "photosPreview", true);


/* =========================================
   GPS LOCATION CAPTURE
========================================= */

function updateLocationFields(latitude, longitude, accuracy) {

  currentLatitude = latitude;
  currentLongitude = longitude;
  currentAccuracy = accuracy;

  if (getElement("businessLatitude")) {
    getElement("businessLatitude").value = latitude;
  }

  if (getElement("businessLongitude")) {
    getElement("businessLongitude").value = longitude;
  }

  if (getElement("businessAccuracy")) {
    getElement("businessAccuracy").value = accuracy;
  }

}

getElement("captureBusinessLocation")?.addEventListener("click", () => {

  const consent = getElement("businessConsent");

  if (!consent?.checked) {

    showMessage(
      "businessFormMessage",
      "Please tick the location consent box before capturing GPS location.",
      "error"
    );

    return;

  }

  if (!navigator.geolocation) {

    showMessage(
      "businessFormMessage",
      "Your browser does not support GPS location.",
      "error"
    );

    return;

  }

  const status = getElement("businessLocationStatus");

  if (status) status.textContent = "Getting your current location...";

  navigator.geolocation.getCurrentPosition(

    position => {

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      updateLocationFields(latitude, longitude, accuracy);

      if (status) {
        status.textContent =
          "Location captured successfully. Accuracy: " +
          Math.round(accuracy) + " metres.";
      }

      showMessage(
        "businessFormMessage",
        "Your GPS location has been captured.",
        "success"
      );

    },

    error => {

      const messages = {
        1: "Location permission was denied. You can still enter your address manually.",
        2: "Your location could not be determined. Please try again.",
        3: "Location request timed out. Please try again."
      };

      if (status) {
        status.textContent = messages[error.code] ||
          "Unable to get your location.";
      }

    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }

  );

});


/* =========================================
   UPLOAD BUSINESS IMAGES
========================================= */

async function uploadBusinessImage(file, path) {

  if (!file) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("Each image must be 5 MB or smaller.");
  }

  const imageRef = ref(storage, path);

  await uploadBytes(imageRef, file);

  return await getDownloadURL(imageRef);

}

async function uploadBusinessImages(userId) {

  let logoUrl = existingBusiness?.logoUrl || "";
  let photoUrls = Array.isArray(existingBusiness?.photoUrls)
    ? [...existingBusiness.photoUrls]
    : [];

  const logoFile = getElement("businessLogo")?.files?.[0];

  if (logoFile) {

    logoUrl = await uploadBusinessImage(
      logoFile,
      `businesses/${userId}/logo_${Date.now()}`
    );

  }

  const photoFiles = Array.from(
    getElement("businessPhotos")?.files || []
  );

  for (const file of photoFiles) {

    const url = await uploadBusinessImage(
      file,
      `businesses/${userId}/photos_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );

    if (url) photoUrls.push(url);

  }

  return { logoUrl, photoUrls };

}


/* =========================================
   SAVE BUSINESS PROFILE
========================================= */

getElement("businessProfileForm")?.addEventListener("submit", async event => {

  event.preventDefault();

  if (!currentUser) {

    showMessage(
      "businessFormMessage",
      "Please log in before registering your business.",
      "error"
    );

    return;

  }

  const consent = getElement("businessConsent")?.checked || false;

  // GPS information is retained only when consent is selected.
  if (!consent) {
    updateLocationFields("", "", "");
  }

  const businessName = getElement("businessName").value.trim();
  const category = getElement("businessCategory").value;
  const owner = getElement("businessOwner").value.trim();
  const phone = getElement("businessPhone").value.trim();
  const whatsapp = getElement("businessWhatsapp").value.trim();
  const county = getElement("businessCounty").value.trim();
  const town = getElement("businessTown").value.trim();
  const address = getElement("businessAddress").value.trim();
  const description = getElement("businessDescription").value.trim();

  if (!businessName || !category || !owner || !phone ||
      !county || !town || !description) {

    showMessage(
      "businessFormMessage",
      "Please complete all required fields.",
      "error"
    );

    return;

  }

  const button = getElement("saveBusinessBtn");

  setButtonLoading(button, true, "Submitting business...");

  clearMessage("businessFormMessage");

  try {

    const userId = currentUser.uid;

    const businessRef = doc(db, "businesses", userId);

    const previousSnapshot = await getDoc(businessRef);

    const previousData = previousSnapshot.exists()
      ? previousSnapshot.data()
      : {};

    existingBusiness = previousData;

    const images = await uploadBusinessImages(userId);

    const plan = selectedPlan ||
      previousData.plan ||
      "free";

    let trialStartedAt = previousData.trialStartedAt || null;
    let trialEndsAt = previousData.trialEndsAt || null;

    let planStatus = "payment_pending";

    if (plan === "free") {

      if (!trialStartedAt) {

        trialStartedAt = Timestamp.now();

        const trialEndDate = new Date(
          Date.now() + (30 * 24 * 60 * 60 * 1000)
        );

        trialEndsAt = Timestamp.fromDate(trialEndDate);

        planStatus = "trial_active";

      } else {

        const trialEnd = trialEndsAt?.toDate
          ? trialEndsAt.toDate()
          : null;

        planStatus = trialEnd && trialEnd > new Date()
          ? "trial_active"
          : "trial_expired";

      }

    }

    const businessData = {

      userId,

      businessName,
      category,
      owner,
      phone,
      whatsapp,

      county,
      town,
      address,
      description,

      logoUrl: images.logoUrl,
      photoUrls: images.photoUrls,

      latitude: consent ? currentLatitude : null,
      longitude: consent ? currentLongitude : null,
      accuracy: consent ? currentAccuracy : null,

      locationConsent: consent,

      plan,
      planPrice: plan === "free" ? 0 : selectedPrice,
      planDuration: selectedDuration,

      planStatus,

      trialStartedAt,
      trialEndsAt,

      status: "pending",

      updatedAt: serverTimestamp(),

      createdAt: previousData.createdAt || serverTimestamp()

    };

    await setDoc(businessRef, businessData, { merge: true });

    existingBusiness = businessData;

    showMessage(
      "businessFormMessage",
      "Your business has been submitted successfully. It will appear publicly after approval.",
      "success"
    );

    updateDashboardBusinessInfo(businessData);

    await loadApprovedBusinesses();

  } catch (error) {

    showMessage(
      "businessFormMessage",
      formatError(error),
      "error"
    );

  } finally {

    setButtonLoading(button, false);

  }

});


/* =========================================
   LOAD MY BUSINESS PROFILE
========================================= */

async function loadMyBusinessProfile() {

  if (!currentUser) return;

  try {

    const businessRef = doc(db, "businesses", currentUser.uid);

    const snapshot = await getDoc(businessRef);

    if (!snapshot.exists()) {

      existingBusiness = null;

      updateDashboardBusinessInfo(null);

      return;

    }

    const data = snapshot.data();

    existingBusiness = data;

    const fields = {
      businessName: data.businessName,
      businessCategory: data.category,
      businessOwner: data.owner,
      businessPhone: data.phone,
      businessWhatsapp: data.whatsapp,
      businessCounty: data.county,
      businessTown: data.town,
      businessAddress: data.address,
      businessDescription: data.description
    };

    Object.entries(fields).forEach(([id, value]) => {

      const element = getElement(id);

      if (element && value !== undefined && value !== null) {
        element.value = value;
      }

    });

    const plan = data.plan || "free";

    const planNames = {
      free: "Free Trial",
      growth: "Growth Plan",
      verified_pro: "Verified Pro"
    };

    updateSelectedPlan(
      plan,
      data.planPrice || 0,
      data.planDuration || "30 days"
    );

    if (getElement("businessConsent")) {
      getElement("businessConsent").checked =
        data.locationConsent === true;
    }

    if (
      data.latitude !== null &&
      data.latitude !== undefined &&
      data.longitude !== null &&
      data.longitude !== undefined
    ) {

      updateLocationFields(
        data.latitude,
        data.longitude,
        data.accuracy || ""
      );

      if (getElement("businessLocationStatus")) {
        getElement("businessLocationStatus").textContent =
          "Previously saved GPS location available.";
      }

    } else {

      updateLocationFields("", "", "");

    }

    // Restore existing image previews.
    const logoPreview = getElement("logoPreview");

    if (logoPreview) {

      logoPreview.replaceChildren();

      if (data.logoUrl) {

        const image = document.createElement("img");
        image.src = data.logoUrl;
        image.alt = "Existing business logo";

        logoPreview.appendChild(image);

      }

    }

    const photosPreview = getElement("photosPreview");

    if (photosPreview) {

      photosPreview.replaceChildren();

      (data.photoUrls || []).forEach(url => {

        const image = document.createElement("img");

        image.src = url;
        image.alt = "Existing business photo";

        photosPreview.appendChild(image);

      });

    }

    updateDashboardBusinessInfo(data);

  } catch (error) {

    console.error("Business profile loading error:", error);

  }

}


/* =========================================
   DASHBOARD INFORMATION
========================================= */

function updateDashboardBusinessInfo(data) {

  const statusText = getElement("businessStatusText");
  const planText = getElement("currentPlanText");

  if (!data) {

    if (statusText) {
      statusText.textContent = "No business listing found.";
    }

    if (planText) {
      planText.textContent = "No active business plan.";
    }

    return;

  }

  const status = data.status || "pending";

  const statusNames = {
    approved: "Approved - Public listing",
    pending: "Pending approval",
    rejected: "Not approved",
    suspended: "Suspended"
  };

  if (statusText) {
    statusText.textContent =
      statusNames[status] || status;
  }

  const planNames = {
    free: "Free Trial",
    growth: "Growth Plan",
    verified_pro: "Verified Pro"
  };

  if (planText) {
    planText.textContent =
      (planNames[data.plan] || "Free Trial") +
      " - " + (data.planStatus || "Not set");
  }

}


/* =========================================
   EDIT BUSINESS PROFILE
========================================= */

getElement("editBusinessBtn")?.addEventListener("click", () => {

  if (!currentUser) {

    showLoginMode();
    openPopup("accountPopup");

    return;

  }

  closeAllPopups();
  openPopup("registerPopup");
  updateRegistrationNotice();

});


/* =========================================
   LOAD APPROVED BUSINESSES
========================================= */

async function loadApprovedBusinesses() {

  const loading = getElement("businessLoading");
  const empty = getElement("noBusinesses");

  if (loading) {
    loading.hidden = false;
    loading.textContent = "Loading available businesses...";
  }

  if (empty) empty.hidden = true;

  try {

    const businessesQuery = query(
      collection(db, "businesses"),
      where("status", "==", "approved")
    );

    const snapshot = await getDocs(businessesQuery);

    approvedBusinesses = snapshot.docs.map(document => ({
      id: document.id,
      ...document.data()
    }));

    displayBusinesses();

  } catch (error) {

    console.error("Business loading error:", error);

    if (loading) {
      loading.textContent =
        "Unable to load businesses. Please refresh the page.";
    }

  } finally {

    if (loading) loading.hidden = true;

  }

}


/* =========================================
   DISPLAY BUSINESS CARDS
========================================= */

function displayBusinesses() {

  const grid = getElement("serviceGrid");
  const empty = getElement("noBusinesses");

  if (!grid) return;

  grid.replaceChildren();

  const searchTerm = normalize(
    getElement("businessSearch")?.value
  );

  const filteredBusinesses = approvedBusinesses.filter(business => {

    const matchesCategory =
      activeCategory === "all" ||
      normalize(business.category) === normalize(activeCategory);

    const searchableText = [
      business.businessName,
      business.category,
      business.county,
      business.town,
      business.address,
      business.description
    ].map(normalize).join(" ");

    const matchesSearch =
      !searchTerm || searchableText.includes(searchTerm);

    return matchesCategory && matchesSearch;

  });

  filteredBusinesses.forEach(business => {

    const card = document.createElement("article");

    card.className = "business-card";

    const imageUrl = business.logoUrl ||
      business.photoUrls?.[0] ||
      "";

    if (imageUrl) {

      const image = document.createElement("img");

      image.src = imageUrl;
      image.alt = business.businessName || "Business image";
      image.loading = "lazy";

      card.appendChild(image);

    }

    const content = document.createElement("div");

    content.className = "business-card-content";

    const category = document.createElement("span");

    category.className = "business-category";
    category.textContent = business.category || "Local Service";

    const name = document.createElement("h3");

    name.textContent = business.businessName || "Business";

    const description = document.createElement("p");

    description.textContent =
      business.description || "Contact this business for more information.";

    const location = document.createElement("p");

    location.textContent = [
      business.town,
      business.county
    ].filter(Boolean).join(", ");

    content.append(category, name, description, location);

    const actions = document.createElement("div");

    actions.className = "business-card-actions";

    if (business.phone) {

      const call = document.createElement("a");

      call.href = "tel:" + business.phone;
      call.textContent = "Call";
      actions.appendChild(call);

    }

    if (business.whatsapp || business.phone) {

      const whatsapp = document.createElement("a");

      const number = (business.whatsapp || business.phone)
        .replace(/\D/g, "");

      whatsapp.href = "https://wa.me/" + number;
      whatsapp.target = "_blank";
      whatsapp.rel = "noopener";
      whatsapp.textContent = "WhatsApp";

      actions.appendChild(whatsapp);

    }

    const addressText = [
      business.address,
      business.town,
      business.county
    ].filter(Boolean).join(", ");

    if (addressText) {

      const map = document.createElement("a");

      map.href =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(addressText);

      map.target = "_blank";
      map.rel = "noopener";
      map.textContent = "Map";

      actions.appendChild(map);

    }

    content.appendChild(actions);

    card.appendChild(content);

    // Additional business photographs.
    if (Array.isArray(business.photoUrls) &&
        business.photoUrls.length > 1) {

      const gallery = document.createElement("div");

      gallery.className = "business-gallery";

      business.photoUrls.slice(0, 3).forEach(url => {

        const image = document.createElement("img");

        image.src = url;
        image.alt = "Service photograph";
        image.loading = "lazy";

        gallery.appendChild(image);

      });

      card.appendChild(gallery);

    }

    grid.appendChild(card);

  });

  if (empty) {
    empty.hidden = filteredBusinesses.length !== 0;
  }

}


/* =========================================
   SEARCH
========================================= */

getElement("searchBtn")?.addEventListener("click", displayBusinesses);

getElement("businessSearch")?.addEventListener("input", displayBusinesses);

getElement("businessSearch")?.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    event.preventDefault();
    displayBusinesses();
  }

});


/* =========================================
   CATEGORY FILTERS
========================================= */

function selectCategory(category) {

  activeCategory = category;

  document.querySelectorAll(".category-chip").forEach(button => {

    const isActive =
      normalize(button.dataset.category) === normalize(category);

    button.classList.toggle("active", isActive);

  });

  displayBusinesses();

}

document.querySelectorAll(".category-chip").forEach(button => {

  button.addEventListener("click", () => {

    selectCategory(button.dataset.category);

  });

});


/* =========================================
   OPTIONAL LOCATION SEARCH
========================================= */

getElement("getBusinessLocation")?.addEventListener("click", () => {

  const status = getElement("locationStatus");

  if (!navigator.geolocation) {

    if (status) {
      status.textContent = "Your browser does not support location search.";
    }

    return;

  }

  if (status) {
    status.textContent = "Getting your location...";
  }

  navigator.geolocation.getCurrentPosition(

    position => {

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      if (status) {
        status.textContent = "Location received. Opening nearby map results.";
      }

      const mapUrl =
        "https://www.google.com/maps/search/local+services/@" +
        latitude + "," + longitude + ",14z";

      window.open(mapUrl, "_blank", "noopener");

    },

    error => {

      if (status) {

        status.textContent =
          error.code === 1
            ? "Location permission was denied. You can search by area instead."
            : "Unable to get your location. Please try again.";

      }

    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    }

  );

});


/* =========================================
   PAGE INITIALIZATION
========================================= */

if (getElement("currentYear")) {
  getElement("currentYear").textContent = new Date().getFullYear();
}

showLoginMode();

loadApprovedBusinesses();

updateRegistrationNotice();

console.log("FIND-ME KAZI JavaScript loaded successfully.");
