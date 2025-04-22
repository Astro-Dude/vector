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
  orderBy,
  doc,
  getDoc,
  setDoc
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
    // First try to get the student name from the users collection
    let studentName = "Unknown Student";
    let phoneNumber = ""; // Add phone number variable
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        if (userDoc.data().displayName) {
          studentName = userDoc.data().displayName;
        }
        // Get phone number if available
        if (userDoc.data().phoneNumber) {
          phoneNumber = userDoc.data().phoneNumber;
        }
      } else {
        // If no user doc or no display name, try to get it from auth
        const authUser = auth.currentUser;
        if (authUser && authUser.uid === userId && authUser.displayName) {
          studentName = authUser.displayName;
          
          // Since we found the name in auth but not in Firestore, update it
          await setDoc(userRef, {
            displayName: authUser.displayName,
            email: authUser.email,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }
      }
    } catch (err) {
      console.warn("Failed to get student name:", err);
    }
    
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
      studentName, // Add the student name
      phoneNumber, // Add the phone number
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

// Function to create/update user document in Firestore
const saveUserToFirestore = async (user) => {
  if (!user) return null;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create new user document if it doesn't exist
      await setDoc(userRef, {
        displayName: user.displayName || '',
        email: user.email,
        phoneNumber: user.phoneNumber || '', // May be empty for Google/email auth
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        phoneNumberVerified: false, // Track if phone number has been verified
        needsPhoneNumber: !user.phoneNumber // Flag to indicate if we need to ask for phone
      });
      console.log("Created new user document in Firestore");
    } else {
      // Update last login time for existing users
      const updateData = {
        lastLogin: serverTimestamp(),
        // Update these fields if they might have changed
        displayName: user.displayName || userSnap.data().displayName || '',
        email: user.email || userSnap.data().email,
      };
      
      // Only update phoneNumber if user has one and it's different from existing one
      if (user.phoneNumber) {
        updateData.phoneNumber = user.phoneNumber;
        updateData.phoneNumberVerified = true; // If coming from Auth, it's verified
        updateData.needsPhoneNumber = false;
      } else if (!userSnap.data().phoneNumber) {
        // User still doesn't have phone number, mark that we need to ask for it
        updateData.needsPhoneNumber = true;
      }
      
      await setDoc(userRef, updateData, { merge: true });
      console.log("Updated existing user document in Firestore");
    }
    
    return true;
  } catch (error) {
    console.error("Error saving user to Firestore:", error);
    return false;
  }
}; 