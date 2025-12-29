import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socket.service';
import { obtenerMensajes, marcarComoVistos } from '../services/retroalimentacion.service';
import cookies from 'js-cookie';

export const useRetroalimentacion = (ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId, user) => {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tieneNoVistos, setTieneNoVistos] = useState(false);
  const [otroUsuarioConectado, setOtroUsuarioConectado] = useState(false);

  // Cargar mensajes previos
  useEffect(() => {
    const cargarMensajes = async () => {
      try {
        setCargando(true);
        setError(null);
        console.log('[useRetroalimentacion] Parámetros:', { ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId });
        
        // Validar que al menos se pase evaluacionId o evaluacionIntegradoraId
        if (!evaluacionId && !evaluacionIntegradoraId) {
          console.warn('[useRetroalimentacion] Ni evaluacionId ni evaluacionIntegradoraId fueron proporcionados');
          setMensajes([]);
          setCargando(false);
          return;
        }
        
        const data = await obtenerMensajes(alumnoRut, ramoId, evaluacionId, evaluacionIntegradoraId);
        console.log('[useRetroalimentacion] Datos recibidos del API:', data);
        
        // Extraer mensajes de la respuesta (estructura: data.data.mensajes o data.mensajes)
        let mensajesData = [];
        
        if (data?.data?.mensajes) {
          mensajesData = data.data.mensajes;
        } else if (data?.mensajes) {
          mensajesData = data.mensajes;
        } else if (Array.isArray(data?.data)) {
          mensajesData = data.data;
        } else if (Array.isArray(data)) {
          mensajesData = data;
        }
        
        console.log('[useRetroalimentacion] Mensajes extraídos:', mensajesData);
        setMensajes(mensajesData || []);
        
        // Verificar si hay no vistos
        const hasNoVisto = (mensajesData || []).some(m => !m.visto) || false;
        setTieneNoVistos(hasNoVisto);
      } catch (err) {
        console.error('Error cargando mensajes:', err);
        console.error('Error details:', err.response?.data || err.message);
        // No establecer error si no hay mensajes - es normal que esté vacío
        setError(null);
        setMensajes([]);
      } finally {
        setCargando(false);
      }
    };

    if (ramoId && alumnoRut) {
      cargarMensajes();
    }
  }, [ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId]);

  // Conectar socket y escuchar eventos
  useEffect(() => {
    console.log('🔧 [Hook] Iniciando setup de socket. user?.id:', user?.id, 'socketService:', !!socketService);
    
    if (!user?.id || !socketService) {
      console.warn('⚠️ [Hook] Cancelando setup: user?.id falta o socketService no existe');
      return;
    }

    try {
      const token = cookies.get('jwt-auth');
      console.log('🔧 [Hook] Token obtenido:', !!token);
      
      // Inicializar socket si no está conectado
      if (!socketService.socket?.connected) {
        console.log('🔧 [Hook] Socket no conectado, conectando...');
        socketService.connect(token, user);
      } else {
        console.log('🔧 [Hook] Socket ya está conectado');
      }

      // Esperar a que el socket esté conectado
      const unirseALaSala = () => {
        console.log('🔧 [Hook] Uniendo a sala de retroalimentación con:', {
          ramoId,
          alumnoRut,
          evaluacionId,
          evaluacionIntegradoraId,
          userRole: user?.role,
        });
        socketService.unirseRetroalimentacion(ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId);
      };

      if (socketService.socket?.connected) {
        unirseALaSala();
      } else if (socketService.socket) {
        socketService.socket.once('connect', unirseALaSala);
      }

      // Escuchar nuevos mensajes
      const handleMensajes = (data) => {
        try {
          if (data.mensajes) {
            setMensajes(data.mensajes);
            const hasNoVisto = data.mensajes.some(m => !m.visto);
            setTieneNoVistos(hasNoVisto);
          } else if (data.id) {
            setMensajes(prev => [...prev, data]);
            setTieneNoVistos(true);
          }
        } catch (err) {
          console.error('Error procesando mensaje:', err);
        }
      };

      socketService.escucharMensajes(handleMensajes);

      // Escuchar cuando se marcan como vistos
      const handleMarcadosVistos = () => {
        setMensajes(prev =>
          prev.map(m => ({ ...m, visto: true }))
        );
        setTieneNoVistos(false);
      };

      socketService.escucharMarcadosVistos(handleMarcadosVistos);

      // Escuchar cuando el otro usuario se conecta/desconecta
      const handleOtroUsuarioConectado = (data) => {
        console.log('📥 [Hook] Evento otro-usuario-conectado recibido:', data);
        setOtroUsuarioConectado(true);
      };

      const handleOtroUsuarioDesconectado = (data) => {
        console.log('📥 [Hook] Evento otro-usuario-desconectado recibido:', data);
        setOtroUsuarioConectado(false);
      };

      console.log('👂 [Hook] Registrando listeners para: otro-usuario-conectado y otro-usuario-desconectado');
      socketService.socket?.on('otro-usuario-conectado', handleOtroUsuarioConectado);
      socketService.socket?.on('otro-usuario-desconectado', handleOtroUsuarioDesconectado);

      return () => {
        if (socketService.socket) {
          socketService.socket.off('mensajes-previos', handleMensajes);
          socketService.socket.off('nuevo-mensaje', handleMensajes);
          socketService.socket.off('mensajes-marcados-vistos', handleMarcadosVistos);
          socketService.socket.off('otro-usuario-conectado', handleOtroUsuarioConectado);
          socketService.socket.off('otro-usuario-desconectado', handleOtroUsuarioDesconectado);
        }
      };
    } catch (err) {
      console.error('Error en useRetroalimentacion socket setup:', err);
      setError('Error al conectar con el servidor');
    }
  }, [ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId, user?.id]);

  const enviarMensaje = useCallback((mensaje) => {
    socketService.enviarMensaje({
      evaluacionId: evaluacionId || null,
      evaluacionIntegradoraId: evaluacionIntegradoraId || null,
      alumnoRut,
      ramoId,
      mensaje,
    });
  }, [alumnoRut, ramoId, evaluacionId, evaluacionIntegradoraId]);

  const marcarVistos = useCallback(async () => {
    try {
      await marcarComoVistos(alumnoRut, ramoId, evaluacionId, evaluacionIntegradoraId);
      socketService.marcarVistos(ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId);
      setMensajes(prev =>
        prev.map(m => ({ ...m, visto: true }))
      );
      setTieneNoVistos(false);
    } catch (err) {
      console.error('Error marcando como visto:', err);
    }
  }, [alumnoRut, ramoId, evaluacionId, evaluacionIntegradoraId]);

  return {
    mensajes,
    cargando,
    error,
    tieneNoVistos,
    otroUsuarioConectado,
    enviarMensaje,
    marcarVistos,
  };
};
