# 📱 Guía de Detección de Dispositivos

Esta guía te ayudará a implementar detección de dispositivos en tu aplicación para mostrar versiones móviles, tablets o desktop según sea necesario.

## 🔧 Configuración

La detección ya está configurada en tu `App.jsx` a través del `DeviceProvider`. No necesitas hacer nada adicional en la raíz de tu aplicación.

## 📖 Cómo Usar

### 1. Importar el hook en tu componente

```jsx
import { useDevice } from '../context/DeviceContext';
```

### 2. Usar el hook en tu componente

```jsx
function MiComponente() {
  const device = useDevice();
  
  return (
    <>
      {device.isDesktop && <DesktopLayout />}
      {device.isMobile && <MobileLayout />}
      {device.isTablet && <TabletLayout />}
    </>
  );
}
```

## 📊 Propiedades disponibles

### `device.type`
- Retorna: `'desktop' | 'mobile' | 'tablet'`
- Descripción: Tipo de dispositivo detectado

### `device.os`
- Retorna: `'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'ipados' | null`
- Descripción: Sistema operativo del dispositivo

### `device.isMobile`
- Retorna: `boolean`
- Descripción: `true` si es un dispositivo móvil (iOS, Android)

### `device.isDesktop`
- Retorna: `boolean`
- Descripción: `true` si es un ordenador de escritorio (Windows, macOS, Linux)

### `device.isTablet`
- Retorna: `boolean`
- Descripción: `true` si es una tablet (iPad, tablets Android con pantalla grande)

## 🎯 Ejemplos de Uso

### Ejemplo 1: Mostrar diferentes componentes

```jsx
import { useDevice } from '../context/DeviceContext';

function Dashboard() {
  const device = useDevice();

  if (device.isMobile) {
    return <MobileDashboard />;
  }

  if (device.isTablet) {
    return <TabletDashboard />;
  }

  return <DesktopDashboard />;
}
```

### Ejemplo 2: Aplicar estilos condicionales

```jsx
function Navigation() {
  const device = useDevice();

  return (
    <nav className={device.isDesktop ? 'flex justify-between' : 'flex-col'}>
      {/* Contenido */}
    </nav>
  );
}
```

### Ejemplo 3: Validar sistema operativo específico

```jsx
function App() {
  const device = useDevice();

  // Hacer algo específico para iOS
  if (device.os === 'ios') {
    // Aplicar workarounds específicos de iOS
  }

  // Hacer algo específico para Android
  if (device.os === 'android') {
    // Optimizaciones para Android
  }

  return <YourApp />;
}
```

### Ejemplo 4: Ocultar elementos basado en dispositivo

```jsx
function Toolbar() {
  const device = useDevice();

  return (
    <div className="toolbar">
      <button>Inicio</button>
      
      {device.isDesktop && (
        <>
          <button>Configuración</button>
          <button>Ayuda</button>
          <button>Acerca de</button>
        </>
      )}

      {device.isMobile && (
        <button>Menú ☰</button>
      )}
    </div>
  );
}
```

## 📱 Detecta Los Siguientes Sistemas

### Móviles
- ✅ iOS (iPhone)
- ✅ Android
- ✅ iPadOS (iPad)
- ✅ Chrome en iOS
- ✅ Firefox en iOS

### Desktop
- ✅ Windows
- ✅ macOS
- ✅ Linux

## 🔍 Cómo Funciona

El hook `useDeviceDetection` analiza el `navigator.userAgent` del navegador para identificar:

1. **Sistema Operativo**: Basado en palabras clave en el user agent
2. **Tipo de Dispositivo**: Determinado por el SO y el tamaño de la pantalla
3. **Cambios de Tamaño**: Se actualiza cuando se redimensiona la ventana

### Criterios de Clasificación

- **Móvil**: iOS o Android con pantalla < 768px
- **Tablet**: iOS/Android/iPadOS con pantalla >= 768px
- **Desktop**: Windows, macOS, Linux

## 💡 Consejos

1. **Usa breakpoints consistentes**: Los breakpoints están definidos en `deviceConstants.js`
2. **Prueba en dispositivos reales**: La detección basada en user agent no es 100% precisa en todos los casos
3. **Combina con media queries**: Usa ambos para máxima compatibilidad
4. **Manejo de errores**: Siempre tiene un valor por defecto (desktop)

## 🐛 Resolución de Problemas

### El dispositivo siempre detecta como desktop
- Verifica que la cadena del user agent sea correcta (abre DevTools en F12)
- Algunos navegadores pueden modificar el user agent

### iPad se detecta como desktop en lugar de tablet
- Verifica el ancho de la pantalla (media query)
- En iPadOS 13+, el user agent puede variar

### Los cambios de tamaño no se actualizan
- Asegúrate de que el hook `useDeviceDetection` está siendo usado
- Verifica que el listener de resize esté activo

## 📚 Archivos Relacionados

- 📄 `hooks/useDeviceDetection.js` - Hook principal
- 📄 `context/DeviceContext.jsx` - Contexto React
- 📄 `utils/deviceConstants.js` - Constantes y breakpoints
- 📄 `components/DeviceDetectionExample.jsx` - Ejemplos de uso
- 📄 `App.jsx` - Configuración del DeviceProvider

---

¿Preguntas? Consulta los ejemplos en `DeviceDetectionExample.jsx` o el archivo de constantes en `deviceConstants.js`.
