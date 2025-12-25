// src/components/CrearEventoForm.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { crearEvento } from '../services/evento.service.js';
import { getTiposEventos } from '../services/tipoEvento.service.js';

export default function CrearEventoForm({ onSaved }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'pendiente',
    comentario: '',
    tipoEvento: '',
    modalidad: 'presencial',
    linkOnline: '',
    tipoEvaluacion: 'escrita',
    fechaInicio: '',
    horaInicio: '',
    fechaFin: '',
    horaFin: '',
    fechaRangoInicio: '',
    fechaRangoFin: '',
    duracionPorAlumno: '',
    cupoMaximo: 40,
    ramoId: '',
    seccionId: '',
    sala: '',
    tipoInscripcion: 'individual',
    numAlumnosOnline: '',
    tamanoGrupo: ''
  });

  const [tiposEventos, setTiposEventos] = useState([]);
  const [ramos, setRamos] = useState([]); // Lista de ramos
  const [secciones, setSecciones] = useState([]); // Todas las secciones
  const [seccionesFiltradas, setSeccionesFiltradas] = useState([]); // Secciones del ramo seleccionado

  useEffect(() => {
    // Cargar tipos de eventos
    const cargar = async () => {
      try {
        const res = await getTiposEventos();
        const tiposData = res?.data || res || [];
        setTiposEventos(tiposData);
      } catch (err) {
        // fallback temporal
        setTiposEventos([
          { id: 1, nombre: 'EVALUACION' },
          { id: 2, nombre: 'CONFERENCIA' },
          { id: 3, nombre: 'REUNION' }
        ]);
      }
    };
    cargar();

    const onTipos = () => cargar();
    window.addEventListener('tiposUpdated', onTipos);
    return () => window.removeEventListener('tiposUpdated', onTipos);

    // Cargar ramos (temporal - luego desde API)
    setRamos([
      { id: 1, codigo: 'DERECHO-101', nombre: 'Derecho Civil I' },
      { id: 2, codigo: 'DERECHO-102', nombre: 'Derecho Penal' },
      { id: 3, codigo: 'DERECHO-201', nombre: 'Derecho Constitucional' }
    ]);

    // Cargar secciones (temporal)
    setSecciones([
      { id: 1, numero: 'SEC-1', ramoId: 1 },
      { id: 2, numero: 'SEC-2', ramoId: 1 },
      { id: 3, numero: 'SEC-1', ramoId: 2 },
      { id: 4, numero: 'SEC-1', ramoId: 3 }
    ]);
  }, []);

  // Filtrar secciones cuando cambia el ramo
  useEffect(() => {
    if (formData.ramoId) {
      const filtradas = secciones.filter(sec => sec.ramoId === parseInt(formData.ramoId));
      setSeccionesFiltradas(filtradas);
      // Reset seccion si no pertenece al ramo nuevo
      if (!filtradas.find(sec => sec.id === parseInt(formData.seccionId))) {
        setFormData(prev => ({ ...prev, seccionId: '' }));
      }
    } else {
      setSeccionesFiltradas([]);
      setFormData(prev => ({ ...prev, seccionId: '' }));
    }
  }, [formData.ramoId, secciones]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.estado === 'cancelado' && !formData.comentario.trim()) {
      Swal.fire('Error', 'El comentario es obligatorio para cancelar un evento', 'error');
      return;
    }

    try {
      // Normalizar tipos antes de enviar
      const payload = {
        ...formData,
        tipoEvento: formData.tipoEvento ? parseInt(formData.tipoEvento) : null,
        ramoId: formData.ramoId ? parseInt(formData.ramoId) : null,
        seccionId: formData.seccionId ? parseInt(formData.seccionId) : null,
        duracionPorAlumno: formData.duracionPorAlumno ? parseInt(formData.duracionPorAlumno) : null,
        cupoMaximo: formData.cupoMaximo ? parseInt(formData.cupoMaximo) : 40,
      };

      const res = await crearEvento(payload);
      console.log('Respuesta crear evento:', res);
      Swal.fire('Éxito', 'Evento creado correctamente', 'success');
      // notificar a calendario para que recargue eventos
      window.dispatchEvent(new CustomEvent('eventosUpdated'));
      onSaved();
    } catch (err) {
      console.error('Error creando evento:', err);
      const msg = err?.response?.data?.message || err?.message || 'Error al crear evento';
      Swal.fire('Error', msg, 'error');
    }
  };

  // Generar preview de slots: asume horario diario 09:00 - 17:00
  const generarPreviewSlots = () => {
    if (formData.tipoEvaluacion !== 'slots' || !formData.fechaRangoInicio || !formData.fechaRangoFin || !formData.duracionPorAlumno) return [];
    const inicioDiaMin = 9; // 09:00
    const finDiaMin = 17; // 17:00
    const dur = parseInt(formData.duracionPorAlumno, 10);
    if (!dur || dur <= 0) return [];

    const start = new Date(formData.fechaRangoInicio + 'T00:00:00');
    const end = new Date(formData.fechaRangoFin + 'T00:00:00');
    if (end < start) return [];

    const slots = [];
    let current = new Date(start);
    while (current <= end) {
      // generar slots para el día
      let slotStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), inicioDiaMin, 0, 0);
      const dayEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), finDiaMin, 0, 0);
      while (slotStart.getTime() + dur * 60 * 1000 <= dayEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + dur * 60 * 1000);
        slots.push({ inicio: slotStart.toISOString(), fin: slotEnd.toISOString() });
        if (formData.cupoMaximo && slots.length >= parseInt(formData.cupoMaximo, 10)) break;
        slotStart = slotEnd;
      }
      if (formData.cupoMaximo && slots.length >= parseInt(formData.cupoMaximo, 10)) break;
      current.setDate(current.getDate() + 1);
    }

    return slots;
  };

  const previewSlots = generarPreviewSlots();
  const totalDuracionMin = previewSlots.length * (formData.duracionPorAlumno ? parseInt(formData.duracionPorAlumno, 10) : 0);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Crear Nuevo Evento</h2>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        {/* Nombre y Tipo de evento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del evento *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej. Certamen 1 - Derecho Civil"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de evento *
            </label>
            <select
              name="tipoEvento"
              value={formData.tipoEvento}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66]"
              required
            >
              <option value="">Seleccionar tipo...</option>
              {tiposEventos.map(tipo => (
                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Detalles adicionales..."
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66]"
          />
        </div>

        {/* Modalidad y Link online */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modalidad *
            </label>
            <select
              name="modalidad"
              value={formData.modalidad}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66]"
              required
            >
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
            </select>
          </div>

          {formData.modalidad === 'online' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link de la reunión (opcional)
              </label>
              <input
                type="url"
                name="linkOnline"
                value={formData.linkOnline}
                onChange={handleChange}
                placeholder="Ej. https://meet.google.com/abc-defg-hij"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66]"
              />
            </div>
          )}

          {formData.modalidad === 'online' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número de alumnos (online)</label>
              <input
                type="number"
                name="numAlumnosOnline"
                value={formData.numAlumnosOnline}
                onChange={handleChange}
                min={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Ej. 100"
              />
            </div>
          )}
        </div>

        {/* Tipo de evaluación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Tipo de evaluación *
          </label>
          <div className="flex gap-12">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="tipoEvaluacion"
                value="escrita"
                checked={formData.tipoEvaluacion === 'escrita'}
                onChange={handleChange}
                className="w-5 h-5 text-[#0E2C66]"
              />
              <span className="text-gray-700">Escrita (fecha y hora fija)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="tipoEvaluacion"
                value="slots"
                checked={formData.tipoEvaluacion === 'slots'}
                onChange={handleChange}
                className="w-5 h-5 text-[#0E2C66]"
              />
              <span className="text-gray-700">Por slots (alumnos eligen horario)</span>
            </label>
          </div>
        </div>

        {/* Modo de inscripción (individual, parejas, grupos) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modo de inscripción</label>
            <select
              name="tipoInscripcion"
              value={formData.tipoInscripcion}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            >
              <option value="individual">Individual</option>
              <option value="parejas">Parejas</option>
              <option value="grupos">Grupos</option>
            </select>
          </div>

          {formData.tipoInscripcion === 'grupos' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño del grupo</label>
              <input
                type="number"
                name="tamanoGrupo"
                value={formData.tamanoGrupo}
                onChange={handleChange}
                min={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Ej. 3"
              />
            </div>
          )}
        </div>

        {/* Fechas según tipo */}
        {formData.tipoEvaluacion === 'escrita' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha y hora inicio *
              </label>
              <input
                type="datetime-local"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha y hora fin *
              </label>
              <input
                type="datetime-local"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha inicio del rango *
                </label>
                <input
                  type="date"
                  name="fechaRangoInicio"
                  value={formData.fechaRangoInicio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha fin del rango *
                </label>
                <input
                  type="date"
                  name="fechaRangoFin"
                  value={formData.fechaRangoFin}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración por alumno (minutos) *
              </label>
              <input
                type="number"
                name="duracionPorAlumno"
                value={formData.duracionPorAlumno}
                onChange={handleChange}
                placeholder="Ej. 30"
                className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
        )}

        {/* Ramo y Sección - AHORA MENÚS DESPLEGABLES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ramo *
            </label>
            <select
              name="ramoId"
              value={formData.ramoId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66]"
              required
            >
              <option value="">Seleccionar ramo...</option>
              {ramos.map(ramo => (
                <option key={ramo.id} value={ramo.id}>
                  {ramo.codigo} - {ramo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sección *
            </label>
            <select
              name="seccionId"
              value={formData.seccionId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66]"
              required
              disabled={!formData.ramoId}
            >
              <option value="">
                {formData.ramoId ? 'Seleccionar sección...' : 'Primero seleccione un ramo'}
              </option>
              {seccionesFiltradas.map(seccion => (
                <option key={seccion.id} value={seccion.id}>
                  {seccion.numero}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sala */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sala {formData.modalidad === 'presencial' ? '*' : '(opcional)'}
          </label>
          <input
            type="text"
            name="sala"
            value={formData.sala}
            onChange={handleChange}
            placeholder="Ej. Sala 301"
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg"
            required={formData.modalidad === 'presencial'}
          />
        </div>

        {/* Estado y comentario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="reagendado">Reagendado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {formData.estado === 'cancelado' && (
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                Comentario (obligatorio) *
              </label>
              <textarea
                name="comentario"
                value={formData.comentario}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-red-300 rounded-lg"
                required
              />
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-center gap-6 pt-6">
          <button
            type="button"
            onClick={onSaved}
            className="px-10 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-10 py-4 bg-[#0E2C66] text-white rounded-lg hover:bg-[#0a1f4d] font-medium shadow-lg transition"
          >
            Crear Evento
          </button>
        </div>
      </form>

      {/* PREVIEW: si es por slots mostrar resumen y primeras franjas */}
      {formData.tipoEvaluacion === 'slots' && previewSlots.length > 0 && (
        <div className="mt-8 max-w-4xl mx-auto p-6 bg-white rounded-lg shadow border">
          <h3 className="text-xl font-semibold mb-4">Vista previa: Rangos generados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-lg font-bold">{formData.nombre || 'Nombre del evento'}</p>
              <p className="text-sm text-gray-600">Duración por alumno: <strong>{formData.duracionPorAlumno} min</strong></p>
              <p className="text-sm text-gray-600">Duración total estimada: <strong>{totalDuracionMin} min</strong></p>
              <p className="text-sm text-gray-600">Modo inscripción: <strong>{formData.tipoInscripcion}</strong></p>
              <p className="text-sm text-gray-600">Cupos máximos: <strong>{formData.cupoMaximo}</strong></p>
            </div>

            <div>
              <p className="font-medium mb-2">Primeras franjas:</p>
              <div className="space-y-2">
                {previewSlots.slice(0, 6).map((s, idx) => (
                  <div key={idx} className="text-sm p-2 rounded border bg-gray-50">
                    {new Date(s.inicio).toLocaleDateString()} — {new Date(s.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ➜ {new Date(s.fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
                {previewSlots.length > 6 && <div className="text-xs text-gray-500">+{previewSlots.length - 6} franjas más</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}