import { db } from '../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Path to app settings
const APP_SETTINGS_PATH = 'systemConfig/appSettings';

// Get application settings
export const getAppSettings = async () => {
  try {
    const settingsRef = doc(db, APP_SETTINGS_PATH);
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      return {
        interviewBookingsEnabled: data.interviewBookingsEnabled,
        interviewBookingsMessage: data.interviewBookingsMessage || '',
        lastUpdated: data.lastUpdated || new Date()
      };
    } else {
      return {
        interviewBookingsEnabled: true,
        interviewBookingsMessage: '',
        lastUpdated: new Date()
      };
    }
  } catch (error) {
    return {
      interviewBookingsEnabled: true,
      interviewBookingsMessage: ''
    };
  }
};

// Update interview booking settings
export const updateInterviewBookingSettings = async (enabled, message = '') => {
  try {
    const settingsRef = doc(db, APP_SETTINGS_PATH);
    await setDoc(settingsRef, {
      interviewBookingsEnabled: enabled,
      interviewBookingsMessage: message || '',
      lastUpdated: new Date()
    }, { merge: true });
    
    return true;
  } catch (error) {
    return false;
  }
}; 