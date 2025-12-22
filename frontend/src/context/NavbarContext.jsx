import { createContext, useContext, useState, useEffect } from 'react';

const NavbarContext = createContext();

export function NavbarProvider({ children }) {
  const [isNavbarOpen, setIsNavbarOpen] = useState(() => {
    const saved = localStorage.getItem('navbarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('navbarOpen', JSON.stringify(isNavbarOpen));
  }, [isNavbarOpen]);

  return (
    <NavbarContext.Provider value={{ isNavbarOpen, setIsNavbarOpen }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('useNavbar debe usarse dentro de NavbarProvider');
  }
  return context;
}
