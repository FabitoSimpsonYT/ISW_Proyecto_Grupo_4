import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getEventosAlumno, getEventosDisponiblesParaSlot } from '../services/evento.service.js';
import { getSlotsDisponibles } from '../services/booking.service.js';
import { inscribirAlumno } from '../services/inscripcion.service.js';
import ModalInscripcion from '../components/Incripcion.jsx';

export default function InscribirEvaluaciones() {
  const [eventos, setEventos] = useState([]);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const cargar = async () => {
    try {
      // Preferir endpoint de eventos disponibles para slots si existe
      let res;
      try {
        res = await getEventosDisponiblesParaSlot();
      } catch (err) {
        res = await getEventosAlumno();
      }
      const data = res?.data || res || [];
      setEventos(data);
    } catch (err) {
      console.error('Error cargando eventos alumno:', err);
      Swal.fire('Error', 'No se pudieron cargar eventos', 'error');
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirInscripcion = async (evento) => {
    try {
      // solicitar slots si aplica
      const slotsRes = await getSlotsDisponibles(evento.id);
      const rawSlots = slotsRes?.data || slotsRes || [];
      // Normalizar keys para que el modal espere { id, inicio, fin, disponible }
      const slots = rawSlots.map(s => ({
        id: s.id || s.slot_id || s.slotId || `${evento.id}-${Math.random().toString(36).slice(2,6)}`,
        inicio: s.inicio || s.fecha_hora_inicio || s.fechaHoraInicio || s.fecha_inicio,
        fin: s.fin || s.fecha_hora_fin || s.fechaHoraFin || s.fecha_fin,
        disponible: s.disponible === undefined ? true : s.disponible
      }));
      const eventoConSlots = { ...evento, slotsDisponibles: slots };
      setSelectedEvento(eventoConSlots);
      setShowModal(true);
    } catch (err) {
      console.warn('No hay slots o error al cargar slots:', err);
      setSelectedEvento(evento);
      setShowModal(true);
    }
  };

  const onInscribir = async ({ eventoId, slotId, miembrosGrupo }) => {
    try {
      const payload = {
        eventoId,
        slotId: slotId || null,
      };
      // Si es pareja o grupo, el modal ya reúne miembros; enviar parejaAlumnoId/email no implementado frontend
      const res = await inscribirAlumno(payload);
      const ok = res?.mensaje || res?.success || res?.status === 201;
      if (ok) {
        Swal.fire('Éxito', 'Inscripción realizada', 'success');
        setShowModal(false);
        cargar();
      } else {
        Swal.fire('Error', (res?.error || res?.message) || 'No se pudo inscribir', 'error');
      }
    } catch (err) {
      console.error('Error al inscribir:', err);
      const msg = err?.response?.data?.error || err?.message || 'No se pudo inscribir';
      Swal.fire('Error', msg, 'error');
    }
  };

  const getDuracionPorAlumno = (ev) => {
    return ev.duracionPorAlumno || ev.duracion_por_alumno || ev.duracion_por_alumno_min || ev.duracion || null;
  };

  const getCupoDisponible = (ev) => {
    return ev.cupoDisponible || ev.cupo_disponible || ev.cupo_maximo || ev.cupoMaximo || null;
  };

  const getTipoInscripcion = (ev) => {
    return ev.tipoInscripcion || ev.tipo_inscripcion || ev.tipo_inscripcion_tipo || 'individual';
  };

  const calcularDuracionTotal = (ev, slots) => {
    const dur = parseInt(getDuracionPorAlumno(ev), 10) || 0;
    if (slots && slots.length > 0) return dur * slots.length;
    // fallback: use fecha_inicio/fecha_fin
    const inicio = ev.fecha_inicio || ev.fechaInicio || ev.fechaInicioProgramada || ev.fecha_inicio_programada;
    const fin = ev.fecha_fin || ev.fechaFin || ev.fechaFinProgramada || ev.fecha_fin_programada;
    if (inicio && fin) {
      const a = new Date(inicio);
      const b = new Date(fin);
      return Math.max(0, Math.round((b - a) / 60000));
    }
    return 0;
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Inscribir Evaluaciones</h2>

      <div className="grid grid-cols-1 gap-6">
        {eventos.length === 0 && (
          <div className="p-6 bg-white rounded shadow text-center">No hay evaluaciones disponibles</div>
        )}

        {eventos.map(ev => {
          const slots = ev.slotsDisponibles || ev.slots || [];
          const durPorAlumno = getDuracionPorAlumno(ev);
          const durTotal = calcularDuracionTotal(ev, slots);
          const tipoIns = getTipoInscripcion(ev);
          const cupo = getCupoDisponible(ev);

          return (
            <div key={ev.id} className="p-6 bg-white rounded-2xl shadow-md border flex flex-col md:flex-row items-start gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{ev.nombre || ev.titulo}</h3>
                <p className="text-gray-600 mb-3">{ev.descripcion}</p>

                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="text-xs text-gray-500">Duración por alumno</div>
                    <div className="font-semibold text-lg">{durPorAlumno ? `${durPorAlumno} min` : '—'}</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="text-xs text-gray-500">Duración total estimada</div>
                    <div className="font-semibold text-lg">{durTotal ? `${durTotal} min` : '—'}</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="text-xs text-gray-500">Modo inscripción</div>
                    <div className="font-semibold text-lg">{tipoIns === 'parejas' ? 'Pareja' : tipoIns === 'grupos' ? 'Grupo' : 'Individual'}</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="text-xs text-gray-500">Cupos disponibles</div>
                    <div className="font-semibold text-lg">{cupo ?? (slots.length > 0 ? slots.filter(s=>s.disponible!==false).length : '—')}</div>
                  </div>
                </div>

                {slots.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Horarios disponibles (ejemplo)</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {slots.slice(0,8).map((s, i) => (
                        <div key={i} className={`p-2 rounded text-sm border ${s.disponible===false ? 'bg-gray-100 text-red-400' : 'bg-white hover:shadow'} `}>
                          {new Date(s.inicio).toLocaleDateString()} {new Date(s.inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                <button onClick={() => abrirInscripcion(ev)} className="px-6 py-3 bg-[#0E2C66] text-white rounded-lg font-semibold">Inscribirse</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && selectedEvento && (
        <ModalInscripcion
          evento={selectedEvento}
          onClose={() => setShowModal(false)}
          onInscribir={(payload) => onInscribir({ eventoId: selectedEvento.id, slotId: payload.slotId, miembrosGrupo: payload.miembrosGrupo })}
        />
      )}
    </div>
  );
}
