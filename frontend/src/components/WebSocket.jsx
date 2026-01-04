// src/components/ChatWebSocket.jsx
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function ChatWebSocket({ eventoId, ramoId }) {
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [conectado, setConectado] = useState(false);
  const [profesorOnline, setProfesorOnline] = useState(false);
  const wsRef = useRef(null);
  const mensajesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    conectarWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [eventoId]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const conectarWebSocket = () => {
    const WS_URL = import.meta.env.VITE_WS_URL;
    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onopen = () => {
      console.log('WebSocket conectado');
      setConectado(true);

      // Unirse a la sala
      wsRef.current.send(JSON.stringify({
        type: 'join',
        token,
        eventoId,
        ramoId
      }));
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'joined':
            console.log('Unido a la sala');
            break;

          case 'history':
            setMensajes(data.mensajes || []);
            break;

          case 'new_message':
            setMensajes(prev => [...prev, data.mensaje]);
            break;

          case 'message_sent':
            // Mensaje confirmado
            break;

          case 'profesor_conectado':
            setProfesorOnline(true);
            mostrarNotificacion('El profesor se ha conectado', 'success');
            break;

          case 'alumno_conectado':
            if (user.role === 'profesor') {
              mostrarNotificacion(`Alumno ${data.alumnoEmail} conectado`, 'info');
            }
            break;

          case 'profesor_desconectado':
            setProfesorOnline(false);
            mostrarNotificacion('El profesor se ha desconectado', 'warning');
            break;

          case 'alumno_desconectado':
            if (user.role === 'profesor') {
              mostrarNotificacion(`Alumno ${data.alumnoEmail} desconectado`, 'info');
            }
            break;

          case 'error':
            toast.error(data.error || 'Error desconocido');
            break;

          default:
            console.log('Mensaje desconocido:', data);
        }
      } catch (error) {
        console.error('Error procesando mensaje:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Error de conexión');
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket desconectado');
      setConectado(false);
      setProfesorOnline(false);

      // Intentar reconectar en 5 segundos
      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          conectarWebSocket();
        }
      }, 5000);
    };
  };

  const enviarMensaje = (e) => {
    e.preventDefault();
    
    if (!mensaje.trim()) return;
    if (!conectado) {
      toast.error('No estás conectado al chat');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'message',
      eventoId,
      contenido: mensaje
    }));

    setMensaje('');
  };

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const mostrarNotificacion = (texto, tipo) => {
    Swal.fire({
      icon: tipo,
      text: texto,
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b px-4 py-3 flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Chat en Tiempo Real</h3>
          <p className="text-xs text-gray-600">
            {conectado ? (
              <>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Conectado
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                Desconectado
              </>
            )}
            {user.role === 'alumno' && profesorOnline && (
              <span className="ml-2">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                Profesor online
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No hay mensajes aún</p>
            <p className="text-sm">Envía un mensaje para comenzar</p>
          </div>
        ) : (
          mensajes.map((msg, index) => {
            const esMio = msg.emisor.id === user.id;
            const esProfesor = msg.emisor.role === 'profesor';

            return (
              <div
                key={msg.id || index}
                className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${esMio ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      esMio
                        ? 'bg-blue-500 text-white'
                        : esProfesor
                        ? 'bg-green-100 text-green-900'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {!esMio && (
                      <p className="text-xs font-semibold mb-1">
                        {esProfesor ? '👨‍🏫 Profesor' : '👨‍🎓 Alumno'}
                        {!esProfesor && ` - ${msg.emisor.email}`}
                      </p>
                    )}
                    <p className="text-sm">{msg.contenido}</p>
                    <p className={`text-xs mt-1 ${esMio ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={mensajesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={enviarMensaje} className="border-t px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder={conectado ? "Escribe un mensaje..." : "Conectando..."}
            disabled={!conectado}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!conectado || !mensaje.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </div>
        {!conectado && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ Reconectando al servidor...
          </p>
        )}
        {user.role === 'alumno' && !profesorOnline && conectado && (
          <p className="text-xs text-gray-500 mt-2">
            💡 El profesor no está conectado actualmente
          </p>
        )}
      </form>
    </div>
  );
}