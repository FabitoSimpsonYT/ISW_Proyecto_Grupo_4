import { useState, useEffect } from 'react';
import ToastNotificationService from '../services/toastNotification.service';
import { getEvaluacionesDisponiblesSlots } from '../services/inscripcionSlots.service.js';
import { getSlotsEvento, inscribirSlot } from '../services/slot.service.js';

export default function InscribirSlots() {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [inscrito, setInscrito] = useState(null);

  useEffect(() => {
    cargarEvaluacionesSlots();
  }, []);

  const cargarEvaluacionesSlots = async () => {
    setLoading(true);
    try {
      const res = await getEvaluacionesDisponiblesSlots();
      const porSlots = res?.data || res || [];
      setEvaluaciones(porSlots);
    } catch (err) {
      console.error('Error cargando evaluaciones:', err);
      ToastNotificationService.error('No se pudieron cargar las evaluaciones disponibles');
    } finally {
      setLoading(false);
    }
  };

  const abrirEvaluacion = async (ev) => {
    setSelectedEval(ev);
    setSlots([]);
    setLoadingSlots(true);
    
    try {
      const res = await getSlotsEvento(ev.id);
      const slotsData = res?.data || res || [];
      // Filtrar solo los disponibles
      const disponibles = slotsData.filter(s => s.disponible);
      setSlots(disponibles);
      
      if (disponibles.length === 0) {
        ToastNotificationService.error('No hay horarios disponibles para esta evaluación');
      }
    } catch (err) {
      console.error('Error cargando slots:', err);
      ToastNotificationService.error('No se pudieron cargar los horarios');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleInscribirse = async (slotId) => {
    try {
      const res = await inscribirSlot(slotId);
      
      if (res?.success) {
        const slotSeleccionado = slots.find(s => s.id === slotId);
        setInscrito({
          evaluacion: selectedEval,
          slot: slotSeleccionado,
          mensaje: res.message || 'Inscripción aceptada'
        });
        
        // Recargar evaluaciones después de 2 segundos
        setTimeout(() => {
          cargarEvaluacionesSlots();
          setSelectedEval(null);
          setInscrito(null);
        }, 2000);
      } else {
        Swal.fire('Error', res?.message || 'No se pudo completar la inscripción', 'error');
      }
    } catch (err) {
      console.error('Error inscribiendo:', err);
      const msg = err?.response?.data?.message || err.message || 'Error al inscribirse';
      Swal.fire('Error', msg, 'error');
    }
  };

  const cerrarModal = () => {
    setSelectedEval(null);
    setSlots([]);
    setInscrito(null);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-center text-[#0E2C66]">
        Inscribirse a Evaluaciones por Horario
      </h2>

      {loading ? (
        <div className="text-center text-gray-600">Cargando evaluaciones disponibles...</div>
      ) : evaluaciones.length === 0 ? (
        <div className="text-center text-gray-600 bg-white p-8 rounded-lg">
          No hay evaluaciones disponibles para inscribirse
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {evaluaciones.map(ev => (
            <div 
              key={ev.id} 
              className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-600 hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  {/* Título y detalles básicos */}
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{ev.nombre}</h3>
                  
                  {ev.descripcion && (
                    <p className="text-gray-600 mb-4">{ev.descripcion}</p>
                  )}

                  {/* Grid de información */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-500 font-semibold">TIPO</div>
                      <div className="font-bold text-gray-800">{ev.tipo_nombre || 'Evaluación'}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-500 font-semibold">RAMO</div>
                      <div className="font-bold text-gray-800">{ev.ramo_codigo}</div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-500 font-semibold">DURACIÓN/ALUMNO</div>
                      <div className="font-bold text-gray-800">{ev.duracion_por_alumno || '-'} min</div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-500 font-semibold">MODALIDAD</div>
                      <div className="font-bold text-gray-800">{ev.modalidad || 'Presencial'}</div>
                    </div>
                  </div>

                  {/* Rango de fechas */}
                  <div className="text-sm text-gray-600 mb-4">
                    📅 {new Date(ev.fecha_inicio).toLocaleDateString('es-CL')} - {new Date(ev.fecha_fin).toLocaleDateString('es-CL')}
                  </div>
                </div>

                {/* Botón */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => abrirEvaluacion(ev)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition whitespace-nowrap"
                  >
                    Ver Horarios
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de selección de horarios */}
      {selectedEval && !inscrito && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{selectedEval.nombre}</h3>
                  <p className="text-blue-100 text-sm mt-1">{selectedEval.ramo_codigo}</p>
                </div>
                <button
                  onClick={cerrarModal}
                  className="text-2xl hover:bg-blue-600 rounded-full p-2 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Detalles de la evaluación */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <div className="text-xs text-gray-500 font-semibold mb-1">TIPO</div>
                  <div className="font-bold text-gray-800">{selectedEval.tipo_nombre}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-xs text-gray-500 font-semibold mb-1">DURACIÓN POR ALUMNO</div>
                  <div className="font-bold text-gray-800">{selectedEval.duracion_por_alumno} minutos</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-xs text-gray-500 font-semibold mb-1">MODALIDAD</div>
                  <div className="font-bold text-gray-800">{selectedEval.modalidad || 'Presencial'}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-xs text-gray-500 font-semibold mb-1">RANGO DE FECHAS</div>
                  <div className="font-bold text-gray-800 text-sm">
                    {new Date(selectedEval.fecha_inicio).toLocaleDateString('es-CL')} a {new Date(selectedEval.fecha_fin).toLocaleDateString('es-CL')}
                  </div>
                </div>
              </div>

              {/* Lista de horarios */}
              <h4 className="text-lg font-bold mb-4 text-gray-800">Selecciona un horario:</h4>
              
              {loadingSlots ? (
                <div className="text-center text-gray-600 py-8">Cargando horarios disponibles...</div>
              ) : slots.length === 0 ? (
                <div className="text-center text-gray-600 py-8">No hay horarios disponibles</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {slots.map(slot => {
                    const inicio = new Date(slot.fecha_hora_inicio);
                    const fin = new Date(slot.fecha_hora_fin);
                    
                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleInscribirse(slot.id)}
                        className="p-4 border-2 border-green-400 rounded-lg hover:bg-green-50 transition text-left hover:border-green-600 hover:shadow-md"
                      >
                        <div className="font-bold text-lg text-gray-800">
                          {inicio.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {fin.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {inicio.toLocaleDateString('es-CL', {weekday: 'short', month: 'short', day: 'numeric'})}
                        </div>
                        <div className="text-xs text-green-600 font-semibold mt-2">✓ DISPONIBLE</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {inscrito && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">Inscripción Aceptada</h3>
            <p className="text-gray-600 mb-6">{inscrito.mensaje}</p>

            {/* Resumen de la inscripción */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="font-bold text-gray-800 mb-3">{inscrito.evaluacion.nombre}</div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ramo:</span>
                  <span className="font-semibold">{inscrito.evaluacion.ramo_codigo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-semibold">{inscrito.evaluacion.tipo_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tu horario:</span>
                  <span className="font-semibold text-green-600">
                    {new Date(inscrito.slot.fecha_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-semibold">
                    {new Date(inscrito.slot.fecha_hora_inicio).toLocaleDateString('es-CL')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duración:</span>
                  <span className="font-semibold">{inscrito.evaluacion.duracion_por_alumno} min</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Este horario aparecerá en tu calendario de evaluaciones agendadas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
