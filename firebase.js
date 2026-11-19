
/* =========================================
   FIND-ME KAZI
   Firebase Configuration
   Firebase v10.12.2
========================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


const firebaseConfig = {
  apiKey: "AIzaSyBGoUv5Zd_qWLU0SpM-iHNedWt6-8tvNTg",
  authDomain: "find-me-b149d.firebaseapp.com",
  projectId: "find-me-b149d",
  storageBucket: "find-me-b149d.firebasestorage.app",
  messagingSenderId: "529319890936",
  appId: "1:529319890936:web:40e1d159a9d945b221500d",
  measurementId: "G-953N1K6WL3"
};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("FIND-ME KAZI Firebase initialized successfully.");
