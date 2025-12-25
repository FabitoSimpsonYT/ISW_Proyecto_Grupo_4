// src/components/GestionarSlots.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getEventosProfesor } from '../services/evento.service';
import { getSlotsEvento, quitarAlumnoSlot, bloquearSlot } from '../services/slot.service';

export default function GestionarSlots() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      const res = await getEventosProfesor();
      // Filtrar eventos que probablemente usan slots
      const conSlots = res?.data?.filter?.(e => 
        e.tipoEvento?.nombre?.toLowerCase().includes('slot') ||
        e.tipoEvaluacion?.includes('oral') ||
        e.tipoEvaluacion?.includes('defensa') ||
        e.permiteParejas || e.tipoInscripcion !== 'individual'
      ) || [];
      setEventos(conSlots);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar los eventos', 'error');
    }
  };

  const seleccionarEvento = async (evento) => {
    setEventoSeleccionado(evento);
    try {
      const slotsData = await getSlotsEvento(evento.id);
      setSlots(slotsData || []);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar los slots de este evento', 'error');
    }
  };

  const handleQuitarAlumno = async (slotId) => {
    const result = await Swal.fire({
      title: '¿Quitar alumno de este slot?',
      text: "El slot volverá a estar disponible",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await quitarAlumnoSlot(slotId);
        setSlots(prev => prev.map(s => 
          s.id === slotId ? { ...s, alumno: null, disponible: true } : s
        ));
        Swal.fire('Éxito', 'Alumno removido del slot', 'success');
      } catch (err) {
        Swal.fire('Error', 'No se pudo quitar al alumno', 'error');
      }
    }
  };

  const handleBloquearSlot = async (slotId, bloquear) => {
    try {
      await bloquearSlot(slotId, bloquear);
      setSlots(prev => prev.map(s => 
        s.id === slotId ? { ...s, bloqueado: bloquear, disponible: !bloquear } : s
      ));
      Swal.fire('Éxito', bloquear ? 'Slot bloqueado' : 'Slot desbloqueado', 'success');
    } catch (err) {
      Swal.fire('Error', 'No se pudo cambiar el estado del slot', 'error');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestionar Slots</h2>

      {!eventoSeleccionado ? (
        <div>
          <h3 className="text-xl font-semibold mb-5">Selecciona un evento</h3>
          {eventos.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              No tienes eventos con sistema de slots / inscripción por horario
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventos.map(ev => (
                <div 
                  key={ev.id}
                  onClick={() => seleccionarEvento(ev)}
                  className="p-6 bg-white border rounded-xl hover:shadow-lg cursor-pointer transition-all hover:border-purple-300"
                >
                  <h4 className="font-bold text-lg mb-2">{ev.nombre}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 {new Date(ev.fecha_inicio).toLocaleDateString()} — {new Date(ev.fecha_fin).toLocaleDateString()}</p>
                    <p>🕒 Modalidad: {ev.modalidad}</p>
                    <p>⏱ Duración/alumno: {ev.duracionPorAlumno || '?'} min</p>
                    {ev.permiteParejas && <p className="text-purple-600 font-medium">Permite parejas/grupos</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setEventoSeleccionado(null)}
            className="mb-6 px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
          >
            ← Volver a lista de eventos
          </button>

          <h3 className="text-xl font-bold mb-6">
            Slots del evento: <span className="text-purple-700">{eventoSeleccionado.nombre}</span>
          </h3>

          {slots.length === 0 ? (
            <p className="text-center py-10 text-gray-500">Este evento aún no tiene slots generados</p>
          ) : (
            <div className="space-y-4">
              {slots.map(slot => (
                <div 
                  key={slot.id} 
                  className={`p-5 rounded-xl border shadow-sm transition-all ${
                    slot.bloqueado ? 'bg-gray-100 border-gray-400' : 
                    slot.disponible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg">
                        {new Date(slot.fecha_hora_inicio).toLocaleString([], {
                          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                        {' → '}
                        {new Date(slot.fecha_hora_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Duración: {eventoSeleccionado.duracionPorAlumno || '?'} min
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        slot.bloqueado ? 'bg-gray-600 text-white' :
                        slot.disponible ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {slot.bloqueado ? 'Bloqueado' : slot.disponible ? 'Disponible' : 'Ocupado'}
                      </span>
                    </div>
                  </div>

                  {slot.alumno ? (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="font-medium">Inscrito:</p>
                      <p>{slot.alumno.nombres} {slot.alumno.apellidoPaterno} {slot.alumno.apellidoMaterno}</p>
                      <p className="text-sm text-gray-500">{slot.alumno.email}</p>
                      <button
                        onClick={() => handleQuitarAlumno(slot.id)}
                        className="mt-2 text-sm text-red-600 hover:underline"
                      >
                        Quitar alumno
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic mt-3">Slot libre</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => handleBloquearSlot(slot.id, !slot.bloqueado)}
                      className={`px-4 py-2 text-sm rounded font-medium ${
                        slot.bloqueado 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {slot.bloqueado ? 'Desbloquear' : 'Bloquear'}
                    </button>

                    {/* Botón "Mover alumno" puedes implementar después */}
                    {!slot.disponible && !slot.bloqueado && (
                      <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        Mover a otro slot
                      </button>
                    )}
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