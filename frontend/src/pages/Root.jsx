import { Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';
import { NavbarProvider } from '@context/NavbarContext';
import NavBar from '@components/NavBar';

function Root() {
  const location = useLocation();

  // Rutas donde NO debe aparecer el NavBar
  const hideNavBar = location.pathname === '/' || location.pathname === '/auth';

  return (
    <AuthProvider>
      <NavbarProvider>
        {!hideNavBar && <NavBar />}
        <Outlet />
      </NavbarProvider>
    </AuthProvider>
  );
}

export default Root;
