import { useDevice } from '../context/DeviceContext';

/**
 * Componente de ejemplo mostrando cómo usar la detección de dispositivos
 */
export const DeviceDetectionExample = () => {
  const device = useDevice();

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-bold mb-2">Información del Dispositivo (Ejemplo)</h3>
      <ul className="text-sm space-y-1">
        <li><strong>Tipo:</strong> {device.type}</li>
        <li><strong>OS:</strong> {device.os || 'Desconocido'}</li>
        <li><strong>Es Móvil:</strong> {device.isMobile ? 'Sí' : 'No'}</li>
        <li><strong>Es Desktop:</strong> {device.isDesktop ? 'Sí' : 'No'}</li>
        <li><strong>Es Tablet:</strong> {device.isTablet ? 'Sí' : 'No'}</li>
      </ul>
    </div>
  );
};

/**
 * Ejemplo de Layout receptivo usando la detección
 */
export const ResponsiveLayoutExample = () => {
  const device = useDevice();

  if (device.isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
        <div className="max-w-md mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Versión Móvil</h1>
          <p>Contenido optimizado para móviles (Android, iOS)</p>
        </div>
      </div>
    );
  }

  if (device.isTablet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-2xl mx-auto p-4">
          <h1 className="text-3xl font-bold mb-4">Versión Tablet</h1>
          <p>Contenido optimizado para tablets (iPad, tablets Android)</p>
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex">
        <aside className="w-64 bg-white shadow">
          <p className="p-4">Sidebar de Desktop</p>
        </aside>
        <main className="flex-1 p-8">
          <h1 className="text-4xl font-bold mb-4">Versión Desktop</h1>
          <p>Contenido de escritorio completo (Windows, macOS, Linux)</p>
        </main>
      </div>
    </div>
  );
};
