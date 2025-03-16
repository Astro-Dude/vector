import { createContext, useState, useContext, useEffect } from 'react';
import { 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { enableFirestoreDebug } from '../firebase/firestore-debug';

// Enable Firestore debug in development
if (import.meta.env.DEV) {
  enableFirestoreDebug();
}

// Ensure persistence is set to local
try {
  setPersistence(auth, browserLocalPersistence)
    .catch(err => console.error("Error setting persistence:", err));
} catch (err) {
  console.error("Persistence setup error:", err);
}

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

  // Function to sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError("");
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      try {
        // Check if user document exists, if not create one
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (!userDoc.exists()) {
          // Create new user document in Firestore for Google sign-in
          await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL,
            createdAt: new Date().toISOString(),
            role: "student",
            purchasedTests: [],
            completedTests: [],
            authProvider: "google"
          });
        }
      } catch (firestoreError) {
        console.error("Firestore error during sign-in:", firestoreError);
        setFirestoreConnected(false);
        
        // Still return the user even if Firestore operations fail
        // This allows basic authentication to work even with Firestore issues
      }
      
      return userCredential.user;
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message);
      throw err;
    }
  };

  // Function to log out the current user
  const logout = async () => {
    try {
      setError("");
      await signOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
      
      // Force page reload to clear any cached state
      window.location.href = '/login';
      
      return true;
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message);
      throw err;
    }
  };

  // Function to get user profile data from Firestore
  const getUserProfile = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserProfile(userData);
        setFirestoreConnected(true);
        return userData;
      } else {
        console.log("No user profile found");
        
        // Create a basic profile if none exists
        const basicProfile = {
          uid: uid,
          displayName: auth.currentUser?.displayName || "User",
          email: auth.currentUser?.email || "",
          role: "student",
          purchasedTests: [],
          completedTests: []
        };
        
        setUserProfile(basicProfile);
        return basicProfile;
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setFirestoreConnected(false);
      
      // Return a minimal profile based on auth data when Firestore is unavailable
      const fallbackProfile = {
        uid: uid,
        displayName: auth.currentUser?.displayName || "User",
        email: auth.currentUser?.email || "",
        role: "student",
        purchasedTests: [],
        completedTests: []
      };
      
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  // Effect to observe auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      setCurrentUser(user);
      setAuthChecked(true);
      
      if (user) {
        try {
          await getUserProfile(user.uid);
        } catch (err) {
          console.error("Error in auth state change profile fetch:", err);
        }
      } else {
        // Clear profile when user is logged out
        setUserProfile(null);
      }
      
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
    getUserProfile
  };

  // Only render children after initial auth check to prevent flashing
  return (
    <AuthContext.Provider value={value}>
      {authChecked ? children : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext; 