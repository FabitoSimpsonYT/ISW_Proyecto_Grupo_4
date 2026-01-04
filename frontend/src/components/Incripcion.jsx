// src/components/ModalInscripcionGrupo.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ModalInscripcionGrupo({ evento, onClose, onInscribir }) {
  const [slotSeleccionado, setSlotSeleccionado] = useState('');
  const [miembrosGrupo, setMiembrosGrupo] = useState([]);
  const [emailNuevo, setEmailNuevo] = useState('');
  const [loading, setLoading] = useState(false);

  const agregarMiembro = () => {
    if (!emailNuevo.trim() || !emailNuevo.includes('@ubiobio.cl')) {
      toast.error('Email institucional inválido');
      return;
    }
    if (miembrosGrupo.some(m => m.alumnoEmail === emailNuevo)) {
      toast.error('Email duplicado');
      return;
    }
    setMiembrosGrupo([...miembrosGrupo, { alumnoEmail: emailNuevo }]);
    setEmailNuevo('');
  };

  const handleInscribir = () => {
    if (evento.tipoInscripcion === 'pareja' && miembrosGrupo.length !== 1) {
      toast.error('Debes agregar 1 compañero');
      return;
    }
    if (evento.tipoInscripcion === 'grupo' && miembrosGrupo.length < 1) {
      toast.error('Debes agregar al menos 1 compañero');
      return;
    }
    if (evento.slotsDisponibles?.length > 0 && !slotSeleccionado) {
      toast.error('Selecciona un horario');
      return;
    }

    onInscribir({
      eventoId: evento.id,
      slotId: slotSeleccionado || null,
      miembrosGrupo
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
          <div>
            <h2 className="text-2xl font-bold">{evento.nombre}</h2>
            <p className="text-sm text-gray-600">{evento.tipoInscripcion === 'individual' ? 'Individual' : evento.tipoInscripcion === 'pareja' ? 'Pareja (2)' : `Grupo (${evento.tamanioGrupo})`}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
            <p><strong>Fecha:</strong> {new Date(evento.fechaInicio).toLocaleDateString()}</p>
            <p><strong>Horario:</strong> {new Date(evento.fechaInicio).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})} - {new Date(evento.fechaFin).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}</p>
            <p><strong>Modalidad:</strong> {evento.modalidad === 'online' ? '💻 Online' : `🏫 ${evento.sala}`}</p>
            <p><strong>Cupos:</strong> {evento.cupoDisponible}</p>
          </div>

          {evento.slotsDisponibles?.length > 0 && (
            <div>
              <label className="block font-medium mb-2">Selecciona horario:</label>
              <div className="grid grid-cols-2 gap-2">
                {evento.slotsDisponibles.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSlotSeleccionado(slot.id)}
                    disabled={!slot.disponible}
                    className={`p-2 rounded border ${slotSeleccionado === slot.id ? 'bg-blue-500 text-white' : slot.disponible ? 'hover:border-blue-300' : 'bg-gray-100 opacity-50 cursor-not-allowed'}`}
                  >
                    {new Date(slot.inicio).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})} - {new Date(slot.fin).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
                    {!slot.disponible && <span className="text-xs block text-red-600">Ocupado</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {evento.tipoInscripcion !== 'individual' && (
            <div>
              <label className="block font-medium mb-2">Miembros ({1 + miembrosGrupo.length}/{evento.tamanioGrupo}):</label>
              
              <div className="space-y-2 mb-3">
                <div className="p-2 bg-gray-50 rounded">Tú (Líder)</div>
                {miembrosGrupo.map((m, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{m.alumnoEmail}</span>
                    <button onClick={() => setMiembrosGrupo(miembrosGrupo.filter((_, idx) => idx !== i))} className="text-red-600">🗑️</button>
                  </div>
                ))}
              </div>

              {miembrosGrupo.length < evento.tamanioGrupo - 1 && (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailNuevo}
                    onChange={(e) => setEmailNuevo(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && agregarMiembro()}
                    placeholder="email@ubiobio.cl"
                    className="flex-1 px-4 py-2 border rounded"
                  />
                  <button onClick={agregarMiembro} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">➕</button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={onClose} className="flex-1 px-6 py-3 border rounded hover:bg-gray-50">Cancelar</button>
            <button onClick={handleInscribir} disabled={loading} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Inscribiendo...' : 'Inscribirse'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}