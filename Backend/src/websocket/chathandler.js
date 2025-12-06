// Backend/src/websocket/chatHandler.js
const jwt = require('jsonwebtoken');

class ChatHandler {
  constructor() {
    // Estructura: { eventoId: { profesorSocket, alumnosSocket: Map } }
    this.salas = new Map();
    this.mensajes = new Map(); // Historial de mensajes por evento
  }

  // Inicializar WebSocket
  initialize(wss) {
    wss.on('connection', (ws, req) => {
      console.log('Nueva conexión WebSocket');

      // Autenticar usuario
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);

          // Primera conexión - autenticar y unirse a sala
          if (data.type === 'join') {
            await this.handleJoin(ws, data);
          }

          // Enviar mensaje
          else if (data.type === 'message') {
            await this.handleMessage(ws, data);
          }

          // Obtener historial
          else if (data.type === 'get_history') {
            await this.handleGetHistory(ws, data);
          }

          // Salir de sala
          else if (data.type === 'leave') {
            this.handleLeave(ws, data);
          }
        } catch (error) {
          console.error('Error procesando mensaje:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });

      // Desconexión
      ws.on('close', () => {
        this.handleDisconnect(ws);
        console.log('Cliente desconectado');
      });
    });
  }

  // Unirse a una sala de chat de evento
  async handleJoin(ws, data) {
    const { token, eventoId, ramoId } = data;

    // Verificar token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_isw_2024');
      ws.user = decoded;
      ws.eventoId = eventoId;
      ws.ramoId = ramoId;

      // Crear sala si no existe
      if (!this.salas.has(eventoId)) {
        this.salas.set(eventoId, {
          profesorSocket: null,
          alumnosSocket: new Map()
        });
      }

      const sala = this.salas.get(eventoId);

      // Añadir a la sala según rol
      if (decoded.role === 'profesor') {
        sala.profesorSocket = ws;
        
        // Notificar a todos los alumnos que el profesor se conectó
        sala.alumnosSocket.forEach((alumnoWs) => {
          alumnoWs.send(JSON.stringify({
            type: 'profesor_conectado',
            mensaje: 'El profesor se ha conectado al chat'
          }));
        });
      } else if (decoded.role === 'alumno') {
        sala.alumnosSocket.set(decoded.id, ws);
        
        // Notificar al profesor que un alumno se conectó
        if (sala.profesorSocket) {
          sala.profesorSocket.send(JSON.stringify({
            type: 'alumno_conectado',
            alumnoEmail: decoded.email,
            mensaje: `Alumno ${decoded.email} se ha conectado`
          }));
        }
      }

      // Confirmar conexión
      ws.send(JSON.stringify({
        type: 'joined',
        eventoId,
        ramoId,
        mensaje: 'Conectado al chat exitosamente'
      }));

      // Enviar historial de mensajes
      const historial = this.mensajes.get(eventoId) || [];
      ws.send(JSON.stringify({
        type: 'history',
        mensajes: historial
      }));

    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Token inválido'
      }));
    }
  }

  // Manejar envío de mensajes
  async handleMessage(ws, data) {
    const { contenido, eventoId } = data;
    
    if (!ws.user || !eventoId) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Usuario no autenticado o evento no especificado'
      }));
      return;
    }

    const sala = this.salas.get(eventoId);
    if (!sala) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Sala no encontrada'
      }));
      return;
    }

    // Crear mensaje
    const mensaje = {
      id: Date.now().toString(),
      eventoId,
      emisor: {
        id: ws.user.id,
        email: ws.user.email,
        role: ws.user.role
      },
      contenido,
      timestamp: new Date().toISOString()
    };

    // Guardar en historial
    if (!this.mensajes.has(eventoId)) {
      this.mensajes.set(eventoId, []);
    }
    this.mensajes.get(eventoId).push(mensaje);

    // Enviar a los destinatarios correctos
    if (ws.user.role === 'profesor') {
      // Profesor envía a todos los alumnos
      sala.alumnosSocket.forEach((alumnoWs) => {
        alumnoWs.send(JSON.stringify({
          type: 'new_message',
          mensaje
        }));
      });

      // Confirmar al profesor
      ws.send(JSON.stringify({
        type: 'message_sent',
        mensaje
      }));

    } else if (ws.user.role === 'alumno') {
      // Alumno envía solo al profesor
      if (sala.profesorSocket) {
        sala.profesorSocket.send(JSON.stringify({
          type: 'new_message',
          mensaje
        }));

        // Confirmar al alumno
        ws.send(JSON.stringify({
          type: 'message_sent',
          mensaje
        }));
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          error: 'El profesor no está conectado actualmente'
        }));
      }
    }
  }

  // Obtener historial de mensajes
  async handleGetHistory(ws, data) {
    const { eventoId } = data;
    const historial = this.mensajes.get(eventoId) || [];

    ws.send(JSON.stringify({
      type: 'history',
      mensajes: historial
    }));
  }

  // Salir de una sala
  handleLeave(ws, data) {
    const { eventoId } = data;

    if (!ws.user || !eventoId) return;

    const sala = this.salas.get(eventoId);
    if (!sala) return;

    if (ws.user.role === 'profesor') {
      sala.profesorSocket = null;
      
      // Notificar a alumnos
      sala.alumnosSocket.forEach((alumnoWs) => {
        alumnoWs.send(JSON.stringify({
          type: 'profesor_desconectado',
          mensaje: 'El profesor se ha desconectado del chat'
        }));
      });
    } else if (ws.user.role === 'alumno') {
      sala.alumnosSocket.delete(ws.user.id);
      
      // Notificar al profesor
      if (sala.profesorSocket) {
        sala.profesorSocket.send(JSON.stringify({
          type: 'alumno_desconectado',
          alumnoEmail: ws.user.email,
          mensaje: `Alumno ${ws.user.email} se ha desconectado`
        }));
      }
    }

    // Si la sala está vacía, eliminarla
    if (!sala.profesorSocket && sala.alumnosSocket.size === 0) {
      this.salas.delete(eventoId);
    }
  }

  // Manejar desconexión
  handleDisconnect(ws) {
    if (!ws.eventoId || !ws.user) return;

    this.handleLeave(ws, { eventoId: ws.eventoId });
  }

  // Obtener estadísticas de una sala
  getSalaStats(eventoId) {
    const sala = this.salas.get(eventoId);
    if (!sala) return null;

    return {
      eventoId,
      profesorConectado: !!sala.profesorSocket,
      alumnosConectados: sala.alumnosSocket.size,
      mensajesTotal: (this.mensajes.get(eventoId) || []).length
    };
  }
}

module.exports = ChatHandler;