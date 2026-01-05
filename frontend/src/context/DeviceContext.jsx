import { createContext, useContext, useState, useEffect } from 'react';
import { DEVICE_TYPES, OS_TYPES, DEVICE_BREAKPOINTS } from '../utils/deviceConstants';

const DeviceContext = createContext();

export function DeviceProvider({ children }) {
  const [device, setDevice] = useState({
    type: DEVICE_TYPES.DESKTOP,
    os: OS_TYPES.WINDOWS,
    isMobile: false,
    isDesktop: true,
    isTablet: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const detectDevice = () => {
      // Detectar tamaño de pantalla
      const width = window.innerWidth;
      const height = window.innerHeight;

      let type = DEVICE_TYPES.DESKTOP;
      if (width <= DEVICE_BREAKPOINTS.mobile) {
        type = DEVICE_TYPES.MOBILE;
      } else if (width <= DEVICE_BREAKPOINTS.tablet) {
        type = DEVICE_TYPES.TABLET;
      }

      // Detectar OS
      let os = OS_TYPES.WINDOWS;
      const ua = navigator.userAgent.toLowerCase();

      if (ua.includes('win')) {
        os = OS_TYPES.WINDOWS;
      } else if (ua.includes('mac')) {
        if (ua.includes('ipad')) {
          os = OS_TYPES.IPADOS;
        } else if (ua.includes('iphone') || ua.includes('ipod')) {
          os = OS_TYPES.IOS;
        } else {
          os = OS_TYPES.MACOS;
        }
      } else if (ua.includes('linux')) {
        if (ua.includes('android')) {
          os = OS_TYPES.ANDROID;
        } else {
          os = OS_TYPES.LINUX;
        }
      } else if (ua.includes('android')) {
        os = OS_TYPES.ANDROID;
      } else if (ua.includes('iphone') || ua.includes('ipod')) {
        os = OS_TYPES.IOS;
      } else if (ua.includes('ipad')) {
        os = OS_TYPES.IPADOS;
      }

      setDevice({
        type,
        os,
        isMobile: type === DEVICE_TYPES.MOBILE,
        isDesktop: type === DEVICE_TYPES.DESKTOP,
        isTablet: type === DEVICE_TYPES.TABLET,
        width,
        height,
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
    };
  }, []);

  return (
    <DeviceContext.Provider value={device}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice debe ser usado dentro de DeviceProvider');
  }
  return context;
}
