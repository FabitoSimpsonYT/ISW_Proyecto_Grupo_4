import React, { useEffect, useState } from 'react';
import './NotificacionRetroalimentacion.css';

export const NotificacionRetroalimentacion = ({ 
  notificacion, 
  onClose, 
  onClick,
  tipo = 'profesor' // 'profesor' o 'alumno'
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  const esProfesor = tipo === 'profesor';
  const mensaje = esProfesor
    ? `El alumno te envió un mensaje`
    : `El profesor te envió un mensaje`;

  return (
    <div 
      className={`notificacion-retroalimentacion ${tipo}`}
      onClick={onClick}
    >
      <div className="notificacion-icono">💬</div>
      <div className="notificacion-contenido">
        <p className="notificacion-titulo">{mensaje}</p>
        <p className="notificacion-evaluacion">
          {notificacion?.evaluacion?.titulo || 'Evaluación'}
        </p>
        <p className="notificacion-ramo">
          {notificacion?.ramo?.nombre || 'Ramo'}
        </p>
      </div>
      <button 
        className="notificacion-cerrar"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
          onClose?.();
        }}
      >
        ✕
      </button>
    </div>
  );
};
