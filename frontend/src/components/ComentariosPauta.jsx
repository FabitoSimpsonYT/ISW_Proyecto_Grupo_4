import React, { useEffect, useState, useCallback, useRef } from 'react';
import { obtenerComentariosPauta, crearComentarioPauta, eliminarComentarioPauta } from '../services/comentarioPauta.service';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket.service';

const formatFechaHora = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min} · ${dd}-${mm}-${yyyy}`;
};

const roleStyling = {
  admin: {
    name: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    label: '👔 Admin',
  },
  profesor: {
    name: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    label: '👨‍🏫 Profesor',
  },
  jefecarrera: {
    name: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
    label: '📋 Jefe de Carrera',
  },
  alumno: {
    name: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    label: '👨‍🎓 Alumno',
  },
};

const getRoleStyle = (rol) => roleStyling[rol] || { name: 'text-slate-700', badge: 'bg-slate-100 text-slate-700', label: rol || 'Usuario' };

export default function ComentariosPauta({ pautaEvaluadaId }) {
  const { user } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [tieneNuevos, setTieneNuevos] = useState(false);
  const listaRef = useRef(null);

  const esAutor = (coment) => {
    if (!user) return false;
    const rutComentario = coment.emisorRut || coment.emisor_rut;
    return rutComentario && user.rut && rutComentario === user.rut;
  };

  // Cargar comentarios bajo demanda (solo cuando el modal está abierto)
  useEffect(() => {
    const cargarComentarios = async () => {
      setCargando(true);
      setError('');
      try {
        const data = await obtenerComentariosPauta(pautaEvaluadaId);
        setComentarios(data.comentarios || []);
        setTieneNuevos(false);
      } catch (e) {
        setError(e.message || 'Error al cargar comentarios');
      } finally {
        setCargando(false);
      }
    };

    if (pautaEvaluadaId) {
      cargarComentarios();
    }
  }, [pautaEvaluadaId]);

  // Suscribirse a nuevos comentarios solo mientras el modal esté abierto
  useEffect(() => {
    if (!pautaEvaluadaId || !socketService?.socket?.connected) return;

    console.log('[ComentariosPauta] Suscribiendo a nuevos comentarios para pauta:', pautaEvaluadaId);

    // Emit para suscribirse
    socketService.socket.emit('suscribirse-comentarios', { pautaEvaluadaId });

    // Escuchar nuevos comentarios
    const handleNuevoComentario = (data) => {
      console.log('[ComentariosPauta] Nuevo comentario recibido:', data);
      setComentarios(prev => [...prev, data.comentario]);
    };

    // Escuchar cuando hay nuevos comentarios pero el modal no está activo
    const handleComentarioNoVistos = (data) => {
      console.log('[ComentariosPauta] Notificación de comentario no visto:', data);
      setTieneNuevos(true);
    };

    socketService.socket.on('nuevo-comentario-pauta', handleNuevoComentario);
    socketService.socket.on('comentario-no-visto-pauta', handleComentarioNoVistos);

    return () => {
      console.log('[ComentariosPauta] Desuscribiendo de comentarios para pauta:', pautaEvaluadaId);
      socketService.socket?.emit('desuscribirse-comentarios', { pautaEvaluadaId });
      socketService.socket?.off('nuevo-comentario-pauta', handleNuevoComentario);
      socketService.socket?.off('comentario-no-visto-pauta', handleComentarioNoVistos);
    };
  }, [pautaEvaluadaId]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setEnviando(true);
    try {
      // El servidor extrae el emisor del token JWT
      const data = {
        texto: nuevoComentario.trim(),
      };

      await crearComentarioPauta(pautaEvaluadaId, data);
      setNuevoComentario('');

      // El nuevo comentario se añadirá automáticamente por el socket
      // Si no llega el evento en 2 segundos, hacer reload manual
      setTimeout(() => {
        const ultimoComentario = comentarios[comentarios.length - 1];
        if (!ultimoComentario || ultimoComentario.texto !== nuevoComentario) {
          // Recargar comentarios si no se actualizó automáticamente
          const cargarComentarios = async () => {
            try {
              const data = await obtenerComentariosPauta(pautaEvaluadaId);
              setComentarios(data.comentarios || []);
            } catch (e) {
              console.error('Error al recargar comentarios:', e);
            }
          };
          cargarComentarios();
        }
      }, 2000);
    } catch (e) {
      setError(e.message || 'Error al enviar comentario');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-4 relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg">Comentarios</h3>
        {tieneNuevos && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Nuevos comentarios
          </span>
        )}
      </div>

      <div className="flex justify-between mb-4">
        <button
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-300"
          onClick={() => listaRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Ir al inicio
        </button>
        <button
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-300"
          onClick={() => listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: 'smooth' })}
        >
          Ir al final
        </button>
      </div>

      {cargando ? (
        <div className="text-gray-500">Cargando comentarios...</div>
      ) : (
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto ghost-scroll" ref={listaRef}>
          {comentarios.length === 0 ? (
            <div className="text-gray-400">No hay comentarios aún.</div>
          ) : (
            comentarios.map((coment) => (
              <div
                key={coment.id || `${coment.emisor}-${coment.createdAt}`}
                className="bg-white border border-blue-100 rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${getRoleStyle(coment.rol).name}`}>
                        {coment.emisor}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleStyle(coment.rol).badge}`}>
                        {getRoleStyle(coment.rol).label}
                      </span>
                      {coment.createdAt && (
                        <span className="text-gray-400 text-[11px] ml-auto">
                          {formatFechaHora(coment.createdAt)}
                        </span>
                      )}
                      {esAutor(coment) && (
                        <button
                          type="button"
                          className="text-[11px] text-red-500 hover:text-red-700 ml-2"
                          onClick={async () => {
                            try {
                              await eliminarComentarioPauta(coment.id);
                              setComentarios(prev => prev.filter(c => c.id !== coment.id));
                            } catch (e) {
                              setError(e.message || 'Error al eliminar comentario');
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    <span className="text-gray-700 text-sm leading-snug">{coment.texto}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <form onSubmit={handleEnviar} className="flex gap-2 mt-2">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder="Escribe un comentario..."
          value={nuevoComentario}
          onChange={e => setNuevoComentario(e.target.value)}
          disabled={enviando}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded text-sm font-semibold disabled:bg-blue-400"
          disabled={enviando || !nuevoComentario.trim()}
        >
          {enviando ? '...' : 'Enviar'}
        </button>
      </form>

      {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
    </div>
  );
}
