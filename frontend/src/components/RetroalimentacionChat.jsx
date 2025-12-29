import React, { useState, useEffect, useRef } from 'react';
import { useRetroalimentacion } from '../hooks/useRetroalimentacion';
import { useAuth } from '../context/AuthContext';
import { getPautaByEvaluacion, getPautaByEvaluacionIntegradora } from '../services/pautaEvaluada.service';
import './RetroalimentacionChat.css';

export const RetroalimentacionChat = ({ 
  evaluacion, 
  alumnoRut, 
  profesorRut = null,
  ramoId, 
  ramoNombre = '',
  alumnoNombre,
  alumnoEmail,
  profesorNombre,
  profesorEmail,
  evaluacionIntegradoraId = null,
  isProfesor = false,
}) => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pautaEvaluada, setPautaEvaluada] = useState(null);
  const [cargandoPauta, setCargandoPauta] = useState(false);
  const messagesEndRef = useRef(null);
  
  const {
    mensajes,
    cargando,
    error,
    tieneNoVistos,
    otroUsuarioConectado,
    enviarMensaje,
    marcarVistos,
  } = useRetroalimentacion(ramoId, alumnoRut, evaluacion?.id, evaluacionIntegradoraId, user);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Marcar como vistos cuando se abre el chat
  useEffect(() => {
    if (tieneNoVistos && !isProfesor) {
      marcarVistos();
    }
  }, []);

  // Cargar pauta evaluada
  useEffect(() => {
    const cargarPauta = async () => {
      try {
        setCargandoPauta(true);
        let pauta = null;
        
        if (evaluacionIntegradoraId) {
          pauta = await getPautaByEvaluacionIntegradora(evaluacionIntegradoraId);
        } else if (evaluacion?.id) {
          pauta = await getPautaByEvaluacion(evaluacion.id);
        }
        
        setPautaEvaluada(pauta);
      } catch (error) {
        console.error('Error cargando pauta:', error);
      } finally {
        setCargandoPauta(false);
      }
    };

    if (alumnoRut && (evaluacion?.id || evaluacionIntegradoraId)) {
      cargarPauta();
    }
  }, [alumnoRut, evaluacion?.id, evaluacionIntegradoraId]);

  const handleEnviar = async () => {
    console.log('💬 [Chat] handleEnviar llamado con:', inputValue);
    
    if (!inputValue.trim()) {
      console.warn('⚠️ [Chat] Mensaje vacío, cancelando');
      return;
    }

    setEnviando(true);
    try {
      console.log('📤 [Chat] Llamando enviarMensaje con:', inputValue.trim());
      enviarMensaje(inputValue.trim());
      setInputValue('');
    } catch (err) {
      console.error('❌ [Chat] Error enviando mensaje:', err);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  if (error && !mensajes.length) {
    return (
      <div className="retroalimentacion-wrapper">
        <div className="retroalimentacion-error">
          <p>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="retroalimentacion-wrapper">
      {/* Header */}
      <div className="retroalimentacion-header">
        <div className="retroalimentacion-header-left">
          <h2>
            Chat de Retroalimentación
          </h2>
          <div className="retroalimentacion-title-info">
            {isProfesor 
              ? `Comunicación con ${alumnoNombre}` 
              : `Comunicación con tu profesor`}
          </div>
        </div>
        <div className="status-badge">
          <span className={`status-dot ${otroUsuarioConectado ? 'conectado' : 'desconectado'}`}></span>
          {otroUsuarioConectado ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      {/* Main Content */}
      <div className="retroalimentacion-content">
        {/* Sidebar - Info */}
        <div className="retroalimentacion-sidebar">
          <div>
            <div className="sidebar-section-title">
              {isProfesor ? 'Alumno' : 'Profesor'}
            </div>
            <div className="info-card">
              <strong>
                {isProfesor ? alumnoNombre : profesorNombre}
              </strong>
              <p>
                <label>RUT:</label>
                {isProfesor ? alumnoRut : profesorRut}
              </p>
              <p>
                <label>Email:</label>
                {isProfesor ? alumnoEmail : profesorEmail}
              </p>
            </div>
          </div>

          <div>
            <div className="sidebar-section-title">{evaluacion?.nombre || 'Evaluación'}</div>
            <div className="info-card">
              {ramoNombre && (
                <p>
                  <label>Ramo:</label>
                  {ramoNombre}
                </p>
              )}
            </div>
          </div>

          {pautaEvaluada && (
            <div>
              <div className="sidebar-section-title">Pauta Evaluada</div>
              <div className="info-card">
                {cargandoPauta ? (
                  <p style={{ fontSize: '0.9em', color: '#666' }}>Cargando pauta...</p>
                ) : (
                  <>
                    <p>
                      <label>Estado:</label>
                      <span style={{ color: pautaEvaluada.calificacion ? '#27ae60' : '#f39c12' }}>
                        {pautaEvaluada.calificacion ? '✓ Calificada' : 'Pendiente'}
                      </span>
                    </p>
                    {pautaEvaluada.calificacion && (
                      <p>
                        <label>Calificación:</label>
                        <strong>{pautaEvaluada.calificacion}</strong>
                      </p>
                    )}
                    <button
                      className="boton-ver-pauta"
                      onClick={() => {
                        // Aquí puedes navegar a la pauta evaluada o abrirla
                        window.open(`/pauta-evaluada/${evaluacion?.id}/${alumnoRut}`, '_blank');
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                      }}
                    >
                      Ver Pauta Completa
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="retroalimentacion-main">
          {/* Messages */}
          <div className="retroalimentacion-messages">
            {cargando ? (
              <div className="retroalimentacion-loading">
                <div className="spinner"></div>
                <p>Cargando retroalimentación...</p>
              </div>
            ) : mensajes.length === 0 ? (
              <div className="sin-mensajes">
                <div className="sin-mensajes-icon">💬</div>
                <p>No hay mensajes aún.</p>
                <p>¡Inicia la conversación!</p>
              </div>
            ) : (
              mensajes.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`mensaje ${msg.rutEmisor === user?.rut ? 'enviado' : 'recibido'}`}
                >
                  <div className="mensaje-contenido">
                    <p>{msg.mensaje}</p>
                    <span className="mensaje-hora">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {msg.rutEmisor === user?.rut && (
                        <span>
                          {msg.visto ? ' ✓✓' : ' ✓'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="retroalimentacion-input">
            <div className="retroalimentacion-input-field">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                disabled={enviando}
                rows="2"
              />
            </div>
            <button
              onClick={handleEnviar}
              disabled={enviando || !inputValue.trim()}
              className="boton-enviar"
            >
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
