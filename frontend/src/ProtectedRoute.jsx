import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth(); // Assume isLoading is provided by authContext
  const navigate = useNavigate();
  

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/callback');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>; // Or any loading spinner component
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}

export default ProtectedRoute;
