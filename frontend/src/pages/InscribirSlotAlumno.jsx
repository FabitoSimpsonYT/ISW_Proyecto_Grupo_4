import { useEffect, useState } from 'react';
import { getEventosDisponiblesParaSlot } from '../services/evento.service';
import { getSlotsEvento, inscribirSlot } from '../services/slot.service';
import toast from 'react-hot-toast';

export default function InscribirSlotsAlumno() {
  const [eventos, setEventos] = useState([]);
  const [slots, setSlots] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [slotsVisibles, setSlotsVisibles] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    getEventosDisponiblesParaSlot().then(res => {
      setEventos(res?.data || res || []);
    });
  }, []);

  const handleSeleccionarEvento = async (eventoId) => {
    // Si ya tenemos slots cargados y el evento es el mismo, solo toggle la visibilidad
    if (eventoSeleccionado === eventoId) {
      setSlotsVisibles(!slotsVisibles);
      return;
    }

    setEventoSeleccionado(eventoId);
    setSlotsVisibles(true);
    setLoadingSlots(true);
    try {
      const res = await getSlotsEvento(eventoId);
      // Añadir cupo_actual y cupo_maximo si no existen en el slot
      const slotsConCupo = (res?.data || res || []).map(slot => ({
        ...slot,
        cupo_actual: slot.cupo_actual !== undefined ? slot.cupo_actual : slot.alumno ? 1 : 0,
        cupo_maximo: slot.cupo_maximo !== undefined ? slot.cupo_maximo : 1 // Por defecto 1 si no existe
      }));
      setSlots(slotsConCupo);
    } catch {
      setSlots([]);
    }
    setLoadingSlots(false);
  };

  const handleInscribir = async (slotId) => {
    try {
      console.log('[InscribirSlotAlumno] Intento de inscripción en slot:', slotId);
      await inscribirSlot(slotId);
      console.log('[InscribirSlotAlumno] Inscripción exitosa');
      toast.success('Te has inscrito correctamente en el slot.');
      handleSeleccionarEvento(eventoSeleccionado);
    } catch (error) {
      console.error('[InscribirSlotAlumno] Error:', error);
      toast.error(error.message || 'No se pudo inscribir en el slot.');
    }
  };

  // Agrupar slots por fecha
  const agruparSlotsPorFecha = (slots) => {
    const agrupados = {};
    slots.forEach(slot => {
      const fecha = slot.fecha ? new Date(slot.fecha).toLocaleDateString('es-ES') : 'Sin fecha';
      if (!agrupados[fecha]) {
        agrupados[fecha] = [];
      }
      agrupados[fecha].push(slot);
    });
    return agrupados;
  };

  return (

    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-200 px-2 sm:px-4">
      <div className="max-w-4xl w-full mx-auto p-2 sm:p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-300 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-[#0E2C66]">🕒 Inscribir en Slots de Evaluaciones</h2>
          <div className="mb-6 sm:mb-10">
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-[#0E2C66]">Evaluaciones con inscripción por slots</h3>
            {eventos.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-lg">No hay evaluaciones con inscripción por slots aún.</div>
            )}
            <div className="flex flex-col gap-4 sm:gap-6">
              {eventos.map(ev => (
                <div key={ev.id} className="rounded-2xl border-2 bg-gradient-to-r from-indigo-200 via-blue-100 to-purple-100 shadow p-4 sm:p-6 flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <div className="text-xl font-bold text-[#0E2C66]">{ev.nombre}</div>
                    {ev.inscritoEnSlot && (
                      <span className="text-green-700 font-bold text-xs px-3 py-1 rounded bg-green-100 inline-block">Tu reserva</span>
                    )}
                  </div>
                  <div className="text-gray-700 text-xs sm:text-sm mb-1"><b>Tipo:</b> {ev.tipo_nombre || ev.tipoEvento}</div>
                  <div className="text-gray-700 text-xs sm:text-sm mb-1"><b>Descripción:</b> {ev.descripcion || '-'}</div>
                  <div className="text-gray-700 text-xs sm:text-sm mb-1"><b>Fecha:</b> {ev.fecha_inicio ? new Date(ev.fecha_inicio).toLocaleDateString() : '-'} {ev.fecha_inicio ? 'a' : ''} {ev.fecha_fin ? new Date(ev.fecha_fin).toLocaleDateString() : ''}</div>
                  <div className="text-gray-700 text-xs sm:text-sm mb-1"><b>Horas:</b> {ev.fecha_inicio ? new Date(ev.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'} a {ev.fecha_fin ? new Date(ev.fecha_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                  <div className="text-gray-700 text-xs sm:text-sm mb-1"><b>Duración:</b> {ev.duracion_por_alumno || '-'} minutos</div>
                  <div className="text-gray-700 text-xs sm:text-sm mb-1"><b>Modalidad:</b> {ev.modalidad}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button
                      className="bg-[#0E2C66] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#143A80] transition shadow-lg"
                      onClick={() => handleSeleccionarEvento(ev.id)}
                      disabled={ev.inscritoEnSlot}
                    >
                      {ev.inscritoEnSlot ? 'Ya inscrito' : (eventoSeleccionado === ev.id && slotsVisibles ? 'Ocultar slots' : 'Ver slots')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {loadingSlots && <p className="text-center text-lg text-gray-500">Cargando slots...</p>}
          {!loadingSlots && eventoSeleccionado && slotsVisibles && (
            <div>
              <h3 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-[#0E2C66] text-center">Slots disponibles</h3>
              {slots.length === 0 && <p className="text-center text-gray-500">No hay slots disponibles para esta evaluación.</p>}
              <div className="space-y-6">
                {Object.entries(agruparSlotsPorFecha(slots)).map(([fecha, slotsDelDia]) => (
                  <div key={fecha}>
                    <h4 className="font-bold text-base sm:text-lg mb-3 pb-2 border-b-2 border-[#0E2C66] text-[#0E2C66]">
                      📅 {fecha}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                      {slotsDelDia.map(slot => {
                  let estado = 'disponible';
                  if (slot.inscrito) estado = 'reserva';
                  else if (slot.cupo_actual >= slot.cupo_maximo) estado = 'ocupado';
                  return (
                    <div
                      key={slot.id}
                      className={`rounded-xl border-2 p-3 sm:p-4 flex flex-col gap-2 shadow transition text-center
                        ${estado === 'reserva' ? 'border-green-600 bg-green-50' : ''}
                        ${estado === 'ocupado' ? 'border-gray-300 bg-gray-100 opacity-60' : ''}
                        ${estado === 'disponible' ? 'border-green-400 bg-green-50' : ''}
                      `}
                    >
                      <div className="flex justify-center items-center gap-2 text-base sm:text-lg font-bold mb-2 flex-wrap">
                        <span className="text-[#0E2C66]">{slot.hora_inicio || (slot.fecha_hora_inicio ? new Date(slot.fecha_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-')}</span>
                        <span className="text-gray-600">-</span>
                        <span className="text-[#0E2C66]">{slot.hora_fin || (slot.fecha_hora_fin ? new Date(slot.fecha_hora_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-')}</span>
                      </div>
                      <div className="text-gray-700 text-xs sm:text-sm mb-1"><b>Modalidad:</b> {slot.modalidad}</div>
                      <div className="text-gray-700 text-xs sm:text-sm mb-1"><b>Cupo:</b> {slot.cupo_actual} / {slot.cupo_maximo}</div>
                      {estado === 'reserva' && (
                        <span className="text-green-700 font-bold text-xs px-2 py-1 rounded bg-green-200 inline-block">✓ Este slot está en mi agenda</span>
                      )}
                      {estado === 'ocupado' && (
                        <span className="text-gray-500 font-bold text-xs px-2 py-1 rounded bg-gray-200 inline-block">Ocupado</span>
                      )}
                      {estado === 'disponible' && (
                        <span className="text-green-700 font-bold text-xs px-2 py-1 rounded bg-green-100 inline-block">Disponible</span>
                      )}
                      <div className="mt-2">
                        {estado === 'disponible' ? (
                          <button
                            className="bg-[#0E2C66] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#143A80] transition shadow-lg"
                            onClick={() => handleInscribir(slot.id)}
                          >
                            Inscribirse
                          </button>
                        ) : estado === 'reserva' ? (
                          <span className="text-green-700 font-bold text-sm">Inscrito en este slot</span>
                        ) : (
                          <button
                            className="bg-gray-400 text-white px-4 py-2 rounded-lg font-bold cursor-not-allowed opacity-70"
                            disabled
                          >
                            Sin cupo
                          </button>
                        )}
                      </div>
                    </div>
                      );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-6 mt-6 sm:mt-8 justify-center text-xs sm:text-sm">
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-400 inline-block"></span>Disponible</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-600 inline-block"></span>Tu reserva</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-400 inline-block"></span>Ocupado</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

