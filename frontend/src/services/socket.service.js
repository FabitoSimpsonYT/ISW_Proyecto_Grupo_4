import io from 'socket.io-client';
import cookies from 'js-cookie';

const SOCKET_SERVER = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
  }

  connect(token, user) {
    if (this.socket?.connected) return this.socket;
    if (this.isConnecting) return this.socket;

    this.isConnecting = true;
    this.currentUser = user;
    this.socket = io(SOCKET_SERVER, {
      auth: {
        token,
        user: {
          id: user.id,
          role: user.role,
          rut: user.rut,
        },
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      console.log('✓ Conectado a Socket.io');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('✗ Desconectado de Socket.io. Razón:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Error Socket.io:', error);
    });

    return this.socket;
  }

  unirseRetroalimentacion(ramoId, alumnoRut, evaluacionId = null, evaluacionIntegradoraId = null) {
    if (!this.socket) {
      console.error('Socket no inicializado');
      return;
    }

    if (!this.socket.connected) {
      console.warn('Socket no conectado, esperando...');
      // Esperar a que el socket se conecte
      this.socket.once('connect', () => {
        this._unirseRetroalimentacion(ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId);
      });
      return;
    }

    this._unirseRetroalimentacion(ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId);
  }

  _unirseRetroalimentacion(ramoId, alumnoRut, evaluacionId = null, evaluacionIntegradoraId = null) {
    // Obtener token de cookies
    const token = cookies.get('jwt-auth');

    console.log('📤 [Socket] Emitiendo join-retroalimentacion:', {
      ramoId,
      alumnoRut,
      evaluacionId,
      evaluacionIntegradoraId,
      socketConnected: this.socket?.connected,
      socketId: this.socket?.id,
    });

    this.socket.emit('join-retroalimentacion', {
      token,
      userId: this.currentUser?.id,
      ramoId,
      alumnoRut,
      evaluacionId,
      evaluacionIntegradoraId,
    });
  }

  enviarMensaje(data) {
    console.log('📤 [Socket] Intentando enviar mensaje:', {
      socketConnected: this.socket?.connected,
      socketId: this.socket?.id,
      dataKeys: Object.keys(data),
    });

    if (!this.socket?.connected) {
      console.error('❌ [Socket] Socket no conectado. No se puede enviar mensaje');
      return;
    }

    console.log('📤 [Socket] Emitiendo mensaje-retroalimentacion:', data);
    this.socket.emit('mensaje-retroalimentacion', data);
  }

  marcarVistos(ramoId, alumnoRut, evaluacionId = null, evaluacionIntegradoraId = null) {
    if (!this.socket?.connected) {
      console.error('Socket no conectado');
      return;
    }

    this.socket.emit('marcar-vistos', {
      ramoId,
      alumnoRut,
      evaluacionId,
      evaluacionIntegradoraId,
    });
  }

  escucharMensajes(callback) {
    if (!this.socket) return;
    console.log('👂 [Socket] Escuchando: mensajes-previos, nuevo-mensaje');
    this.socket.on('mensajes-previos', (data) => {
      console.log('📥 [Socket] Evento mensajes-previos recibido:', data);
      callback(data);
    });
    this.socket.on('nuevo-mensaje', (data) => {
      console.log('📥 [Socket] Evento nuevo-mensaje recibido:', data);
      callback(data);
    });
  }

  escucharMarcadosVistos(callback) {
    if (!this.socket) return;
    console.log('👂 [Socket] Escuchando: mensajes-marcados-vistos');
    this.socket.on('mensajes-marcados-vistos', (data) => {
      console.log('📥 [Socket] Evento mensajes-marcados-vistos recibido:', data);
      callback(data);
    });
  }

  desconectar() {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
  }
}

export default new SocketService();
