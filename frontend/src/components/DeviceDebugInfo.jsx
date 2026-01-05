import { useDevice } from '../context/DeviceContext';

/**
 * Componente de debug que muestra la información del dispositivo
 * Mostrar en development, ocultar en production
 */
export const DeviceDebugInfo = () => {
  const device = useDevice();
  const isDev = process.env.NODE_ENV === 'development';

  // Solo mostrar en development
  if (!isDev) {
    return null;
  }

  const getBgColor = () => {
    if (device.isMobile) return 'bg-green-100';
    if (device.isTablet) return 'bg-blue-100';
    return 'bg-purple-100';
  };

  const getTextColor = () => {
    if (device.isMobile) return 'text-green-900';
    if (device.isTablet) return 'text-blue-900';
    return 'text-purple-900';
  };

  return (
    <div
      className={`fixed bottom-4 right-4 p-3 rounded-lg text-xs font-mono z-50 shadow-lg ${getBgColor()} ${getTextColor()}`}
    >
      <div className="font-bold mb-1">Device Info (Dev)</div>
      <div>Type: {device.type}</div>
      <div>OS: {device.os || 'Unknown'}</div>
      <div>Mobile: {device.isMobile ? '✓' : '✗'}</div>
      <div>Tablet: {device.isTablet ? '✓' : '✗'}</div>
      <div>Desktop: {device.isDesktop ? '✓' : '✗'}</div>
    </div>
  );
};
