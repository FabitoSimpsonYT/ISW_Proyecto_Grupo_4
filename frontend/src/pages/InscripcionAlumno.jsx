// src/pages/InscribirEvaluacionPage.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getEventosAlumno, getSlotsEvento, inscribirSlot } from '../services/evento.service';

export default function InscribirEvaluacionPage() {
  const [eventosSlots, setEventosSlots] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    cargarEventosSlots();
  }, []);

  const cargarEventosSlots = async () => {
    const eventos = await getEventosAlumno();
    const eventosConSlots = eventos.filter(e => e.tipoEvaluacion === 'slots');
    setEventosSlots(eventosConSlots);
  };

  const seleccionarEvento = async (evento) => {
    setEventoSeleccionado(evento);
    const slotsData = await getSlotsEvento(evento.id);
    setSlots(slotsData.filter(s => s.disponible));
  };

  const inscribir = async (slotId) => {
    try {
      await inscribirSlot(slotId);
      Swal.fire('Éxito', 'Te has inscrito correctamente', 'success');
      seleccionarEvento(eventoSeleccionado); // Recarga
    } catch (err) {
      Swal.fire('Error', 'No se pudo inscribir (slot ocupado o bloqueado)', 'error');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-10 text-center text-gray-800">
        Inscribir Evaluación por Slots
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Lista de evaluaciones por slots */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-300 p-8">
          <h2 className="text-xl font-semibold mb-6">Evaluaciones disponibles</h2>
          <div className="space-y-6">
            {eventosSlots.map(evento => (
              <button
                key={evento.id}
                onClick={() => seleccionarEvento(evento)}
                className={`w-full p-6 rounded-xl text-left transition shadow-md ${
                  eventoSeleccionado?.id === evento.id
                    ? 'bg-[#0E2C66] text-white'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <h3 className="text-lg font-bold">{evento.nombre}</h3>
                <p className="text-sm mt-2 opacity-80">
                  Rango: {evento.fecha_inicio} - {evento.fecha_fin}
                </p>
                <p className="text-sm opacity-80">
                  Duración por alumno: {evento.duracionPorAlumno} minutos
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Detalle y inscripción */}
        {eventoSeleccionado && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-300 p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#0E2C66]">
              {eventoSeleccionado.nombre}
            </h2>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl mb-8 border border-indigo-200">
              <p className="text-lg text-gray-800 mb-4">
                <strong>Descripción del profesor:</strong>
              </p>
              <p className="text-gray-700 italic">
                {eventoSeleccionado.descripcion || 'Sin descripción adicional'}
              </p>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <p className="text-sm text-gray-600">Duración por alumno</p>
                  <p className="text-xl font-bold text-indigo-800">
                    {eventoSeleccionado.duracionPorAlumno} minutos
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cupo máximo</p>
                  <p className="text-xl font-bold text-indigo-800">
                    {eventoSeleccionado.cupoMaximo}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de inscripción</p>
                  <p className="text-xl font-bold text-indigo-800">
                    {eventoSeleccionado.permiteParejas ? 'Individual o pareja' : 'Individual'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cupos disponibles</p>
                  <p className="text-xl font-bold text-green-600">
                    {slots.length}
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-6">Horarios disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.length === 0 ? (
                <p className="text-center text-gray-500 col-span-2 py-8">
                  No hay horarios disponibles en este momento
                </p>
              ) : (
                slots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => inscribir(slot.id)}
                    className="p-6 bg-green-50 border-2 border-green-300 rounded-xl hover:bg-green-100 transition shadow-md"
                  >
                    <p className="text-lg font-bold text-green-800">
                      {slot.fecha_hora_inicio} - {slot.fecha_hora_fin}
                    </p>
                    <p className="text-sm text-green-700 mt-2">
                      Disponible · Haz click para inscribirte
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}