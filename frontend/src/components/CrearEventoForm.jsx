// src/components/CrearEventoForm.jsx
import { useState, useEffect } from 'react';
import { getBloqueos } from '../services/bloqueo.service.js';
import Swal from 'sweetalert2';
import { crearEvento, actualizarEvento } from '../services/evento.service.js';
import { getTiposEventos } from '../services/tipoEvento.service.js';
import { getSeccionesByRamo, getMisRamos, getRamosByCodigo } from '../services/ramos.service.js';
import { generarSlots } from '../services/slot.service.js';

export default function CrearEventoForm({ onSaved, evento }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'pendiente',
    comentario: '',
    tipoEvento: '',
    modalidad: 'presencial',
    linkOnline: '',
    tipoEvaluacion: 'escrita',
    fechaDia: '',
    horaInicio: '08:00',
    horaFin: '20:00',
    duracionMinutos: '',
    fechaRangoInicio: '',
    fechaFinRango: '',
    horaInicioDiaria: '',
    horaFinDiaria: '',
    duracionPorAlumno: '',
    cupoMaximo: 40,
    ramoId: '',
    seccionId: '',
    sala: '',
  });

  const [tiposEventos, setTiposEventos] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [secciones, setSecciones] = useState([]);
  const [loadingSecciones, setLoadingSecciones] = useState(false);
  const [misRamos, setMisRamos] = useState([]);
  const [loadingRamos, setLoadingRamos] = useState(true);
  const [generandoSlots, setGenerandoSlots] = useState(false);

  // Bloqueos
  const [bloqueos, setBloqueos] = useState([]);

  useEffect(() => {
    // Cargar bloqueos al montar
    const cargarBloqueos = async () => {
      try {
        const res = await getBloqueos();
        setBloqueos(Array.isArray(res) ? res : res?.data || []);
      } catch (err) {
        setBloqueos([]);
      }
    };
    cargarBloqueos();
  }, []);

  const resetearFormulario = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      estado: 'pendiente',
      comentario: '',
      tipoEvento: '',
      modalidad: 'presencial',
      linkOnline: '',
      tipoEvaluacion: 'escrita',
      fechaDia: '',
      horaInicio: '',
      horaFin: '',
      duracionMinutos: '',
      fechaRangoInicio: '',
      fechaFinRango: '',
      horaInicioDiaria: '',
      horaFinDiaria: '',
      duracionPorAlumno: '',
      cupoMaximo: 40,
      ramoId: '',
      seccionId: '',
      sala: '',
    });
    setSecciones([]);
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // ✅ CARGAR DATOS DEL EVENTO cuando se pasa un evento para editar
  useEffect(() => {
    if (evento && evento.id) {
      console.log('📝 Cargando evento para editar:', evento);
      
      // Parsear las fechas y horas
      const fechaInicio = new Date(evento.fecha_inicio);
      const fechaFin = new Date(evento.fecha_fin);
      
      const fechaDia = fechaInicio.toISOString().split('T')[0];
      const horaInicio = `${String(fechaInicio.getHours()).padStart(2, '0')}:${String(fechaInicio.getMinutes()).padStart(2, '0')}`;
      const horaFin = `${String(fechaFin.getHours()).padStart(2, '0')}:${String(fechaFin.getMinutes()).padStart(2, '0')}`;
      
      // Calcular duración en minutos
      const duracionMs = fechaFin - fechaInicio;
      const duracionMinutos = duracionMs / (1000 * 60);
      
      // Actualizar el formulario
      setFormData(prev => ({
        ...prev,
        nombre: evento.nombre || '',
        descripcion: evento.descripcion || '',
        estado: evento.estado || 'pendiente',
        comentario: evento.comentario || '',
        tipoEvento: evento.tipo_evento_id || evento.tipoEvento || '',
        modalidad: evento.modalidad || 'presencial',
        linkOnline: evento.linkOnline || evento.link_online || '',
        tipoEvaluacion: evento.tipoEvaluacion || 'escrita',
        fechaDia: fechaDia,
        horaInicio: horaInicio,
        horaFin: horaFin,
        duracionMinutos: duracionMinutos || '',
        cupoMaximo: evento.cupo_maximo || evento.cupoMaximo || 40,
        ramoId: evento.ramo_id || evento.ramoId || '',
        seccionId: evento.seccion_id || evento.seccionId || '',
        sala: evento.sala || '',
      }));

      // Cargar las secciones del ramo seleccionado
      if (evento.ramo_id || evento.ramoId) {
        const ramoId = evento.ramo_id || evento.ramoId;
        const cargarSeccionesDelEvento = async () => {
          try {
            const res = await getSeccionesByRamo(evento.ramo?.codigo || ramoId);
            const seccionesData = Array.isArray(res) ? res : res?.data || [];
            setSecciones(seccionesData);
          } catch (err) {
            console.error('Error cargando secciones:', err);
          }
        };
        cargarSeccionesDelEvento();
      }
    }
  }, [evento]);

  const cargarDatosIniciales = async () => {
    try {
      setLoadingTipos(true);
      setLoadingRamos(true);

      const [tiposRes, ramosRes] = await Promise.all([
        getTiposEventos(),
        getMisRamos()
      ]);

      const tipos = Array.isArray(tiposRes) ? tiposRes : tiposRes?.data || [];
      const ramos = Array.isArray(ramosRes) ? ramosRes : ramosRes?.data || [];

      console.log('📚 Ramos cargados:', ramos);
      setTiposEventos(tipos);
      setMisRamos(ramos);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      Swal.fire('Error', 'No se pudieron cargar los datos iniciales', 'error');
    } finally {
      setLoadingTipos(false);
      setLoadingRamos(false);
    }
  };

  // ✅ CARGAR SECCIONES cuando cambia ramoId
  useEffect(() => {
    if (!formData.ramoId) {
      setSecciones([]);
      return;
    }

    const cargarSecciones = async () => {
      setLoadingSecciones(true);
      try {
        // Buscar el ramo seleccionado por codigo o id
        const ramoSeleccionado = misRamos.find(r => String(r.codigo) === String(formData.ramoId) || String(r.id) === String(formData.ramoId));

        // Si el ramo ya trae secciones (por ejemplo ramos dictados), úsalas directamente
        if (ramoSeleccionado && Array.isArray(ramoSeleccionado.secciones) && ramoSeleccionado.secciones.length > 0) {
          const seccionesData = ramoSeleccionado.secciones.map(s => ({ id: s.id ?? s.numero, numero: s.numero }));
          setSecciones(seccionesData);
          setLoadingSecciones(false);
          return;
        }

        // Si no encontramos objeto con secciones completas, intentar obtener por codigo
        const codigoRamo = (ramoSeleccionado && (ramoSeleccionado.codigo || ramoSeleccionado.codigoRamo)) || formData.ramoId;

        console.log('🔍 Cargando secciones para el ramo (codigo):', codigoRamo);

        const res = await getSeccionesByRamo(codigoRamo);

        const seccionesData = Array.isArray(res) ? res : res?.data || [];
        console.log('✅ Secciones cargadas:', seccionesData);
        setSecciones(seccionesData);
      } catch (err) {
        console.error('❌ Error cargando secciones:', err);
        Swal.fire('Error', 'No se pudieron cargar las secciones de este ramo', 'warning');
        setSecciones([]);
      } finally {
        setLoadingSecciones(false);
      }
    };

    cargarSecciones();
  }, [formData.ramoId, misRamos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Si es presencial, forzar horario fijo
    if (
      (name === 'modalidad' && value === 'presencial') ||
      (name === 'tipoEvaluacion' && value === 'escrita')
    ) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        horaInicio: '08:00',
        horaFin: '21:00',
      }));
    } else if (name === 'ramoId') {
      setFormData(prev => ({ ...prev, ramoId: value, seccionId: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!formData.nombre || !formData.tipoEvento || !formData.ramoId || !formData.seccionId) {
      Swal.fire('Error', 'Completa todos los campos obligatorios', 'warning');
      return;
    }

    // Validar que la fecha no esté bloqueada
    let fechaEvento = null;
    if (formData.modalidad === 'presencial' && formData.tipoEvaluacion === 'escrita') {
      fechaEvento = formData.fechaDia;
    } else if (formData.tipoEvaluacion === 'slots') {
      fechaEvento = formData.fechaRangoInicio;
    }
    if (fechaEvento) {
      // Buscar si la fecha está bloqueada
      const bloqueado = bloqueos.some(b => {
        // Usar fechaInicio/fechaFin o fallback a inicio/fin
        const rawInicio = b.fechaInicio || b.inicio || b.fecha_inicio;
        const rawFin = b.fechaFin || b.fin || b.fecha_fin;
        if (!rawInicio || !rawFin) return false;
        const inicio = typeof rawInicio === 'string' ? rawInicio.split('T')[0] : new Date(rawInicio).toISOString().split('T')[0];
        const fin = typeof rawFin === 'string' ? rawFin.split('T')[0] : new Date(rawFin).toISOString().split('T')[0];
        return fechaEvento >= inicio && fechaEvento <= fin;
      });
      if (bloqueado) {
        alert('No se puede crear un evento en un día bloqueado por la jefatura.');
        Swal.fire('Error', 'No se puede crear un evento en un día bloqueado por la jefatura.', 'error');
        return;
      }
    }

    if (formData.estado === 'cancelado' && !formData.comentario.trim()) {
      Swal.fire('Error', 'El comentario es obligatorio al cancelar', 'warning');
      return;
    }

    // Validación 4 horas para presencial escrita
    if (formData.modalidad === 'presencial' && formData.tipoEvaluacion === 'escrita') {
      if (!formData.fechaDia || !formData.horaInicio) {
        Swal.fire('Error', 'Debes especificar fecha y hora de inicio', 'warning');
        return;
      }

      const inicioEvento = new Date(`${formData.fechaDia}T${formData.horaInicio}:00`);
      const horasAnticipacion = (inicioEvento - new Date()) / (1000 * 60 * 60);
      
      if (horasAnticipacion < 4) {
        Swal.fire('Error', 'La evaluación debe programarse con al menos 4 horas de anticipación', 'error');
        return;
      }
    }

    try {
      setGenerandoSlots(true);

      // Asegurar que enviamos el `ramoId` numérico esperado por el backend.
      let ramoIdNumeric = Number(formData.ramoId);

      // Si no es numérico, intentar obtener el ramo por código y tomar su id
      if (!ramoIdNumeric || isNaN(ramoIdNumeric)) {
        try {
          const ramoDetalle = await getRamosByCodigo(formData.ramoId);
          ramoIdNumeric = ramoDetalle?.id || ramoDetalle?.data?.id || ramoIdNumeric;
        } catch (err) {
          console.warn('No se pudo resolver ramoId numérico por codigo:', err);
        }
      }

      let payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        estado: formData.estado,
        comentario: formData.comentario.trim() || null,
        tipoEvento: Number(formData.tipoEvento),
        modalidad: formData.modalidad,
        linkOnline: formData.modalidad === 'online' ? formData.linkOnline.trim() || null : null,
        ramoId: ramoIdNumeric,
        seccionId: Number(formData.seccionId),
        cupoMaximo: Number(formData.cupoMaximo) || 40,
        sala: formData.modalidad === 'presencial' ? formData.sala.trim() || null : null,
      };

      // Configurar fechas según el tipo
      if (formData.modalidad === 'presencial' && formData.tipoEvaluacion === 'escrita') {
        payload.fechaInicio = `${formData.fechaDia}T${formData.horaInicio}:00`;
        payload.fechaFin = `${formData.fechaDia}T${formData.horaFin || formData.horaInicio}:00`;
      } else if (formData.tipoEvaluacion === 'slots') {
        // Para slots, construir fechas con el rango
        const fechaInicio = `${formData.fechaRangoInicio}T${formData.horaInicioDiaria || '08:00'}:00`;
        const fechaFin = formData.fechaFinRango || `${formData.fechaRangoInicio}T${formData.horaFinDiaria || '18:00'}:00`;
        
        payload.fechaInicio = fechaInicio;
        payload.fechaFin = fechaFin;
        payload.duracionPorAlumno = Number(formData.duracionPorAlumno) || null;
      } else if (formData.modalidad === 'online') {
        // Online necesita fechas también
        const ahora = new Date();
        const dentroDeUnDia = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
        payload.fechaInicio = ahora.toISOString();
        payload.fechaFin = dentroDeUnDia.toISOString();
        payload.duracion = Number(formData.duracionMinutos) || null;
      }

      console.log('📤 Payload a enviar:', payload);

      let eventoId;

      if (evento && evento.id) {
        await actualizarEvento(evento.id, payload);
        Swal.fire('¡Éxito!', 'Evento actualizado', 'success');
        eventoId = evento.id;
      } else {
        const res = await crearEvento(payload);
        eventoId = res?.data?.id || res?.id;

        if (!eventoId) {
          throw new Error('No se recibió el ID del evento creado');
        }

        // Generar slots automáticamente si es tipo slots
        if (formData.tipoEvaluacion === 'slots' && formData.duracionPorAlumno) {
          const duracion = Number(formData.duracionPorAlumno);
          if (duracion > 0) {
            try {
              const genRes = await generarSlots(eventoId, duracion);
              // generarSlots devuelve { success, message, data }
              if (genRes?.success && Array.isArray(genRes.data) && genRes.data.length > 0) {
                Swal.fire('¡Perfecto!', `Evento creado y ${genRes.data.length} slots generados automáticamente`, 'success');
              } else if (genRes?.success) {
                Swal.fire('Atención', 'Evento creado pero no se generaron slots (verifica el rango y duración).', 'warning');
              } else {
                const msg = genRes?.message || 'Error al generar slots';
                Swal.fire({ icon: 'warning', title: 'Evento creado', text: `${msg}. Puedes volver a intentar generar slots desde Gestionar Slots.` });
              }
            } catch (errSlots) {
              console.error('Error generando slots:', errSlots);
              const msg = errSlots?.response?.data?.message || errSlots?.message || 'Error al generar slots';
              Swal.fire({
                icon: 'warning',
                title: 'Evento creado',
                text: `Evento creado pero: ${msg}. Puedes volver a intentar generar slots desde Gestionar Slots.`
              });
            }
          }
        } else {
          Swal.fire('¡Éxito!', 'Evento creado correctamente', 'success');
        }

        // Reset del formulario solo después de crear
        resetearFormulario();
      }

      onSaved?.();
      // Disparar evento global para que CalendarioView recargue los datos
      setTimeout(() => {
        window.dispatchEvent(new Event('eventosUpdated'));
      }, 500);
    } catch (err) {
      console.error('❌ Error al guardar evento:', err);
      Swal.fire('Error', err.message || 'No se pudo guardar el evento', 'error');
    } finally {
      setGenerandoSlots(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-600">
        <h2 className="text-3xl font-bold text-center text-[#0E2C66] mb-10">
          {evento ? 'Editar Evento' : 'Crear Nuevo Evento'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* Información básica */}
          <section className="bg-gray-50 p-6 rounded-xl border-2 border-gray-600">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Información básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre del evento *</label>
                <input 
                  type="text" 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                  placeholder="Ej: Certamen 2 - Derecho Civil"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Tipo de evento *</label>
                <select 
                  name="tipoEvento" 
                  value={formData.tipoEvento} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition"
                >
                  <option value="">{loadingTipos ? 'Cargando...' : 'Seleccionar tipo'}</option>
                  {tiposEventos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-semibold mb-2">Descripción</label>
              <textarea 
                name="descripcion" 
                value={formData.descripcion} 
                onChange={handleChange} 
                rows="3" 
                className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                placeholder="Detalles adicionales sobre la evaluación..."
              />
            </div>
          </section>

          {/* Tipo de evaluación */}
          <section className="bg-gray-50 p-6 rounded-xl border-2 border-gray-600">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Tipo de evaluación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <label className={`p-8 rounded-xl border-2 cursor-pointer transition-all text-center ${
                formData.tipoEvaluacion === 'escrita' 
                  ? 'border-[#0E2C66] bg-[#0E2C66]/10 shadow-lg' 
                  : 'border-gray-600 bg-white hover:border-gray-500'
              }`}>
                <input 
                  type="radio" 
                  name="tipoEvaluacion" 
                  value="escrita" 
                  checked={formData.tipoEvaluacion === 'escrita'} 
                  onChange={handleChange} 
                  className="sr-only" 
                />
                <div className="text-5xl mb-3">📝</div>
                <div className="text-lg font-bold">Escrita</div>
                <div className="text-sm text-gray-600 mt-1">Todos los alumnos de la sección</div>
              </label>
              <label className={`p-8 rounded-xl border-2 cursor-pointer transition-all text-center ${
                formData.tipoEvaluacion === 'slots' 
                  ? 'border-[#0E2C66] bg-[#0E2C66]/10 shadow-lg' 
                  : 'border-gray-600 bg-white hover:border-gray-500'
              }`}>
                <input 
                  type="radio" 
                  name="tipoEvaluacion" 
                  value="slots" 
                  checked={formData.tipoEvaluacion === 'slots'} 
                  onChange={handleChange} 
                  className="sr-only" 
                />
                <div className="text-5xl mb-3">🕒</div>
                <div className="text-lg font-bold">Por slots</div>
                <div className="text-sm text-gray-600 mt-1">Cupo limitado - alumnos eligen horario</div>
              </label>
            </div>
          </section>

          {/* Cupo máximo solo en slots */}
          {formData.tipoEvaluacion === 'slots' && (
            <section className="bg-[#0E2C66]/5 p-6 rounded-xl border-2 border-[#0E2C66]">
              <label className="block text-lg font-bold mb-3 text-[#0E2C66]">Cupo máximo de alumnos *</label>
              <input 
                type="number" 
                name="cupoMaximo" 
                value={formData.cupoMaximo} 
                onChange={handleChange} 
                required 
                min="1" 
                className="w-full max-w-xs px-4 py-3 border-2 border-[#0E2C66] rounded-lg focus:border-[#0a1f4d] transition" 
              />
              <p className="text-sm text-[#0E2C66] mt-2">Limita la cantidad total de alumnos que pueden inscribirse</p>
            </section>
          )}

          {/* Fechas y horarios */}
          <section className="bg-gray-50 p-6 rounded-xl border-2 border-gray-600">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Fechas y horarios</h3>

            {formData.modalidad === 'presencial' && formData.tipoEvaluacion === 'escrita' ? (
              <div>
                <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
                  ⚠️ La evaluación debe programarse con al menos 4 horas de anticipación
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Fecha *</label>
                    <input 
                      type="date" 
                      name="fechaDia" 
                      value={formData.fechaDia} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Hora inicio *</label>
                    <input 
                      type="time" 
                      name="horaInicio" 
                      value={formData.horaInicio} 
                      onChange={handleChange} 
                      required 
                      min="08:00"
                      max="21:00"
                      className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                      // El usuario siempre puede elegir la hora
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Hora fin *</label>
                    <input 
                      type="time" 
                      name="horaFin" 
                      value={formData.horaFin} 
                      onChange={handleChange} 
                      required 
                      min="08:00"
                      max="21:00"
                      className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                      // El usuario siempre puede elegir la hora
                    />
                  </div>
                </div>
              </div>
            ) : formData.tipoEvaluacion === 'slots' ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Fecha inicio del rango *</label>
                    <input 
                      type="date" 
                      name="fechaRangoInicio" 
                      value={formData.fechaRangoInicio} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Fecha y hora de fin *</label>
                    <input 
                      type="datetime-local" 
                      name="fechaFinRango" 
                      value={formData.fechaFinRango} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Hora inicio diaria *</label>
                    <input 
                      type="time" 
                      name="horaInicioDiaria" 
                      value={formData.horaInicioDiaria} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Hora fin diaria *</label>
                    <input 
                      type="time" 
                      name="horaFinDiaria" 
                      value={formData.horaFinDiaria} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Duración por alumno (min) *</label>
                    <input 
                      type="number" 
                      name="duracionPorAlumno" 
                      value={formData.duracionPorAlumno} 
                      onChange={handleChange} 
                      required 
                      min="5" 
                      max="120"
                      className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>
            ) : formData.modalidad === 'online' ? (
              <div>
                <label className="block text-sm font-semibold mb-2">Duración total (minutos) *</label>
                <input 
                  type="number" 
                  name="duracionMinutos" 
                  value={formData.duracionMinutos} 
                  onChange={handleChange} 
                  required 
                  min="1" 
                  className="w-full max-w-xs px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                  placeholder="60"
                />
              </div>
            ) : null}
          </section>

          {/* Ramo y Sección */}
          <section className="bg-gray-50 p-6 rounded-xl border-2 border-gray-600">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Ramo y sección</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Ramo *</label>
                <select 
                  name="ramoId" 
                  value={formData.ramoId} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition"
                >
                  <option value="">{loadingRamos ? 'Cargando...' : 'Seleccionar ramo'}</option>
                  {misRamos.map(r => (
                    <option key={r.id ?? r.codigo} value={r.codigo ?? r.id}>
                      {r.nombre} ({r.codigo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Sección *</label>
                <select 
                  name="seccionId" 
                  value={formData.seccionId} 
                  onChange={handleChange} 
                  required 
                  disabled={!formData.ramoId || loadingSecciones} 
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition disabled:bg-gray-100"
                >
                  <option value="">
                    {!formData.ramoId 
                      ? 'Primero selecciona un ramo' 
                      : loadingSecciones 
                      ? 'Cargando secciones...' 
                      : secciones.length === 0
                      ? 'No hay secciones disponibles'
                      : 'Seleccionar sección'}
                  </option>
                  {secciones.map(s => (
                    <option key={s.id} value={s.id}>
                      Sección {s.numero}
                    </option>
                  ))}
                </select>
                {formData.ramoId && !loadingSecciones && secciones.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">⚠️ Este ramo no tiene secciones creadas</p>
                )}
              </div>
            </div>
          </section>

          {/* Sala y estado */}
          <section className="bg-gray-50 p-6 rounded-xl border-2 border-gray-600">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Detalles adicionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Sala {formData.modalidad === 'presencial' ? '*' : '(opcional)'}
                </label>
                <input 
                  type="text" 
                  name="sala" 
                  value={formData.sala} 
                  onChange={handleChange} 
                  required={formData.modalidad === 'presencial'} 
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition" 
                  placeholder="Ej: A-101"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Estado</label>
                <select 
                  name="estado" 
                  value={formData.estado} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-600 rounded-lg focus:border-[#0E2C66] transition"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="reagendado">Reagendado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            {formData.estado === 'cancelado' && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-red-700 mb-2">Comentario (obligatorio) *</label>
                <textarea 
                  name="comentario" 
                  value={formData.comentario} 
                  onChange={handleChange} 
                  required 
                  rows="3" 
                  className="w-full px-4 py-3 border-2 border-red-600 rounded-lg focus:border-red-700 transition" 
                  placeholder="Explica el motivo de la cancelación..."
                />
              </div>
            )}
          </section>

          {/* Botones */}
          <div className="flex justify-end gap-6 pt-8 border-t-2 border-gray-300">
            <button 
              type="button" 
              onClick={onSaved} 
              disabled={generandoSlots} 
              className="px-10 py-4 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition shadow-lg disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={generandoSlots} 
              className="px-10 py-4 bg-[#0E2C66] text-white font-bold rounded-lg hover:bg-[#0a1f4d] transition shadow-lg disabled:opacity-50"
            >
              {generandoSlots ? 'Guardando...' : evento ? 'Actualizar Evento' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}