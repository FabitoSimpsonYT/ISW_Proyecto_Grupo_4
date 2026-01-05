import { useState, useEffect } from 'react';

export const useDeviceDetection = () => {
  const [device, setDevice] = useState({
    type: 'desktop', // 'desktop', 'mobile', 'tablet'
    os: null, // 'windows', 'macos', 'linux', 'ios', 'android', 'ipados'
    isMobile: false,
    isDesktop: false,
    isTablet: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      let detectedOS = null;
      let deviceType = 'desktop';
      let isMobile = false;
      let isTablet = false;

      // Detectar sistema operativo
      if (userAgent.includes('win')) {
        detectedOS = 'windows';
      } else if (userAgent.includes('mac')) {
        detectedOS = 'macos';
      } else if (userAgent.includes('linux')) {
        detectedOS = 'linux';
      } else if (userAgent.includes('android')) {
        detectedOS = 'android';
        isMobile = true;
      } else if (userAgent.includes('iphone')) {
        detectedOS = 'ios';
        isMobile = true;
      } else if (userAgent.includes('ipad')) {
        detectedOS = 'ipados';
        // iPad puede ser tablet o móvil según el contexto
        isTablet = true;
      } else if (userAgent.includes('crios') || userAgent.includes('fxios')) {
        // Chrome iOS o Firefox iOS
        detectedOS = 'ios';
        isMobile = true;
      }

      // Detectar si es tablet usando dimensiones de pantalla
      const isLargeScreen = window.innerWidth >= 768;
      
      // Si es Android o iOS con pantalla grande, podría ser tablet
      if (detectedOS === 'android' && isLargeScreen) {
        isTablet = true;
        deviceType = 'tablet';
      } else if ((detectedOS === 'ios' || detectedOS === 'ipados') && isLargeScreen) {
        isTablet = true;
        deviceType = 'tablet';
      } else if (isMobile) {
        deviceType = 'mobile';
      } else {
        // Es desktop
        deviceType = 'desktop';
      }

      setDevice({
        type: deviceType,
        os: detectedOS,
        isMobile,
        isDesktop: deviceType === 'desktop',
        isTablet,
      });

      console.log('Device detected:', {
        type: deviceType,
        os: detectedOS,
        userAgent: userAgent.substring(0, 100),
      });
    };

    detectDevice();

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
    };
  }, []);

  return device;
};
