import { useState, useEffect } from 'react';
import { getAppSettings, updateInterviewBookingSettings } from '../services/settingsService';

const InterviewSettings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    interviewBookingsEnabled: true,
    interviewBookingsMessage: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      const appSettings = await getAppSettings();
      setSettings(appSettings);
      setLoading(false);
    };
    
    loadSettings();
  }, []);
  
  const handleToggleBookings = async (enabled) => {
    setIsSaving(true);
    
    await updateInterviewBookingSettings(
      enabled, 
      settings.interviewBookingsMessage
    );
    
    setSettings({
      ...settings,
      interviewBookingsEnabled: enabled
    });
    
    setIsSaving(false);
  };
  
  const handleUpdateMessage = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    await updateInterviewBookingSettings(
      settings.interviewBookingsEnabled,
      settings.interviewBookingsMessage
    );
    
    setIsSaving(false);
    alert('Settings updated successfully!');
  };
  
  if (loading) {
    return <div>Loading settings...</div>;
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Interview Booking Settings</h2>
      
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-medium text-gray-900">Interview Bookings</h3>
            <p className="text-sm text-gray-500">
              Enable or disable the ability for users to book mock interviews
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleToggleBookings(!settings.interviewBookingsEnabled)}
              disabled={isSaving}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                settings.interviewBookingsEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className="sr-only">Toggle interview bookings</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  settings.interviewBookingsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <form onSubmit={handleUpdateMessage}>
          <div className="mb-4">
            <label htmlFor="bookingMessage" className="block text-sm font-medium text-gray-700">
              Message when bookings are disabled
            </label>
            <textarea
              id="bookingMessage"
              name="bookingMessage"
              rows="3"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
              placeholder="Due to high demand, interview bookings are temporarily unavailable."
              value={settings.interviewBookingsMessage}
              onChange={(e) => setSettings({...settings, interviewBookingsMessage: e.target.value})}
            />
            <p className="mt-1 text-xs text-gray-500">
              This message will be shown to users when interview bookings are disabled.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSaving ? 'Saving...' : 'Save Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewSettings; 
  const forceUpdateSettings = async () => {
    setIsSaving(true);
    setUpdateStatus({ message: '', isError: false });
    
    try {
      // Force a clean update
      const settings = await getAppSettings();
      const enabled = settings.interviewBookingsEnabled === true;
      const message = settings.interviewBookingsMessage || '';
      
      console.log("Force updating settings to:", { enabled, message });
      
      // Clear document first (optional but helps with stubborn updates)
      const settingsRef = doc(db, 'publicData/appSettings');
      await setDoc(settingsRef, {
        interviewBookingsEnabled: enabled,
        interviewBookingsMessage: message,
        lastUpdated: new Date(),
        forceUpdate: Math.random() // Add random value to force update
      });
      
      setUpdateStatus({ 
        message: `Settings forcefully updated. Bookings are now ${enabled ? 'ENABLED' : 'DISABLED'}.`, 
        isError: false 
      });
      
      // Verify the update
      setTimeout(async () => {
        const verification = await getAppSettings();
        console.log("Verification check:", verification);
        
        if (verification.interviewBookingsEnabled !== enabled) {
          setUpdateStatus({ 
            message: "WARNING: Settings may not have updated correctly. Please check the database directly.", 
            isError: true 
          });
        }
      }, 1000);
    } catch (error) {
      console.error("Force update failed:", error);
      setUpdateStatus({ 
        message: `Error: ${error.message}`, 
        isError: true 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm("This will completely reset the settings document. Continue?")) {
      return;
    }
    
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'publicData/appSettings');
      
      // First delete the document completely
      await deleteDoc(settingsRef);
      console.log("Settings document deleted");
      
      // Then create it with the desired state
      await setDoc(settingsRef, {
        bookingsStatus: settings.interviewBookingsEnabled ? "ENABLED" : "DISABLED",
        statusMessage: settings.interviewBookingsMessage || '',
        lastUpdated: new Date()
      });
      
      alert("Settings document was completely reset with status: " + 
            (settings.interviewBookingsEnabled ? "ENABLED" : "DISABLED"));
            
      // Refresh the page to ensure everything is clean
      window.location.reload();
    } catch (error) {
      console.error("Error resetting settings:", error);
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const forceFixSettings = async () => {
    if (!confirm("⚠️ EMERGENCY FIX: This will reset the settings document structure. Continue?")) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Get the current message
      const settingsRef = doc(db, 'systemConfig/appSettings');
      const currentSettings = await getDoc(settingsRef);
      const message = currentSettings.exists() ? 
                     (currentSettings.data().interviewBookingsMessage || '') : '';
      
      // Force the correct boolean value
      const newEnabled = settings.interviewBookingsEnabled;
      console.log("FORCING value to:", newEnabled);
      
      // Completely recreate the document with the proper structure
      await setDoc(settingsRef, {
        // Set the boolean field
        interviewBookingsEnabled: newEnabled,
        // Add a string backup
        bookingStatusString: newEnabled ? "ENABLED" : "DISABLED",
        interviewBookingsMessage: message,
        lastUpdated: new Date(),
        _debug_type: typeof newEnabled
      });
      
      alert(`Emergency fix complete! Status is now ${newEnabled ? "ENABLED" : "DISABLED"}`);
    } catch (error) {
      console.error("Error during emergency fix:", error);
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-4 flex justify-between">
      <button
        type="button"
        onClick={forceUpdateSettings}
        disabled={isSaving}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
      >
        {isSaving ? 'Updating...' : 'Force Update Settings'}
      </button>
      
      <button
        type="button"
        onClick={resetSettings}
        className="mt-8 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
      >
        Reset Settings Document
      </button>
      
      <button
        type="button"
        onClick={forceFixSettings}
        className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800"
      >
        🚨 Emergency Fix
      </button>
      
      {updateStatus.message && (
        <div className={`px-4 py-2 rounded-md ${updateStatus.isError ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {updateStatus.message}
        </div>
      )}
    </div>
  );
};

export default InterviewSettings; 