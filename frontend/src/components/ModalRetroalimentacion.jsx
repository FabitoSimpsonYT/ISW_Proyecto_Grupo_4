import React from 'react';
import { RetroalimentacionChat } from './RetroalimentacionChat';
import './ModalRetroalimentacion.css';

export const ModalRetroalimentacion = ({ 
  isOpen, 
  onClose,
  evaluacion,
  alumnoRut,
  ramoId,
  alumnoNombre,
  alumnoEmail,
  profesorNombre,
  profesorEmail,
  evaluacionIntegradoraId = null,
  isProfesor = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-retroalimentacion-overlay" onClick={onClose}>
      <div className="modal-retroalimentacion" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        
        <RetroalimentacionChat
          evaluacion={evaluacion}
          alumnoRut={alumnoRut}
          ramoId={ramoId}
          alumnoNombre={alumnoNombre}
          alumnoEmail={alumnoEmail}
          profesorNombre={profesorNombre}
          profesorEmail={profesorEmail}
          evaluacionIntegradoraId={evaluacionIntegradoraId}
          isProfesor={isProfesor}
        />
      </div>
    </div>
  );
};
