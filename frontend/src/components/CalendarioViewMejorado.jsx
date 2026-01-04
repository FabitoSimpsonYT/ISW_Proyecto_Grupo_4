// src/components/CalendarioViewMejorado.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { getEventosProfesor, eliminarEvento } from '../services/evento.service';
import { getBloqueos } from '../services/bloqueo.service';
import { useAuth } from '../context/AuthContext';
import { showBlockedDayAlert, showCalendarEventAlert, showEmptyDayAlert, showMultipleEventsAlert } from '../utils/enhancedAlerts';
import { getColorByType } from '../utils/colorMap';
import LeyendaColores from './LeyendaColores';

export default function CalendarioViewMejorado({ onEditarEvento }) {
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesActual, setMesActual] = useState(new Date());
  const [filtroRamo, setFiltroRamo] = useState('todos'); // Filtro por ramo
  const [vista, setVista] = useState('calendario'); // 'calendario' o 'lista'

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    // Listener para cuando se crea/actualiza un evento
    const handleEventosUpdated = () => {
      cargarDatos();
    };

    window.addEventListener('eventosUpdated', handleEventosUpdated);

    return () => {
      window.removeEventListener('eventosUpdated', handleEventosUpdated);
    };
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Cargar eventos
      const responseEventos = await getEventosProfesor();
      const eventosData = responseEventos?.data || [];
      console.log('[CalendarioViewMejorado] Eventos cargados:', eventosData);
      setEventos(Array.isArray(eventosData) ? eventosData : []);
      
      // Cargar bloqueos
      const responseBloqueos = await getBloqueos();
      const bloqueosData = responseBloqueos?.data || responseBloqueos || [];
      setBloqueos(Array.isArray(bloqueosData) ? bloqueosData : []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setEventos([]);
      setBloqueos([]);
    } finally {
      setLoading(false);
    }
  };

  // Obtener lista de ramos únicos de los eventos
  const obtenerRamosUnicos = () => {
    if (!Array.isArray(eventos)) return [];
    const ramos = {};
    eventos.forEach(e => {
      if (e.ramo_id && e.ramo_nombre) {
        ramos[e.ramo_id] = e.ramo_nombre;
      }
    });
    return Object.entries(ramos).map(([id, nombre]) => ({ id, nombre }));
  };

  // Filtrar eventos según el ramo seleccionado
  const eventosFiltrados = () => {
    if (filtroRamo === 'todos') return eventos;
    return eventos.filter(e => e.ramo_id === parseInt(filtroRamo));
  };

  const getDiasDelMes = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getPrimerDia = (date) => {
    // getDay() retorna: 0=domingo, 1=lunes, ..., 6=sábado
    // Necesitamos convertir para que lunes=0: domingo=6, lunes=0, ..., sábado=5
    const dayOfWeek = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Si es domingo (0), retorna 6; sino retorna dayOfWeek - 1
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  };

  const obtenerEventosDelDia = (dia) => {
    const eventosAUsar = eventosFiltrados(); // Usar eventos filtrados
    if (!Array.isArray(eventosAUsar)) return [];
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    fecha.setHours(0, 0, 0, 0);
    
    const eventosDelDia = eventosAUsar.filter((e) => {
      // Para eventos de slots, verificar si caen dentro del rango
      if (e.fecha_rango_inicio && e.fecha_rango_fin) {
        const fechaInicio = new Date(e.fecha_rango_inicio);
        const fechaFin = new Date(e.fecha_rango_fin);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin.setHours(23, 59, 59, 999);
        
        const estaEnRango = fecha >= fechaInicio && fecha <= fechaFin;
        if (estaEnRango) {
          console.log(`[CalendarioViewMejorado] Evento ${e.nombre} (slots) encontrado en ${dia}/${mesActual.getMonth() + 1}`);
        }
        return estaEnRango;
      }
      
      // Para eventos regulares, usar fecha_inicio
      const fechaStr = e.fecha_inicio || e.fechaDia || e.fecha;
      if (!fechaStr) return false;
      
      const fechaEvento = new Date(fechaStr);
      fechaEvento.setHours(0, 0, 0, 0);
      
      // Comparar solo la fecha (ignorando la hora y zona horaria)
      return fechaEvento.getFullYear() === fecha.getFullYear() &&
             fechaEvento.getMonth() === fecha.getMonth() &&
             fechaEvento.getDate() === fecha.getDate();
    });
    
    return eventosDelDia;
  };

  const estaBloqueado = (dia) => {
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    return bloqueos.some((b) => {
      const fechaInicio = new Date(b.fecha_inicio);
      const fechaFin = new Date(b.fecha_fin);
      return fecha >= fechaInicio && fecha <= fechaFin;
    });
  };

  const mostrarDetallesEvento = (evento) => {
    showCalendarEventAlert(evento, {
      width: '700px',
      showCancelButton: true,
      confirmButtonText: '✏️ Editar',
      cancelButtonText: 'Cerrar'
    }).then((result) => {
      if (result.isConfirmed && onEditarEvento) {
        onEditarEvento(evento);
      }
    });
  };

  const mostrarDetallesBloqueo = (dia) => {
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    const bloqueoDelDia = bloqueos.find((b) => {
      const fechaInicio = new Date(b.fecha_inicio);
      const fechaFin = new Date(b.fecha_fin);
      return fecha >= fechaInicio && fecha <= fechaFin;
    });

    if (bloqueoDelDia) {
      showBlockedDayAlert(fecha, bloqueoDelDia.razon || 'No especificada', `Este día no está disponible para programar evaluaciones`);
    }
  };

  const mostrarDetallesDia = (dia) => {
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    const eventosDelDia = obtenerEventosDelDia(dia);
    const nombreDia = fecha.toLocaleString('es-ES', { weekday: 'long' });

    if (eventosDelDia.length === 0) {
      showEmptyDayAlert(nombreDia, fecha);
    } else if (eventosDelDia.length === 1) {
      // Mostrar un solo evento en el modal mejorado también
      showMultipleEventsAlert(nombreDia, fecha, eventosDelDia, {
        showEditButton: true,
        showDeleteButton: true,
        onEditar: (evento) => {
          if (onEditarEvento) {
            onEditarEvento(evento);
          }
        },
        onEliminar: async (evento) => {
          const confirmacion = await Swal.fire({
            title: '¿Eliminar evaluación?',
            text: `¿Estás seguro de que deseas eliminar "${evento.nombre}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#667eea',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
          });

          if (confirmacion.isConfirmed) {
            try {
              await eliminarEvento(evento.id);
              Swal.fire('Eliminado', 'La evaluación ha sido eliminada correctamente', 'success');
              cargarDatos();
            } catch (error) {
              Swal.fire('Error', 'No se pudo eliminar la evaluación', 'error');
            }
          }
        }
      });
    } else {
      showMultipleEventsAlert(nombreDia, fecha, eventosDelDia, {
        showEditButton: true,
        showDeleteButton: true,
        onEditar: (evento) => {
          if (onEditarEvento) {
            onEditarEvento(evento);
          }
        },
        onEliminar: async (evento) => {
          const confirmacion = await Swal.fire({
            title: '¿Eliminar evaluación?',
            text: `¿Estás seguro de que deseas eliminar "${evento.nombre}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#667eea',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
          });

          if (confirmacion.isConfirmed) {
            try {
              await eliminarEvento(evento.id);
              Swal.fire('Eliminado', 'La evaluación ha sido eliminada correctamente', 'success');
              cargarDatos();
            } catch (error) {
              Swal.fire('Error', 'No se pudo eliminar la evaluación', 'error');
            }
          }
        }
      });
    }
  };

  const diasDelMes = getDiasDelMes(mesActual);
  const primerDia = getPrimerDia(mesActual);

  // Debug: log para verificar valores
  console.log(`Calendario: ${mesActual.toLocaleDateString('es-ES')} - primerDia: ${primerDia}, diasDelMes: ${diasDelMes}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8"
    >
      {/* Leyenda de colores */}
      <LeyendaColores />

      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0E2C66]">
          📋 Mis Evaluaciones
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const newDate = new Date(mesActual);
              newDate.setMonth(newDate.getMonth() - 1);
              setMesActual(newDate);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition"
          >
            ←
          </button>
          <span className="px-4 py-2 bg-gray-100 rounded-lg font-semibold">
            {mesActual.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => {
              const newDate = new Date(mesActual);
              newDate.setMonth(newDate.getMonth() + 1);
              setMesActual(newDate);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition"
          >
            →
          </button>
        </div>
      </div>

      {/* Controles de Filtro y Vista */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por Ramo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🎓 Filtrar por Ramo:
            </label>
            <select
              value={filtroRamo}
              onChange={(e) => setFiltroRamo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="todos">Todos los Ramos</option>
              {obtenerRamosUnicos().map(ramo => (
                <option key={ramo.id} value={ramo.id}>
                  {ramo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Cambio de Vista */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              👁️ Vista:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setVista('calendario')}
                className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition ${
                  vista === 'calendario'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                📅 Calendario
              </button>
              <button
                onClick={() => setVista('lista')}
                className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition ${
                  vista === 'lista'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                📊 Lista
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido según Vista */}
      {vista === 'calendario' ? (
        <>
          {/* Grilla del Calendario */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
        {/* Encabezados de días */}
        {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((dia) => (
          <div key={dia} className="text-center font-bold text-gray-700 py-1 sm:py-2 text-xs sm:text-sm">
            {dia}
          </div>
        ))}

        {/* Días vacíos al inicio - calculados correctamente */}
        {Array.from({ length: primerDia }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square bg-gray-50 rounded-lg"></div>
        ))}

        {/* Días del mes */}
        {Array.from({ length: diasDelMes }).map((_, i) => {
            const dia = i + 1;
            const eventosDelDia = obtenerEventosDelDia(dia);
            const bloqueado = estaBloqueado(dia);
            const esHoy =
              new Date().toDateString() ===
              new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toDateString();

            return (
              <motion.div
                key={dia}
                onClick={() => {
                  if (bloqueado) {
                    mostrarDetallesBloqueo(dia);
                  } else {
                    mostrarDetallesDia(dia);
                  }
                }}
                className={`aspect-square p-1 sm:p-2 rounded-lg border-2 transition cursor-pointer ${
                  bloqueado
                    ? 'bg-gradient-to-br from-red-100 to-red-50 border-red-400'
                    : esHoy
                    ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <div className="font-bold text-xs sm:text-sm md:text-base text-gray-700 mb-0.5 sm:mb-1">
                  {dia}
                  {bloqueado && <span className="text-red-600 text-lg">🚫</span>}
                </div>
                {!bloqueado && (
                <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-xs max-h-16 sm:max-h-20 overflow-hidden">
                  {eventosDelDia.map((evento) => {
                    // Obtener nombre del tipo: puede venir como tipo_nombre, tipoEvento.nombre, o nombre
                    const tipoEventoNombre = evento.tipo_nombre || evento.tipoEvento?.nombre || evento.nombre || 'Evaluación';
                    const colorInfo = getColorByType(tipoEventoNombre);
                    
                    return (
                      <motion.div
                        key={evento.id}
                        onClick={() => mostrarDetallesEvento(evento)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="text-white p-0.5 sm:p-1 rounded text-xs font-semibold truncate hover:shadow-md transition cursor-pointer border border-opacity-30 border-white"
                        style={{
                          backgroundColor: colorInfo.bg,
                          borderColor: colorInfo.border,
                        }}
                        title={evento.nombre}
                      >
                        {evento.nombre}
                      </motion.div>
                    );
                  })}
                </div>
                )}
              </motion.div>
            );
          })}
      </div>

      {/* Info */}
      {loading && <p className="text-center text-gray-500 mt-8">Cargando evaluaciones...</p>}
      {!loading && eventos.length === 0 && (
        <p className="text-center text-gray-600 mt-8 text-lg">Aún no has programado evaluaciones. ¡Es momento de crear una!</p>
      )}
        </>
      ) : (
        <div className="space-y-4">
          {eventosFiltrados().length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border border-gray-200">
              No hay evaluaciones para mostrar
            </div>
          ) : (
            eventosFiltrados()
              .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
              .map((evento) => {
                const tipoEventoNombre = evento.tipo_nombre || evento.tipoEvento?.nombre || 'Evaluación';
                const colorInfo = getColorByType(tipoEventoNombre);
                const fecha = new Date(evento.fecha_inicio);
                const fechaFin = evento.fecha_fin ? new Date(evento.fecha_fin) : null;
                const horaInicio = evento.fecha_inicio ? new Date(evento.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                const horaFin = fechaFin ? fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                
                // Calcular duración
                const duracionMs = fechaFin && evento.fecha_inicio ? new Date(evento.fecha_fin) - new Date(evento.fecha_inicio) : 0;
                const duracionMinutos = Math.round(duracionMs / 60000);
                const duracionHoras = (duracionMinutos / 60).toFixed(1);
                
                const estadosMap = {
                  'pendiente': { emoji: '📋', color: '#f59e0b', texto: 'Pendiente' },
                  'confirmado': { emoji: '✅', color: '#10b981', texto: 'Confirmado' },
                  'reagendado': { emoji: '🔄', color: '#3b82f6', texto: 'Reagendado' },
                  'cancelado': { emoji: '❌', color: '#ef4444', texto: 'Cancelado' }
                };
                const estadoInfo = estadosMap[evento.estado] || estadosMap['pendiente'];
                
                return (
                  <motion.div
                    key={evento.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 rounded-lg p-4 hover:shadow-lg transition overflow-hidden"
                    style={{ borderColor: colorInfo.border }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Nombre y Tipo */}
                      <div className="md:col-span-2">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                            style={{ backgroundColor: colorInfo.bg }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg truncate">{evento.nombre}</h3>
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Tipo:</span> {tipoEventoNombre}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Ramo:</span> {evento.ramo_nombre || evento.ramo?.nombre || 'N/A'}
                            </p>
                            {evento.seccion?.nombre && (
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold">Sección:</span> {evento.seccion.nombre}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fecha y Hora */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Fecha y Hora</p>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">
                            📅 {fecha.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-sm text-gray-600">
                            🕐 {horaInicio} - {horaFin}
                          </p>
                          <p className="text-xs text-gray-500">
                            ⏱️ {duracionHoras} horas
                          </p>
                        </div>
                      </div>

                      {/* Detalles */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Detalles</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              evento.modalidad === 'presencial'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {evento.modalidad === 'presencial' ? '🏢 Presencial' : '💻 Online'}
                            </span>
                          </div>
                          <div>
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: estadoInfo.color }}>
                              {estadoInfo.emoji} {estadoInfo.texto}
                            </span>
                          </div>
                          {evento.cupo_maximo && (
                            <p className="text-xs text-gray-600">
                              👥 Cupo: {evento.cupo_maximo}
                            </p>
                          )}
                          {evento.sala && (
                            <p className="text-xs text-gray-600">
                              🏛️ Sala: {evento.sala}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="md:col-span-2 lg:col-span-4 flex gap-2 pt-2 border-t border-gray-200">
                        <motion.button
                          onClick={() => mostrarDetallesEvento(evento)}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-1"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          👁️ Ver Detalles
                        </motion.button>
                        <motion.button
                          onClick={async () => {
                            const confirmacion = await Swal.fire({
                              title: '¿Eliminar evaluación?',
                              text: `¿Estás seguro de que deseas eliminar "${evento.nombre}"?`,
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#ef4444',
                              cancelButtonColor: '#667eea',
                              confirmButtonText: 'Eliminar',
                              cancelButtonText: 'Cancelar'
                            });

                            if (confirmacion.isConfirmed) {
                              try {
                                await eliminarEvento(evento.id);
                                Swal.fire('Eliminado', 'La evaluación ha sido eliminada correctamente', 'success');
                                cargarDatos();
                              } catch (error) {
                                Swal.fire('Error', 'No se pudo eliminar la evaluación', 'error');
                              }
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-1"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          🗑️ Eliminar
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
          )}
        </div>
      )}
    </motion.div>
  );
}
