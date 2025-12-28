import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerNoVistos } from '../services/retroalimentacion.service';
import './BotonRetroalimentacion.css';

export const BotonRetroalimentacion = ({ 
  codigoRamo, 
  alumnoRut, 
  evaluacionId, 
  evaluacionIntegradoraId,
  onClick,
  label = "Chat",
  variante = "evaluar" // "evaluar" o "mis-notas"
}) => {
  const navigate = useNavigate();
  const [tieneNoVistos, setTieneNoVistos] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificarNoVistos = async () => {
      try {
        setCargando(true);
        const data = await obtenerNoVistos(codigoRamo);
        
        // Verificar si hay mensajes no vistos para este alumno y evaluación
        const tieneNoVisto = data.mensajes?.some(m => 
          m.alumnoRut === alumnoRut && 
          ((evaluacionId && m.evaluacionId === evaluacionId) || 
           (evaluacionIntegradoraId && m.evaluacionIntegradoraId === evaluacionIntegradoraId))
        ) || false;

        setTieneNoVistos(tieneNoVisto);
      } catch (error) {
        console.error('Error verificando mensajes no vistos:', error);
      } finally {
        setCargando(false);
      }
    };

    if (codigoRamo && alumnoRut) {
      verificarNoVistos();
      
      // Verificar cada 5 segundos
      const interval = setInterval(verificarNoVistos, 5000);
      return () => clearInterval(interval);
    }
  }, [codigoRamo, alumnoRut, evaluacionId, evaluacionIntegradoraId]);

  return (
    <button
      onClick={() => {
        // Validar codigoRamo
        if (!codigoRamo || codigoRamo === 'undefined') {
          console.warn('codigoRamo no disponible:', codigoRamo);
          return;
        }

        console.log('Botón clicked:', { codigoRamo, alumnoRut, evaluacionId, evaluacionIntegradoraId });
        // Redirigir a la página de retroalimentación
        if (evaluacionId) {
          console.log('Navigating to:', `/retroalimentacion/${codigoRamo}/${alumnoRut}/${evaluacionId}`);
          navigate(`/retroalimentacion/${codigoRamo}/${alumnoRut}/${evaluacionId}`);
        } else if (evaluacionIntegradoraId) {
          console.log('Navigating to:', `/retroalimentacion/${codigoRamo}/${alumnoRut}/integradora/${evaluacionIntegradoraId}`);
          navigate(`/retroalimentacion/${codigoRamo}/${alumnoRut}/integradora/${evaluacionIntegradoraId}`);
        } else {
          console.warn('No evaluacionId o evaluacionIntegradoraId provided');
        }
        // Llamar al onClick adicional si existe
        if (onClick) onClick();
      }}
      className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition relative"
      title={tieneNoVistos ? 'Tienes mensajes sin leer' : 'Ver retroalimentación'}
    >
      <span className="mr-2">💬</span>
      <span>{label}</span>
      {tieneNoVistos && (
        <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full border-2 border-white shadow-lg">
          •
        </span>
      )}
    </button>
  );
};
