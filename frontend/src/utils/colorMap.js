// src/utils/colorMap.js
// Mapa dinámico de colores para tipos de eventos basado en datos de la BD

// Mapa caché de colores para tipos de eventos
let dynamicColorMap = {};

// Función para actualizar el mapa dinámico (llamada cuando se cargan los tipos)
export const updateDynamicColorMap = (tiposEventos) => {
  dynamicColorMap = {};
  if (Array.isArray(tiposEventos)) {
    tiposEventos.forEach(tipo => {
      dynamicColorMap[tipo.nombre] = {
        bg: tipo.color || '#3b82f6',
        text: 'white',
        border: tipo.color || '#3b82f6',
        light: tipo.color ? tipo.color + '20' : '#eff6ff'
      };
    });
  }
  console.log('✅ Mapa de colores dinámico actualizado:', dynamicColorMap);
};

// Colores por defecto para tipos comunes
const defaultColorMap = {
  'Examen': { bg: '#ef4444', text: 'white', border: '#dc2626', light: '#fee2e2' },
  'Certamen': { bg: '#f97316', text: 'white', border: '#ea580c', light: '#ffedd5' },
  'Evaluación': { bg: '#3b82f6', text: 'white', border: '#2563eb', light: '#eff6ff' },
  'Quiz': { bg: '#8b5cf6', text: 'white', border: '#7c3aed', light: '#f5f3ff' },
  'Control': { bg: '#06b6d4', text: 'white', border: '#0891b2', light: '#ecf0f1' },
  'Tarea': { bg: '#10b981', text: 'white', border: '#059669', light: '#ecfdf5' },
  'Prueba': { bg: '#ec4899', text: 'white', border: '#be185d', light: '#fce7f3' },
  'Proyecto': { bg: '#6366f1', text: 'white', border: '#4f46e5', light: '#eef2ff' },
};

// Función para obtener color basado en tipo de evento
export const getColorByType = (tipoEventoNombre) => {
  if (!tipoEventoNombre) {
    return defaultColorMap['Evaluación']; // Color por defecto
  }

  // Convertir a string si es objeto con propiedad nombre
  const tipoStr = typeof tipoEventoNombre === 'object' && tipoEventoNombre.nombre 
    ? tipoEventoNombre.nombre 
    : String(tipoEventoNombre).trim();
  
  // Búsqueda exacta en el mapa dinámico (case-insensitive)
  const tipoLower = tipoStr.toLowerCase();
  
  for (const [key, value] of Object.entries(dynamicColorMap)) {
    if (key.toLowerCase() === tipoLower) {
      return value;
    }
  }

  // Búsqueda parcial en el mapa dinámico
  for (const [key, value] of Object.entries(dynamicColorMap)) {
    if (key.toLowerCase().includes(tipoLower) || tipoLower.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Búsqueda exacta en colores por defecto (case-insensitive)
  for (const [key, value] of Object.entries(defaultColorMap)) {
    if (key.toLowerCase() === tipoLower) {
      return value;
    }
  }

  // Búsqueda parcial en colores por defecto
  for (const [key, value] of Object.entries(defaultColorMap)) {
    if (key.toLowerCase().includes(tipoLower) || tipoLower.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Si no coincide, generar un color basado en hash del nombre
  return generateColorFromString(tipoStr);
};

// Generar color único basado en string
const generateColorFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }

  const colors = [
    { bg: '#ef4444', text: 'white', border: '#dc2626', light: '#fee2e2' },
    { bg: '#f97316', text: 'white', border: '#ea580c', light: '#ffedd5' },
    { bg: '#3b82f6', text: 'white', border: '#2563eb', light: '#eff6ff' },
    { bg: '#8b5cf6', text: 'white', border: '#7c3aed', light: '#f5f3ff' },
    { bg: '#06b6d4', text: 'white', border: '#0891b2', light: '#ecf0f1' },
    { bg: '#10b981', text: 'white', border: '#059669', light: '#ecfdf5' },
    { bg: '#ec4899', text: 'white', border: '#be185d', light: '#fce7f3' },
    { bg: '#6366f1', text: 'white', border: '#4f46e5', light: '#eef2ff' },
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Obtener lista de todos los tipos con sus colores para la leyenda
export const getColorLegend = () => {
  return Object.entries(dynamicColorMap).map(([tipo, color]) => ({
    nombre: tipo,
    ...color,
  }));
};

export default defaultColorMap;
