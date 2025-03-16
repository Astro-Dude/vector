// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, onAuthStateChanged, connectAuthEmulator } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBcuoctmR1FgvxlaF_WAJhKECDJkbC2Oa0",
  authDomain: "vector-9ade4.firebaseapp.com",
  projectId: "vector-9ade4",
  storageBucket: "vector-9ade4.appspot.com",
  messagingSenderId: "1075793698398",
  appId: "1:1075793698398:web:2f0f4f3315d1fbd95cdecf",
  measurementId: "G-NP9CZT2TJR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally
let analytics = null;
try {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
} catch (err) {
  console.error("Analytics error:", err);
}

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore with settings to prevent connection issues
const db = getFirestore(app);

// Don't enable persistence in development to avoid issues
// Only enable it in production
if (import.meta.env.PROD) {
  try {
    enableIndexedDbPersistence(db, {
      synchronizeTabs: true
    }).catch((err) => {
      console.error("Firestore persistence error:", err);
    });
  } catch (err) {
    console.error("Error enabling persistence:", err);
  }
}

// Export the auth and db instances
export { app, analytics, auth, db };

// Helper function to check auth state
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
}; 