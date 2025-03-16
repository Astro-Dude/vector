import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, authChecked } = useAuth();
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(false);
  
  // Only show loader after a short delay to prevent flashing
  useEffect(() => {
    // Only show loader if we're still loading after 300ms
    const loaderTimer = setTimeout(() => {
      if (loading || !authChecked) {
        setShowLoader(true);
      }
    }, 300);
    
    return () => clearTimeout(loaderTimer);
  }, [loading, authChecked]);
  
  // If auth is still being checked, render nothing briefly
  // This prevents screen flashing between states
  if ((loading || !authChecked) && !showLoader) {
    return null;
  }
  
  // If still loading after delay, show a minimal loader
  if ((loading || !authChecked) && showLoader) {
    return <LoadingScreen message="Verifying access..." />;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the protected content if authenticated
  return children;
};

export default ProtectedRoute; 