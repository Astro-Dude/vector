import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const ProfileSettings = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Load current profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDisplayName(userData.displayName || currentUser.displayName || '');
            setPhone(userData.phoneNumber || '');
          } else {
            setDisplayName(currentUser.displayName || '');
          }
        } catch (error) {
          console.error("Error loading profile:", error);
          setMessage("Failed to load profile data.");
        }
      }
    };
    
    loadProfile();
  }, [currentUser]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      // Validate phone number
      if (phone && !/^[0-9]{10}$/.test(phone)) {
        setMessage("Please enter a valid 10-digit phone number");
        setIsLoading(false);
        return;
      }
      
      // Update user profile in Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        displayName,
        phoneNumber: phone,
        updatedAt: new Date()
      }, { merge: true });
      
      setMessage("Profile updated successfully!");
      
      // Close the modal after a short delay
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Settings</h2>
      
      {message && (
        <div className={`p-3 rounded-md mb-4 ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="10-digit mobile number"
          />
          <p className="mt-1 text-xs text-gray-500">
            Used for interview scheduling and important notifications.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings; 