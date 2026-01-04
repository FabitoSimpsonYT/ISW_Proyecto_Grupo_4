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
      transports: ['websocket', 'polling'],
      upgrade: true,
      closeOnBeforeUnload: false,
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

  // Métodos de chat de retroalimentación eliminados
  unirseRetroalimentacion() {}
  _unirseRetroalimentacion() {}
  enviarMensaje() {}
  marcarVistos() {}
  escucharMensajes() {}

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
