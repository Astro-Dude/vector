// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, onAuthStateChanged, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  connectFirestoreEmulator, 
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy
} from "firebase/firestore";

// Reduce Firestore logging in production
if (import.meta.env.PROD) {
  setLogLevel('error');
} else {
  setLogLevel('warn');
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Custom settings for optimal performance and reduced connection errors
const customSettings = {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  // Disable long polling to prevent connection failures
  experimentalForceLongPolling: false,
  experimentalAutoDetectLongPolling: false,
  ignoreUndefinedProperties: true,
  // Reduce retry attempts and delays
  retry: {
    initialDelayMs: 100,
    maxDelayMs: 1000, // Reduce max delay to 1 second instead of 5 seconds
    backoffFactor: 1.3, // Lower backoff factor
    maxAttempts: 3,    // Fewer retry attempts
  }
};

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// Initialize Analytics conditionally but don't block main operations
let analytics = null;
if (!import.meta.env.SSR) {
  isSupported().then(yes => {
    if (yes) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        // Silently fail analytics initialization
      }
    }
  }).catch(() => {
    // Ignore analytics errors completely
  });
}

// Initialize Auth - this is critical for login functionality
const auth = getAuth(app);

// Initialize Firestore with simplified settings to prevent connection issues
let db;
try {
  // Use the simpler initialization method for better stability
  db = getFirestore(app);
} catch (err) {
  console.warn("Firestore initialization failed, retrying with default settings");
  try {
    db = getFirestore(app);
  } catch (innerErr) {
    console.error("All Firestore initialization attempts failed", innerErr);
    // Create a fallback version that won't attempt connections
    db = getFirestore(app);
  }
}

// Don't enable persistence at all to avoid connection issues
// Persistence often causes issues when network is unstable

// Export the auth and db instances
export { app, analytics, auth, db };

// Helper function to check auth state with shorter timeout
export const getCurrentUser = (timeoutMs = 5000) => {
  return new Promise((resolve) => {
    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      unsubscribe();
      resolve(null); // Resolve with null after timeout
    }, timeoutMs);
    
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(user);
      },
      () => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(null); // Always resolve, never reject
      }
    );
  });
};

// Function to save test results to Firestore
export const saveTestResult = async (userId, testData) => {
  try {
    // Create a unique hash/key for this test attempt
    const testFingerprint = `${userId}_${testData.testId}_${testData.score}_${testData.questionsTotal}_${testData.timeSpent}`;
    
    // Check if this exact test result already exists with this fingerprint
    const testResultsRef = collection(db, "testResults");
    const existingTestQuery = query(
      testResultsRef,
      where("userId", "==", userId),
      where("testFingerprint", "==", testFingerprint)
    );
    
    const existingTestSnapshot = await getDocs(existingTestQuery);
    
    // If this exact test already exists, don't save again
    if (!existingTestSnapshot.empty) {
      console.log("Exact same test result already exists, not saving duplicate");
      return existingTestSnapshot.docs[0].id;
    }
    
    // No duplicate found, save the new result
    const result = await addDoc(testResultsRef, {
      userId,
      testId: testData.testId,
      testName: testData.testName,
      score: testData.score,
      percentage: testData.percentage,
      questionsTotal: testData.questionsTotal,
      questionsAttempted: testData.questionsAttempted,
      timeSpent: testData.timeSpent,
      resultStatus: testData.resultStatus,
      timestamp: serverTimestamp(),
      testFingerprint: testFingerprint // Store the fingerprint to check for duplicates
    });
    return result.id;
  } catch (error) {
    console.error("Error saving test result:", error);
    throw error;
  }
};

// Function to get test history for a user
export const getTestHistory = async (userId) => {
  try {
    const testResultsRef = collection(db, "testResults");
    const q = query(
      testResultsRef, 
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const testHistory = [];
    
    querySnapshot.forEach((doc) => {
      testHistory.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      });
    });
    
    return testHistory;
  } catch (error) {
    console.error("Error fetching test history:", error);
    throw error;
  }
}; 