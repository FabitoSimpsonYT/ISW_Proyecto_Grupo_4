// src/services/tipoEvento.service.js
import api from './api.service';

export const getTiposEventos = async () => {
  try {
    console.log('🔍 [tipoEvento.service] Llamando a /tipos-eventos...');
    const res = await api('/tipos-eventos');
    
    console.log('🔍 [tipoEvento.service] Respuesta completa:', res);
    console.log('🔍 [tipoEvento.service] Tipo de res:', typeof res);
    console.log('🔍 [tipoEvento.service] res.data:', res?.data);
    console.log('🔍 [tipoEvento.service] res.data.tipos:', res?.data?.tipos);
    
    // La respuesta viene como { message, data: { tipos: [...] }, status }
    // api() retorna todo el objeto, no solo .data
    let tipos = [];
    
    if (res && typeof res === 'object') {
      // Intentar extraer tipos de res.data.tipos (estructura del servidor)
      if (Array.isArray(res.data?.tipos)) {
        tipos = res.data.tipos;
        console.log('✅ [tipoEvento.service] Tipos extraídos de res.data.tipos:', tipos.length);
      } 
      // Fallback: si viene directamente en res.tipos
      else if (Array.isArray(res.tipos)) {
        tipos = res.tipos;
        console.log('✅ [tipoEvento.service] Tipos extraídos de res.tipos:', tipos.length);
      }
      // Fallback: si res es directamente un array
      else if (Array.isArray(res)) {
        tipos = res;
        console.log('✅ [tipoEvento.service] res es un array directo:', tipos.length);
      } else {
        console.warn('⚠️ [tipoEvento.service] No se encontró array de tipos en:', res);
      }
    }
    
    return tipos;
  } catch (error) {
    console.error('❌ Error en getTiposEventos:', error);
    return [];
  }
};

export const crearTipoEvento = async (tipo) => {
  return await api('/tipos-eventos', {
    method: 'POST',
    body: JSON.stringify(tipo)
  });
};

export const actualizarTipoEvento = async (id, tipo) => {
  return await api(`/tipos-eventos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tipo)
  });
};

export const eliminarTipoEvento = async (id) => {
  return await api(`/tipos-eventos/${id}`, { method: 'DELETE' });
};