import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { enableFirestoreDebug } from '../firebase/firestore-debug';

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

  // Function to log out the current user
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

  // Function to get user profile data from Firestore with caching
  const getUserProfile = async (uid) => {
    // Check cache first (valid for 10 minutes)
    const cachedProfile = profileCache.current.get(uid);
    const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    if (cachedProfile && (Date.now() - cachedProfile.timestamp) < CACHE_TTL) {
      setUserProfile(cachedProfile.data);
      return cachedProfile.data;
    }
    
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserProfile(userData);
        setFirestoreConnected(true);
        
        // Update cache
        profileCache.current.set(uid, {
          data: userData,
          timestamp: Date.now()
        });
        
        return userData;
      } else {
        // Create a basic profile if none exists
        const basicProfile = createFallbackProfile(uid);
        
        setUserProfile(basicProfile);
        return basicProfile;
      }
    } catch (err) {
      console.warn("Profile fetch failed, using fallback:", err);
      setFirestoreConnected(false);
      
      // Increment retry count
      retryCount.current += 1;
      
      // Return a minimal profile based on auth data when Firestore is unavailable
      const fallbackProfile = createFallbackProfile(uid);
      
      setUserProfile(fallbackProfile);
      return fallbackProfile;
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