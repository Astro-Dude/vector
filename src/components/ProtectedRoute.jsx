import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, authChecked } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading || !authChecked) {
    return <LoadingScreen message="Verifying access..." />;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the protected content if authenticated
  console.log("User authenticated, rendering protected content");
  return children;
};

export default ProtectedRoute; 