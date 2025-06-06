import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page since we're only using Google authentication
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
};

export default ForgotPassword; 