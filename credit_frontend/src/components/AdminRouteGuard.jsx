import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Component to protect routes from admin users
 * If an admin user tries to access a non-admin page, they will be redirected to the admin dashboard
 */
const AdminRouteGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Skip check if already on admin dashboard or login page
    if (location.pathname === '/admin-dashboard' || location.pathname === '/' || location.pathname === '/register') {
      return;
    }
    
    // Check if user is admin
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.is_admin) {
      console.log('Admin user detected on non-admin page, redirecting to admin dashboard');
      navigate('/admin-dashboard');
    }
  }, [location.pathname, navigate]);
  
  // This component doesn't render anything
  return null;
};

export default AdminRouteGuard;
