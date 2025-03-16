import { getFirestore, setLogLevel } from "firebase/firestore";

// Enable Firestore debug logging in development
export const enableFirestoreDebug = () => {
  if (import.meta.env.DEV) {
    try {
      setLogLevel('debug');
      console.log('Firestore debug logging enabled');
    } catch (err) {
      console.error('Failed to enable Firestore debug logging:', err);
    }
  }
};

// Function to check Firestore connection status
export const checkFirestoreConnection = async (db) => {
  try {
    // Try a simple query to check if Firestore is accessible
    const timestamp = Date.now().toString();
    const connectionRef = db.collection('connectionTest').doc(timestamp);
    
    await connectionRef.set({
      timestamp,
      message: 'Connection test'
    });
    
    console.log('Firestore connection successful!');
    return true;
  } catch (error) {
    console.error('Firestore connection error:', error);
    return false;
  }
}; 