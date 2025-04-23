import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import LoadingScreen from './LoadingScreen';

const Signup = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    // Redirect to login page since we're only using Google authentication
    navigate('/login', { replace: true });
  }, [navigate]);

  // Show a loading screen while redirecting
  return <LoadingScreen message="Redirecting to login..." />;
};

export default Signup; 