import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { enableFirestoreDebug } from '../firebase/firestore-debug';
import { 
  getUserPurchasedTests, 
  getUserBookedInterviews 
} from '../services/purchaseService';

// Only enable Firestore debug in development when explicitly needed
if (import.meta.env.DEV && false) { // Set to true only when debugging
  enableFirestoreDebug();
}

// Set persistence based on user preference (default to local)
const setPersistenceMode = async (rememberMe = true) => {
  try {
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);
    return true;
  } catch (err) {
    console.error("Persistence setup error:", err);
    return false;
  }
};

// Set default persistence on app load
setPersistenceMode(true);

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component for the auth context
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");
  const [firestoreConnected, setFirestoreConnected] = useState(true);
  
  // Add a retry counter to prevent infinite connection attempts
  const retryCount = useRef(0);
  const MAX_RETRIES = 2; // Reduce retries
  
  // Cache for user profiles to reduce Firestore reads
  const profileCache = useRef(new Map());
  
  // Create a local fallback profile for when Firestore fails
  const createFallbackProfile = (uid) => {
    return {
      uid: uid,
      displayName: auth.currentUser?.displayName || "User",
      email: auth.currentUser?.email || "",
      role: "student",
      purchasedTests: [],
      completedTests: [],
      isOfflineProfile: true
    };
  };

  // Function to sign in with Google with improved error handling
  const signInWithGoogle = async () => {
    try {
      setError("");
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Use the user credential immediately rather than waiting for Firestore
      // This speeds up the login process
      setCurrentUser(userCredential.user);
      setAuthChecked(true);
      
      // Create a minimal profile immediately
      const minimalProfile = createFallbackProfile(userCredential.user.uid);
      setUserProfile(minimalProfile);
      
      // Try to fetch/create the Firestore profile in the background
      setTimeout(() => {
        try {
          createOrUpdateUserDocument(userCredential.user);
        } catch (err) {
          // Non-blocking error, user can still use the app
          console.warn("Background profile creation failed:", err);
        }
      }, 100);
      
      return userCredential.user;
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message);
      throw err;
    }
  };
  
  // Separate function to create or update user document
  const createOrUpdateUserDocument = async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          role: "student",
          purchasedTests: [],
          completedTests: [],
          authProvider: "google"
        });
      }
      
      // Cache the profile
      const profile = userDoc.exists() ? userDoc.data() : null;
      if (profile) {
        profileCache.current.set(user.uid, {
          data: profile,
          timestamp: Date.now()
        });
        setUserProfile(profile);
      }
      
      setFirestoreConnected(true);
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);
      setFirestoreConnected(false);
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
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
        console.log("Created new user document in Firestore");
      } else {
        // Update last login time for existing users
        await setDoc(userRef, {
          lastLogin: serverTimestamp(),
          // Also update these fields if they might have changed
          displayName: user.displayName || userSnap.data().displayName || '',
          email: user.email || userSnap.data().email
        }, { merge: true });
        console.log("Updated existing user document in Firestore");
      }
      
      return true;
    } catch (error) {
      console.error("Error saving user to Firestore:", error);
      return false;
    }
  };

  // Effect to observe auth state changes - optimized for speed
  useEffect(() => {
    // Function to handle auth state
    const handleAuthState = async (user) => {
      // Always mark auth as checked immediately
      setAuthChecked(true);
      setCurrentUser(user);
      
      if (user) {
        // First try to use cached profile if available
        const cachedProfile = profileCache.current.get(user.uid);
        if (cachedProfile) {
          setUserProfile(cachedProfile.data);
          setLoading(false);
          
          // Refresh in background after returning control
          setTimeout(() => {
            getUserProfile(user.uid).catch(() => {});
          }, 1000);
          
          // Save user to Firestore whenever they log in
          await saveUserToFirestore(user);
          
          return;
        }
        
        // No cached profile, use fallback and load in background
        const fallbackProfile = createFallbackProfile(user.uid);
        setUserProfile(fallbackProfile);
        setLoading(false);
        
        // Try to load real profile in background
        setTimeout(() => {
          getUserProfile(user.uid).catch(() => {});
        }, 200);
      } else {
        // No user, clear profile and loading
        setUserProfile(null);
        setLoading(false);
      }
    };
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, handleAuthState, () => {
      // Error handler just marks auth as checked and not loading
      setAuthChecked(true);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Get user profile data from Firestore
  const getUserProfile = async (uid) => {
    try {
      // Get the user document
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUserProfile(profileData);
        setFirestoreConnected(true);
        return profileData;
      } else {
        // If user document doesn't exist yet (rare case)
        await saveUserToFirestore(currentUser);
        return getUserProfile(uid); // Try again
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setFirestoreConnected(false);
      return null;
    }
  };

  // Retry user profile fetch with shorter backoff
  const retryUserProfileFetch = async (uid) => {
    if (retryCount.current >= MAX_RETRIES) {
      return false;
    }
    
    // Short backoff: 300ms, 600ms
    const delay = 300 * (retryCount.current + 1);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await getUserProfile(uid);
      return true;
    } catch (err) {
      return false;
    }
  };

  // Function to sign up a new user
  const signup = async (email, password, name) => {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set display name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Save to Firestore
      await saveUserToFirestore({
        ...userCredential.user,
        displayName: name
      });
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  };
  
  // Function to log in
  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
      // saveUserToFirestore will be called by the onAuthStateChanged listener
    } catch (error) {
      throw error;
    }
  };
  
  // Function to log out
  const logout = async () => {
    try {
      setError("");
      await signOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
      
      // Don't reload the page, just navigate
      return true;
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message);
      throw err;
    }
  };

  // Function to reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Value object provided to context consumers
  const value = {
    currentUser,
    userProfile,
    loading,
    authChecked,
    error,
    firestoreConnected,
    signInWithGoogle,
    logout,
    signup,
    login,
    resetPassword,
    getUserProfile,
    retryUserProfileFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 