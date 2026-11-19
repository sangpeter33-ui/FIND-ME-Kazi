
/* ==========================================
   FIND-ME KAZI
   COMPLETE WEBSITE JAVASCRIPT
   Firebase Authentication, Firestore,
   Storage, Business Profiles and Pop-ups
   ========================================== */

import { auth, db, storage } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


/* ==========================================
   GLOBAL VARIABLES
   ========================================== */

let currentUser = null;
let approvedBusinesses = [];
let activeCategory = "all";
let selectedPlan = "Free Trial";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const PLAN_LIMITS = {
  "Free Trial": 3,
  "Growth": 3,
  "Verified Pro": 6
};


/* ==========================================
   GENERAL HELPERS
   ========================================== */

function getElement(id) {
  return document.getElementById(id);
}

function showMessage(id, message, type = "info") {
  const element = getElement(id);

  if (!element) return;

  element.textContent = message;
  element.className = type + "-message";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function openPopup(id) {
  closeAllPopups();

  const popup = getElement(id);

  if (popup) {
    popup.hidden = false;
    document.body.classList.add("popup-open");
  }

  const navigation = getElement("mainNavigation");

  if (navigation) {
    navigation.classList.remove("active");
  }
}

function closeAllPopups() {
  document.querySelectorAll(".popup-overlay").forEach(popup => {
    popup.hidden = true;
  });

  document.body.classList.remove("popup-open");
}

function openLogin() {
  openPopup("accountPopup");

  if (getElement("registerForm")) {
    getElement("registerForm").hidden = true;
  }

  if (getElement("loginForm")) {
    getElement("loginForm").hidden = false;
  }
}

function openRegister() {
  openPopup("accountPopup");

  if (getElement("loginForm")) {
    getElement("loginForm").hidden = true;
  }

  if (getElement("registerForm")) {
    getElement("registerForm").hidden = false;
  }
}

function openDashboard() {
  if (!currentUser) {
    openLogin();
    return;
  }

  openPopup("dashboardPopup");
}


/* ==========================================
   POP-UP NAVIGATION
   ========================================== */

document.addEventListener("click", event => {

  const trigger = event.target.closest("[data-popup]");

  if (trigger) {
    openPopup(trigger.dataset.popup);
  }

  const closeButton = event.target.closest(".popup-close");

  if (closeButton) {
    closeAllPopups();
  }

  if (event.target.classList.contains("popup-overlay")) {
    closeAllPopups();
  }

});


document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeAllPopups();
  }
});


const menuToggle = getElement("menuToggle");
const mainNavigation = getElement("mainNavigation");

if (menuToggle && mainNavigation) {
  menuToggle.addEventListener("click", () => {
    mainNavigation.classList.toggle("active");
  });
}


getElement("openLoginBtn")?.addEventListener("click", openLogin);

getElement("openRegisterBtn")?.addEventListener("click", openRegister);

getElement("showLoginBtn")?.addEventListener("click", openLogin);

getElement("showRegisterBtn")?.addEventListener("click", openRegister);

getElement("registerFromBusinessBtn")?.addEventListener("click", openRegister);

getElement("loginFromBusinessBtn")?.addEventListener("click", openLogin);


/* ==========================================
   FIREBASE ACCOUNT REGISTRATION
   ========================================== */

const registerForm = getElement("registerForm");

if (registerForm) {

  registerForm.addEventListener("submit", async event => {

    event.preventDefault();

    const name = getElement("registerName").value.trim();
    const email = getElement("registerEmail").value.trim();
    const password = getElement("registerPassword").value;
    const confirmPassword = getElement("confirmPassword").value;

    if (password.length < 6) {
      showMessage("registerMessage", "Password must have at least 6 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("registerMessage", "Your passwords do not match.", "error");
      return;
    }

    try {

      showMessage("registerMessage", "Creating your account...");

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
          uid: result.user.uid,
          name: name,
          email: email,
          createdAt: serverTimestamp()
        },
        { merge: true }
      );

      showMessage(
        "registerMessage",
        "Account created successfully!",
        "success"
      );

      registerForm.reset();

      currentUser = result.user;

      updateAccountInterface(result.user);

      setTimeout(() => {
        openDashboard();
      }, 1000);

    } catch (error) {

      console.error("Registration error:", error);

      showMessage(
        "registerMessage",
        friendlyError(error),
        "error"
      );

    }

  });

}


/* ==========================================
   FIREBASE LOGIN
   ========================================== */

const loginForm = getElement("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async event => {

    event.preventDefault();

    const email = getElement("loginEmail").value.trim();
    const password = getElement("loginPassword").value;

    try {

      showMessage("loginMessage", "Signing you in...");

      const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      currentUser = result.user;

      loginForm.reset();

      showMessage(
        "loginMessage",
        "Login successful!",
        "success"
      );

      updateAccountInterface(result.user);

      setTimeout(openDashboard, 700);

    } catch (error) {

      console.error("Login error:", error);

      showMessage(
        "loginMessage",
        friendlyError(error),
        "error"
      );

    }

  });

}


/* ==========================================
   GOOGLE SIGN-IN
   ========================================== */

const googleButton = getElement("googleSignInBtn");

if (googleButton) {

  googleButton.addEventListener("click", async () => {

    try {

      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      currentUser = result.user;

      await setDoc(
        doc(db, "users", result.user.uid),
        {
          uid: result.user.uid,
          name: result.user.displayName || "",
          email: result.user.email || "",
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      updateAccountInterface(result.user);

      openDashboard();

    } catch (error) {

      console.error("Google sign-in error:", error);

      showMessage(
        "loginMessage",
        friendlyError(error),
        "error"
      );

    }

  });

}


/* ==========================================
   FRIENDLY FIREBASE ERROR MESSAGES
   ========================================== */

function friendlyError(error) {

  const code = error.code || "";

  const messages = {
    "auth/email-already-in-use": "This email already has an account. Please login.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Please choose a stronger password.",
    "auth/user-not-found": "No account was found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Your email or password is incorrect.",
    "auth/popup-closed-by-user": "The sign-in window was closed.",
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase."
  };

  return messages[code] || error.message || "Something went wrong. Please try again.";
}


/* ==========================================
   ACCOUNT INTERFACE
   ========================================== */

function updateAccountInterface(user) {

  const loginButton = getElement("openLoginBtn");
  const registerButton = getElement("openRegisterBtn");
  const logoutButton = getElement("logoutBtn");

  if (loginButton) loginButton.hidden = !!user;

  if (registerButton) registerButton.hidden = !!user;

  if (logoutButton) logoutButton.hidden = !user;

  if (getElement("signedInEmail")) {
    getElement("signedInEmail").textContent = user?.email || "Not signed in";
  }

}


/* ==========================================
   CHECK LOGIN STATUS
   ========================================== */

onAuthStateChanged(auth, async user => {

  currentUser = user;

  updateAccountInterface(user);

  if (user) {
    await loadMyBusinessProfile();
  }

});


/* ==========================================
   LOGOUT
   ========================================== */

getElement("logoutBtn")?.addEventListener("click", async () => {

  try {

    await signOut(auth);

    currentUser = null;

    closeAllPopups();

    updateAccountInterface(null);

    alert("You have logged out successfully.");

  } catch (error) {

    console.error("Logout error:", error);

    alert("Unable to log out. Please try again.");

  }

});


/* ==========================================
   IMAGE VALIDATION
   ========================================== */

function validateImage(file) {

  if (!file) return false;

  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Each image must be 5 MB or smaller.");
  }

  return true;

}


/* ==========================================
   IMAGE PREVIEW
   ========================================== */

function previewImage(file, container, append = false) {

  if (!file || !container) return;

  validateImage(file);

  if (!append) {
    container.innerHTML = "";
  }

  const image = document.createElement("img");

  image.alt = "Selected business image";
  image.src = URL.createObjectURL(file);

  container.appendChild(image);

}


getElement("businessLogo")?.addEventListener("change", event => {

  try {

    const file = event.target.files[0];

    if (file) {
      previewImage(file, getElement("logoPreview"));
    }

  } catch (error) {

    event.target.value = "";

    alert(error.message);

  }

});


getElement("businessPhotos")?.addEventListener("change", event => {

  try {

    const files = Array.from(event.target.files);

    const container = getElement("businessPhotoPreview");

    if (!container) return;

    container.innerHTML = "";

    const limit = PLAN_LIMITS[selectedPlan] || 3;

    if (files.length > limit) {
      event.target.value = "";
      throw new Error("Your selected plan allows up to " + limit + " photos.");
    }

    files.forEach(file => {
      previewImage(file, container, true);
    });

  } catch (error) {

    event.target.value = "";

    alert(error.message);

  }

});


/* ==========================================
   UPLOAD IMAGE TO FIREBASE STORAGE
   ========================================== */

async function uploadBusinessImage(file, folder) {

  if (!file) return null;

  validateImage(file);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const path =
    "businesses/" +
    currentUser.uid +
    "/" +
    folder +
    "/" +
    Date.now() +
    "_" +
    safeName;

  const imageReference = ref(storage, path);

  await uploadBytes(imageReference, file, {
    contentType: file.type
  });

  return await getDownloadURL(imageReference);

}


/* ==========================================
   GPS LOCATION
   ========================================== */

getElement("getBusinessLocation")?.addEventListener("click", () => {

  const status = getElement("locationStatus");

  if (!navigator.geolocation) {

    if (status) {
      status.textContent = "Location services are not supported by this browser.";
    }

    return;

  }

  if (status) {
    status.textContent = "Getting your location...";
  }

  navigator.geolocation.getCurrentPosition(

    position => {

      getElement("businessLatitude").value =
        position.coords.latitude;

      getElement("businessLongitude").value =
        position.coords.longitude;

      getElement("businessAccuracy").value =
        position.coords.accuracy;

      if (status) {
        status.textContent = "Your location has been captured successfully.";
      }

    },

    error => {

      console.error("Location error:", error);

      if (status) {
        status.textContent =
          "Location unavailable. Please allow location permission and try again.";
      }

    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }

  );

});


/* ==========================================
   SAVE BUSINESS PROFILE
   ========================================== */

const businessProfileForm = getElement("businessProfileForm");

if (businessProfileForm) {

  businessProfileForm.addEventListener("submit", async event => {

    event.preventDefault();

    if (!currentUser) {
      openLogin();
      showMessage("profileMessage", "Please login before saving your business.", "error");
      return;
    }

    if (!getElement("businessConsent").checked) {
      showMessage("profileMessage", "Please confirm your business information.", "error");
      return;
    }

    const saveButton = getElement("saveBusinessProfileBtn");

    const originalText = saveButton?.textContent;

    try {

      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving your profile...";
      }

      const existingReference = doc(db, "businesses", currentUser.uid);

      const existingSnapshot = await getDoc(existingReference);

      const existingBusiness = existingSnapshot.exists()
        ? existingSnapshot.data()
        : {};

      const businessName = getElement("businessName").value.trim();
      const category = getElement("businessCategory").value;
      const ownerName = getElement("businessOwnerName").value.trim();
      const phone = getElement("businessPhone").value.trim();
      const whatsapp = getElement("businessWhatsApp").value.trim();
      const location = getElement("businessLocation").value.trim();
      const address = getElement("businessAddress").value.trim();
      const description = getElement("businessDescription").value.trim();

      const logoFile = getElement("businessLogo").files[0];

      const photoFiles = Array.from(
        getElement("businessPhotos").files
      );

      const photoLimit = PLAN_LIMITS[selectedPlan] || 3;

      if (photoFiles.length > photoLimit) {
        throw new Error("Your selected plan allows up to " + photoLimit + " service photos.");
      }

      photoFiles.forEach(validateImage);

      let logoUrl = existingBusiness.logoUrl || "";

      if (logoFile) {
        logoUrl = await uploadBusinessImage(logoFile, "logo");
      }

      let photoUrls = existingBusiness.photoUrls || [];

      if (photoFiles.length > 0) {

        photoUrls = [];

        for (const file of photoFiles) {
          const url = await uploadBusinessImage(file, "photos");
          photoUrls.push(url);
        }

      }

      const latitude = getElement("businessLatitude").value;
      const longitude = getElement("businessLongitude").value;
      const accuracy = getElement("businessAccuracy").value;

      let planStatus = "payment_pending";
      let trialEndsAt = existingBusiness.trialEndsAt || null;

      if (selectedPlan === "Free Trial") {

        const trialAlreadyUsed = existingBusiness.trialStartedAt;

        if (!trialAlreadyUsed) {

          const expiry = new Date();

          expiry.setDate(expiry.getDate() + 30);

          trialEndsAt = Timestamp.fromDate(expiry);

          planStatus = "active";

        } else {

          planStatus = "trial_already_used";

        }

      }

      const businessData = {

        ownerUid: currentUser.uid,

        ownerEmail: currentUser.email || "",

        businessName: businessName,

        category: category,

        ownerName: ownerName,

        phone: phone,

        whatsapp: whatsapp,

        location: location,

        address: address,

        description: description,

        logoUrl: logoUrl,

        photoUrls: photoUrls,

        latitude: latitude ? Number(latitude) : null,

        longitude: longitude ? Number(longitude) : null,

        accuracy: accuracy ? Number(accuracy) : null,

        plan: selectedPlan,

        planStatus: planStatus,

        trialStartedAt:
          selectedPlan === "Free Trial" && !existingBusiness.trialStartedAt
            ? serverTimestamp()
            : existingBusiness.trialStartedAt || null,

        trialEndsAt: trialEndsAt,

        status: "pending",

        updatedAt: serverTimestamp(),

        createdAt:
          existingBusiness.createdAt || serverTimestamp()

      };

      await setDoc(existingReference, businessData, { merge: true });

      showMessage(
        "profileMessage",
        "Your business profile has been submitted for review.",
        "success"
      );

      if (getElement("profileStatus")) {
        getElement("profileStatus").textContent = "Pending review";
      }

      if (getElement("currentPlan")) {
        getElement("currentPlan").textContent = selectedPlan;
      }

      if (getElement("myBusinessListing")) {
        getElement("myBusinessListing").textContent =
          businessName + " — Submitted for review.";
      }

      businessProfileForm.reset();

      if (getElement("logoPreview")) {
        getElement("logoPreview").innerHTML = "";
      }

      if (getElement("businessPhotoPreview")) {
        getElement("businessPhotoPreview").innerHTML = "";
      }

      if (getElement("locationStatus")) {
        getElement("locationStatus").textContent =
          "Location has not been captured.";
      }

      await loadMyBusinessProfile();

    } catch (error) {

      console.error("Business profile error:", error);

      showMessage(
        "profileMessage",
        error.message || "Unable to save your business profile.",
        "error"
      );

    } finally {

      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = originalText || "Save Business Profile";
      }

    }

  });

}


/* ==========================================
   LOAD MY BUSINESS PROFILE
   ========================================== */

async function loadMyBusinessProfile() {

  if (!currentUser) return;

  try {

    const reference = doc(db, "businesses", currentUser.uid);

    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) return;

    const business = snapshot.data();

    if (getElement("businessName")) {
      getElement("businessName").value = business.businessName || "";
    }

    if (getElement("businessCategory")) {
      getElement("businessCategory").value = business.category || "";
    }

    if (getElement("businessOwnerName")) {
      getElement("businessOwnerName").value = business.ownerName || "";
    }

    if (getElement("businessPhone")) {
      getElement("businessPhone").value = business.phone || "";
    }

    if (getElement("businessWhatsApp")) {
      getElement("businessWhatsApp").value = business.whatsapp || "";
    }

    if (getElement("businessLocation")) {
      getElement("businessLocation").value = business.location || "";
    }

    if (getElement("businessAddress")) {
      getElement("businessAddress").value = business.address || "";
    }

    if (getElement("businessDescription")) {
      getElement("businessDescription").value = business.description || "";
    }

    selectedPlan = business.plan || "Free Trial";

    if (getElement("currentPlan")) {
      getElement("currentPlan").textContent = selectedPlan;
    }

    if (getElement("profileStatus")) {
      getElement("profileStatus").textContent =
        business.status || "Pending review";
    }

    if (getElement("myBusinessListing")) {
      getElement("myBusinessListing").textContent =
        business.businessName + " — " + (business.status || "Pending review");
    }

    if (getElement("photoLimitMessage")) {
      getElement("photoLimitMessage").textContent =
        selectedPlan + ": Up to " +
        (PLAN_LIMITS[selectedPlan] || 3) +
        " service photos.";
    }

  } catch (error) {

    console.error("Loading business profile:", error);

  }

}


/* ==========================================
   PLAN SELECTION
   ========================================== */

document.querySelectorAll(".choose-plan-btn").forEach(button => {

  button.addEventListener("click", () => {

    selectedPlan = button.dataset.plan || "Free Trial";

    const message = getElement("selectedPlanMessage");

    if (message) {

      if (selectedPlan === "Free Trial") {
        message.textContent =
          "Free Trial selected. Create an account to continue.";
      } else {
        message.textContent =
          selectedPlan +
          " selected. Payment and activation must be confirmed before premium access starts.";
      }

    }

    if (currentUser) {

      if (getElement("currentPlan")) {
        getElement("currentPlan").textContent = selectedPlan;
      }

      if (getElement("photoLimitMessage")) {
        getElement("photoLimitMessage").textContent =
          selectedPlan + ": Up to " +
          (PLAN_LIMITS[selectedPlan] || 3) +
          " service photos.";
      }

      openDashboard();

    } else {

      openRegister();

    }

  });

});


/* ==========================================
   LOAD APPROVED PUBLIC BUSINESSES
   ========================================== */

async function loadApprovedBusinesses() {

  const grid = getElement("approvedBusinessesGrid");

  if (!grid) return;

  grid.innerHTML = "<p>Loading businesses...</p>";

  try {

    const businessesQuery = query(
      collection(db, "businesses"),
      where("status", "==", "approved")
    );

    const snapshot = await getDocs(businessesQuery);

    approvedBusinesses = [];

    snapshot.forEach(documentSnapshot => {

      approvedBusinesses.push({
        id: documentSnapshot.id,
        ...documentSnapshot.data()
      });

    });

    displayBusinesses(approvedBusinesses);

  } catch (error) {

    console.error("Loading approved businesses:", error);

    grid.innerHTML =
      "<p>Unable to load businesses right now. Please try again later.</p>";

  }

}


/* ==========================================
   DISPLAY BUSINESS CARDS
   ========================================== */

function displayBusinesses(businesses) {

  const grid = getElement("approvedBusinessesGrid");

  const emptyMessage = getElement("noBusinessesMessage");

  if (!grid) return;

  grid.innerHTML = "";

  if (businesses.length === 0) {

    if (emptyMessage) emptyMessage.hidden = false;

    return;

  }

  if (emptyMessage) emptyMessage.hidden = true;

  businesses.forEach(business => {

    const card = document.createElement("article");

    card.className = "business-card";

    if (business.logoUrl) {

      const image = document.createElement("img");

      image.src = business.logoUrl;
      image.alt = business.businessName || "Business logo";
      image.loading = "lazy";

      card.appendChild(image);

    }

    const title = document.createElement("h3");

    title.textContent = business.businessName || "Business";

    card.appendChild(title);

    const category = document.createElement("p");

    category.textContent = "Category: " + (business.category || "Not specified");

    card.appendChild(category);

    const location = document.createElement("p");

    location.textContent = "Location: " + (business.location || "Not specified");

    card.appendChild(location);

    const description = document.createElement("p");

    description.textContent = business.description || "";

    card.appendChild(description);

    if (Array.isArray(business.photoUrls)) {

      business.photoUrls.forEach(url => {

        const photo = document.createElement("img");

        photo.src = url;
        photo.alt = "Service photo";
        photo.loading = "lazy";

        card.appendChild(photo);

      });

    }

    if (business.phone) {

      const phoneButton = document.createElement("a");

      phoneButton.className = "btn btn-primary";
      phoneButton.href = "tel:" + business.phone;
      phoneButton.textContent = "Call Business";

      card.appendChild(phoneButton);

    }

    if (business.whatsapp) {

      const whatsappNumber = business.whatsapp.replace(/\D/g, "");

      const whatsappButton = document.createElement("a");

      whatsappButton.className = "btn btn-outline";
      whatsappButton.href =
        "https://wa.me/" + whatsappNumber;

      whatsappButton.target = "_blank";
      whatsappButton.rel = "noopener noreferrer";
      whatsappButton.textContent = "WhatsApp";

      card.appendChild(whatsappButton);

    }

    grid.appendChild(card);

  });

}


/* ==========================================
   SEARCH AND CATEGORY FILTERS
   ========================================== */

function filterBusinesses() {

  const search = normalize(getElement("serviceSearch")?.value);

  const location = normalize(getElement("locationSearch")?.value);

  const results = approvedBusinesses.filter(business => {

    const matchesCategory =
      activeCategory === "all" ||
      normalize(business.category) === normalize(activeCategory);

    const searchableText = normalize(
      business.businessName + " " +
      business.category + " " +
      business.description
    );

    const matchesSearch =
      !search || searchableText.includes(search);

    const matchesLocation =
      !location ||
      normalize(business.location).includes(location) ||
      normalize(business.address).includes(location);

    return matchesCategory && matchesSearch && matchesLocation;

  });

  displayBusinesses(results);

}


getElement("searchBtn")?.addEventListener("click", filterBusinesses);

getElement("serviceSearch")?.addEventListener("input", filterBusinesses);

getElement("locationSearch")?.addEventListener("input", filterBusinesses);


document.querySelectorAll(".category-btn").forEach(button => {

  button.addEventListener("click", () => {

    document.querySelectorAll(".category-btn").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    activeCategory = button.dataset.category || "all";

    filterBusinesses();

  });

});


/* ==========================================
   INITIALISE WEBSITE
   ========================================== */

const year = getElement("currentYear");

if (year) {
  year.textContent = new Date().getFullYear();
}

loadApprovedBusinesses();

console.log("FIND-ME KAZI JavaScript loaded successfully.");
