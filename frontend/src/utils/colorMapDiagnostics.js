// src/utils/colorMapDiagnostics.js
// Herramienta de diagnóstico para verificar la sincronización de colores

export const runColorDiagnostics = (tiposEventos = []) => {
  console.log('🔍 === DIAGNÓSTICO DE MAPA DE COLORES ===');
  console.log('');
  
  // 1. Verificar que se cargaron tipos
  console.log('1️⃣ TIPOS DE EVENTOS CARGADOS:');
  if (!Array.isArray(tiposEventos)) {
    console.error('❌ tiposEventos no es un array:', typeof tiposEventos);
    return false;
  }
  
  if (tiposEventos.length === 0) {
    console.warn('⚠️ No hay tipos de eventos cargados');
    return false;
  }
  
  console.log(`✅ Se cargaron ${tiposEventos.length} tipos`);
  tiposEventos.forEach((tipo, idx) => {
    console.log(`  ${idx + 1}. ${tipo.nombre || 'SIN NOMBRE'} → Color: ${tipo.color || 'SIN COLOR'}`);
  });
  console.log('');
  
  // 2. Verificar estructura del colorMap
  console.log('2️⃣ ESTRUCTURA DEL COLOR MAP:');
  try {
    const { updateDynamicColorMap, getColorByType } = require('./colorMap.js');
    
    // Actualizar el mapa
    updateDynamicColorMap(tiposEventos);
    console.log('✅ updateDynamicColorMap() ejecutada correctamente');
    
    // Probar getColorByType
    console.log('');
    console.log('3️⃣ PRUEBA DE getColorByType():');
    tiposEventos.forEach(tipo => {
      const color = getColorByType(tipo.nombre);
      const match = color.bg === tipo.color ? '✅' : '❌';
      console.log(`  ${match} ${tipo.nombre}: ${color.bg} (esperado: ${tipo.color})`);
    });
  } catch (err) {
    console.error('❌ Error al ejecutar diagnóstico:', err);
    return false;
  }
  
  console.log('');
  console.log('✅ === DIAGNÓSTICO COMPLETADO ===');
  return true;
};

// Exportar para uso en desarrollo
if (typeof window !== 'undefined') {
  window.runColorDiagnostics = runColorDiagnostics;
}
