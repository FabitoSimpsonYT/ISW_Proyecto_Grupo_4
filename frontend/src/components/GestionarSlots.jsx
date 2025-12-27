import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getEventosProfesor } from '../services/evento.service';
import { getSlotsEvento, quitarAlumnoSlot, bloquearSlot, generarSlots } from '../services/slot.service';

export default function GestionarSlots() {
  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [eventoSel, setEventoSel] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEventos = async () => {
      setLoadingEventos(true);
      try {
        const res = await getEventosProfesor();
        // Filtramos solo los que son tipo slots
        const lista = (res?.data || res || []).filter(e => e.tipo_evaluacion === 'slots' || e.duracion_por_alumno);
        setEventos(lista);
      } catch (err) {
        console.error('Error cargando eventos profesor:', err);
        Swal.fire('Error', 'No se pudieron cargar tus eventos. ¿El servidor está disponible?', 'error');
        setEventos([]);
      } finally {
        setLoadingEventos(false);
      }
    };
    fetchEventos();
  }, []);

  const cargarSlots = async (ev) => {
    setEventoSel(ev);
    setLoading(true);
    try {
      const res = await getSlotsEvento(ev.id);
      setSlots(res?.data || res || []);
    } catch (err) {
      console.error('Error cargando slots:', err);
      const msg = err?.response?.data?.message || err.message || 'No se pudieron cargar los slots';
      Swal.fire('Error', msg + '. Intenta recargar o revisa la conexión.', 'error');
      setSlots([]);
    } finally { setLoading(false); }
  };

  const handleAccion = async (tipo, id, valor) => {
    try {
      if (tipo === 'quitar') await quitarAlumnoSlot(id);
      if (tipo === 'bloquear') await bloquearSlot(id, valor);
      Swal.fire('Éxito', 'Cambio realizado', 'success');
      cargarSlots(eventoSel); // Recargar
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleGenerarSlots = async () => {
    if (!eventoSel) return;
    const defaultDur = eventoSel.duracion_por_alumno || eventoSel.duracionPorAlumno || 30;
    const { value: duracion } = await Swal.fire({
      title: 'Duración por alumno (minutos)',
      input: 'number',
      inputLabel: 'Minutos por slot',
      inputValue: defaultDur,
      showCancelButton: true,
      inputAttributes: { min: 1 }
    });

    if (!duracion) return;
    setLoading(true);
    try {
      const res = await generarSlots(eventoSel.id, Number(duracion));
      if (res?.success) {
        Swal.fire('¡Listo!', res.message || 'Slots generados', 'success');
        cargarSlots(eventoSel);
      } else {
        Swal.fire('Atención', res?.message || 'No se generaron slots', 'warning');
      }
    } catch (err) {
      console.error('Error generarSlots:', err);
      const msg = err?.response?.data?.message || err.message || 'Error al generar slots';
      Swal.fire('Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
        <label className="block font-bold mb-2 text-[#0E2C66]">1. Selecciona el Evento con Slots:</label>
        <select 
          onChange={(e) => {
            const ev = eventos.find(x => String(x.id) === e.target.value);
            if(ev) cargarSlots(ev);
          }}
          className="w-full p-3 border-2 border-[#0E2C66] rounded-lg"
          disabled={loadingEventos}
        >
          <option value="">{loadingEventos ? 'Cargando eventos...' : 'Seleccionar...'}</option>
          {eventos.map(e => {
            const fechaInicio = new Date(e.fecha_inicio).toLocaleDateString();
            const tipoNombre = e.tipo_nombre || 'Sin tipo';
            return <option key={e.id} value={e.id}>
              {e.nombre} | {tipoNombre} | {e.ramo_codigo} | {fechaInicio}
            </option>;
          })}
        </select>
        {loadingEventos && <p className="text-sm text-gray-500 mt-2">Cargando tus eventos, espera...</p>}
      </div>

      {eventoSel && (
        <div>
          <div className="flex items-center justify-between mb-4">
             <div className="bg-blue-100 p-3 rounded-lg flex-1 mr-4 border-l-4 border-blue-600">
               <div className="font-bold text-lg">{eventoSel.nombre}</div>
               <div className="text-sm text-gray-700">
                 <span className="font-semibold">Tipo:</span> {eventoSel.tipo_nombre || 'Sin tipo'} | 
                 <span className="font-semibold ml-2">Ramo:</span> {eventoSel.ramo_codigo} | 
                 <span className="font-semibold ml-2">Modalidad:</span> {eventoSel.modalidad || 'Presencial'}
               </div>
               <div className="text-sm text-gray-600 mt-1">
                 {new Date(eventoSel.fecha_inicio).toLocaleDateString()} 
                 {' '}
                 {new Date(eventoSel.fecha_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                 {' - '}
                 {new Date(eventoSel.fecha_fin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
               </div>
             </div>
            <div>
              <button onClick={handleGenerarSlots} className="bg-blue-600 text-white px-3 py-2 rounded mr-2" disabled={loading}>
                Generar slots
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-center text-gray-600">Cargando slots...</p>
          ) : slots.length === 0 ? (
            <p className="text-center text-gray-600">No hay slots para este evento.</p>
          ) : (
            <div className="space-y-2 mb-4">
              <div className="text-sm font-semibold text-gray-700">
                Total de slots: <span className="text-blue-600">{slots.length}</span> | 
                Disponibles: <span className="text-green-600">{slots.filter(s => s.disponible).length}</span> | 
                Ocupados: <span className="text-red-600">{slots.filter(s => !s.disponible && s.alumno).length}</span> | 
                Bloqueados: <span className="text-gray-600">{slots.filter(s => !s.disponible && !s.alumno).length}</span>
              </div>
            </div>
          )}
          {!loading && slots.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {slots.map(slot => (
                <div 
                  key={slot.id} 
                  className={`p-6 border-4 rounded-2xl shadow-lg transition-all ${
                    slot.disponible 
                      ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl' 
                      : 'border-red-400 bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl'
                  }`}
                >
                  {/* Estado disponibilidad */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`px-3 py-1 rounded-full font-bold text-sm ${
                      slot.disponible ? 'bg-green-400 text-white' : 'bg-red-400 text-white'
                    }`}>
                      {slot.disponible ? '✓ DISPONIBLE' : '✗ OCUPADO'}
                    </div>
                  </div>

                  {/* Horario grande */}
                  <div className="mb-4 border-b-2 border-gray-300 pb-4">
                    <div className="text-3xl font-bold text-gray-800">
                      {new Date(slot.fecha_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(slot.fecha_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(slot.fecha_hora_fin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(slot.fecha_hora_inicio).toLocaleDateString('es-CL', {weekday: 'short', month: 'short', day: 'numeric'})}
                    </div>
                  </div>

                  {/* Info del alumno o "Libre" */}
                  <div className="mb-4 p-3 rounded-lg bg-white bg-opacity-70">
                    {slot.alumno ? (
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">INSCRITO:</div>
                        <div className="font-semibold text-gray-800">
                          {slot.alumno.nombres} {slot.alumno.apellidoPaterno}
                        </div>
                        <div className="text-xs text-gray-600">({slot.alumno.apellidoMaterno})</div>
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-green-600">LIBRE</div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 flex-wrap">
                    {!slot.disponible && (
                      <button 
                        onClick={() => handleAccion('quitar', slot.id)} 
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg font-bold text-sm transition" 
                        disabled={loading}
                      >
                        Liberar
                      </button>
                    )}
                    <button 
                      onClick={() => handleAccion('bloquear', slot.id, !slot.bloqueado)} 
                      className={`flex-1 text-white px-3 py-2 rounded-lg font-bold text-sm transition ${
                        slot.bloqueado ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                      disabled={loading}
                    >
                      {slot.bloqueado ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}