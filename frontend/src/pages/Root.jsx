import { Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';
import NavBar from '@components/NavBar';

function Root() {
  const location = useLocation();

  // Rutas donde NO debe aparecer el NavBar
  const hideNavBar = location.pathname === '/' || location.pathname === '/auth';

  return (
    <AuthProvider>
      {!hideNavBar && <NavBar />}
      <Outlet />
    </AuthProvider>
  );
}

export default Root;
