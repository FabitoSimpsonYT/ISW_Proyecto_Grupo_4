// src/components/CrearEventoForm.jsx
import { useState, useEffect } from 'react';
import { getBloqueos } from '../services/bloqueo.service.js';
import ToastNotificationService from '../services/toastNotification.service';
import { crearEvento, actualizarEvento, eliminarEvento } from '../services/evento.service.js';
import { getTiposEventos } from '../services/tipoEvento.service.js';
import { getSeccionesByRamo, getMisRamos, getRamosByCodigo } from '../services/ramos.service.js';
import { generarSlots } from '../services/slot.service.js';
import { updateDynamicColorMap } from '../utils/colorMap.js';
import Swal from 'sweetalert2';
import NotificationService from '../services/notification.service.js';
import '../styles/timeinput.css';

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
    cantidadSlotsXDia: 5,
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
      cantidadSlotsXDia: 5,
    });
    setSecciones([]);
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // ✅ CARGAR DATOS DEL EVENTO cuando se pasa un evento para editar
  useEffect(() => {
    if (evento && evento.id) {
      console.log('📝 Cargando evento para editar:', JSON.stringify(evento, null, 2));
      
      // Parsear las fechas y horas
      const fechaInicio = new Date(evento.fecha_inicio);
      const fechaFin = new Date(evento.fecha_fin);
      
      const fechaDia = fechaInicio.toISOString().split('T')[0];
      const horaInicio = `${String(fechaInicio.getHours()).padStart(2, '0')}:${String(fechaInicio.getMinutes()).padStart(2, '0')}`;
      const horaFin = `${String(fechaFin.getHours()).padStart(2, '0')}:${String(fechaFin.getMinutes()).padStart(2, '0')}`;
      
      // Calcular duración en minutos
      const duracionMs = fechaFin - fechaInicio;
      const duracionMinutos = duracionMs / (1000 * 60);
      
      // Convertir ramoId a string para compatibilidad con select
      // Intentar múltiples opciones de nombres de campo
      const ramoId = String(
        evento.ramo_id || 
        evento.ramoId || 
        evento.ramo?.id || 
        evento.seccion?.ramo_id || 
        ''
      );
      
      const seccionId = String(
        evento.seccion_id || 
        evento.seccionId || 
        evento.seccion?.id || 
        ''
      );
      
      console.log('🔍 ramoId extraído:', ramoId);
      console.log('🔍 seccionId extraído:', seccionId);
      console.log('🔍 ramo objeto:', evento.ramo);
      console.log('🔍 seccion objeto:', evento.seccion);
      
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
        ramoId: ramoId,
        seccionId: seccionId,
        sala: evento.sala || '',
      }));

      // Cargar las secciones del ramo seleccionado
      if (ramoId) {
        const cargarSeccionesDelEvento = async () => {
          try {
            setLoadingSecciones(true);
            // Intentar obtener código del ramo de varias formas
            const codigoRamo = evento.ramo?.codigo || evento.seccion?.ramo?.codigo || ramoId;
            console.log('🔍 Cargando secciones con código:', codigoRamo);
            
            const res = await getSeccionesByRamo(codigoRamo);
            const seccionesData = Array.isArray(res) ? res : res?.data || [];
            setSecciones(seccionesData);
            console.log('✅ Secciones cargadas para edición:', seccionesData);
            
            // Si tenemos seccionId, seleccionarla automáticamente
            if (seccionId && seccionesData.length > 0) {
              const seccionExists = seccionesData.some(s => String(s.id) === seccionId);
              if (seccionExists) {
                console.log('✅ Sección encontrada y preseleccionada');
              }
            }
          } catch (err) {
            console.error('❌ Error cargando secciones:', err);
            setSecciones([]);
          } finally {
            setLoadingSecciones(false);
          }
        };
        cargarSeccionesDelEvento();
      } else {
        console.warn('⚠️ No se encontró ramoId en el evento');
      }
    }
  }, [evento]);

  const cargarDatosIniciales = async () => {
    try {
      setLoadingTipos(true);
      setLoadingRamos(true);

      const [tiposRes, ramosRes] = await Promise.all([
        getTiposEventos().catch(err => {
          console.error('❌ Error cargando tipos:', err);
          return [];
        }),
        getMisRamos().catch(err => {
          console.error('❌ Error cargando mis ramos:', err);
          return [];
        })
      ]);

      // getTiposEventos ya retorna un array limpio
      const tipos = Array.isArray(tiposRes) ? tiposRes : [];
      const ramos = Array.isArray(ramosRes) ? ramosRes : ramosRes?.data || [];

      console.log('✅ Tipos cargados en formulario:', tipos);
      console.log('✅ Tipos.length:', tipos.length);
      console.log('✅ Tipos:', JSON.stringify(tipos));
      console.log('✅ Ramos cargados en formulario:', ramos);
      
      if (tipos.length === 0) {
        console.warn('⚠️ ¡NO HAY TIPOS DE EVENTOS! Cargados:', tiposRes);
      }
      
      setTiposEventos(tipos);
      setMisRamos(ramos);
      
      // ✅ Actualizar el mapa de colores dinámico con los tipos cargados
      updateDynamicColorMap(tipos);
      console.log('🎨 Color map actualizado con tipos del servidor');
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      ToastNotificationService.error('No se pudieron cargar los datos iniciales');
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
        // Siempre usar el endpoint para obtener secciones con id real
        const codigoRamo = formData.ramoId;
        console.log('🔍 Cargando secciones para el ramo (codigo):', codigoRamo);
        const res = await getSeccionesByRamo(codigoRamo);
        const seccionesData = Array.isArray(res) ? res : res?.data || [];
        console.log('✅ Secciones cargadas:', seccionesData);
        setSecciones(seccionesData);
        
        // ✅ PRESELECCIONAR si solo hay una sección
        if (seccionesData.length === 1) {
          setFormData(prev => ({
            ...prev,
            seccionId: String(seccionesData[0].id || seccionesData[0].idSeccion || seccionesData[0])
          }));
          console.log('📌 Sección única preseleccionada automáticamente');
        }
      } catch (err) {
        console.error('❌ Error cargando secciones:', err);
        ToastNotificationService.error('No se pudieron cargar las secciones de este ramo');
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

    console.log('📋 SUBMIT INICIADO - FormData:', formData);

    // Validar campos obligatorios
    // ramoId puede ser string (código) o número (id) - ambos son válidos
    const tipoEventoNum = formData.tipoEvento ? Number(formData.tipoEvento) : null;
    const seccionIdNum = formData.seccionId ? Number(formData.seccionId) : null;

    console.log('🔍 VALIDACIÓN:', {
      nombre: !!formData.nombre,
      tipoEvento: !!tipoEventoNum,
      ramoId: !!formData.ramoId,
      seccionId: !!seccionIdNum
    });

    if (!formData.nombre || !tipoEventoNum || !formData.ramoId || !seccionIdNum) {
      const error = `Faltan campos: nombre=${!!formData.nombre}, tipo=${!!tipoEventoNum}, ramo=${!!formData.ramoId}, seccion=${!!seccionIdNum}`;
      console.error('❌ ' + error);
      ToastNotificationService.error('Completa todos los campos obligatorios: ' + error);
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
        ToastNotificationService.error('No se puede crear un evento en un día bloqueado por la jefatura.');
        return;
      }
    }

    if (formData.estado === 'cancelado' && !formData.comentario.trim()) {
      ToastNotificationService.error('El comentario es obligatorio al cancelar');
      return;
    }

    // Validación 4 horas para presencial escrita
    if (formData.modalidad === 'presencial' && formData.tipoEvaluacion === 'escrita') {
      if (!formData.fechaDia || !formData.horaInicio) {
        ToastNotificationService.error('Debes especificar fecha y hora de inicio');
        return;
      }

      const inicioEvento = new Date(`${formData.fechaDia}T${formData.horaInicio}:00`);
      const horasAnticipacion = (inicioEvento - new Date()) / (1000 * 60 * 60);
      
      if (horasAnticipacion < 4) {
        ToastNotificationService.error('La evaluación debe programarse con al menos 4 horas de anticipación');
        return;
      }
    }

    try {
      setGenerandoSlots(true);

      // El ramoId puede ser string (código) o número (id)
      // El backend soporta ambos formatos
      const ramoIdFinal = formData.ramoId;
      const seccionIdNum = Number(formData.seccionId);

      // Siempre incluir fechaInicio y fechaFin en el payload
      let fechaInicio = '';
      let fechaFin = '';
      let duracionPorAlumno = undefined;
      let duracion = undefined;

      if (formData.modalidad === 'presencial' && formData.tipoEvaluacion === 'escrita') {
        fechaInicio = `${formData.fechaDia}T${formData.horaInicio}:00`;
        fechaFin = `${formData.fechaDia}T${formData.horaFin || formData.horaInicio}:00`;
      } else if (formData.tipoEvaluacion === 'slots') {
        // Para slots, enviar fecha de rango y horas diarias
        fechaInicio = `${formData.fechaRangoInicio}T00:00:00`;
        fechaFin = `${formData.fechaFinRango}T23:59:59`;
        duracionPorAlumno = Number(formData.duracionPorAlumno) || null;
      } else if (formData.modalidad === 'online') {
        // Online necesita fechas también
        fechaInicio = formData.fechaDia ? `${formData.fechaDia}T${formData.horaInicio || '08:00'}:00` : new Date().toISOString();
        fechaFin = formData.fechaDia ? `${formData.fechaDia}T${formData.horaFin || formData.horaInicio || '09:00'}:00` : new Date(Date.now() + 60 * 60 * 1000).toISOString();
        duracion = Number(formData.duracionMinutos) || null;
      } else {
        // fallback: usar fecha y hora actuales
        fechaInicio = new Date().toISOString();
        fechaFin = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      }

      let payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        estado: formData.estado,
        comentario: formData.comentario.trim() || null,
        tipoEvento: tipoEventoNum,
        modalidad: formData.modalidad,
        linkOnline: (formData.modalidad === 'online' || formData.tipoEvaluacion === 'slots') ? formData.linkOnline.trim() || null : null,
        ramoId: ramoIdFinal,
        seccionId: seccionIdNum,
        cupoMaximo: Number(formData.cupoMaximo) || 40,
        sala: formData.modalidad === 'presencial' ? formData.sala.trim() || null : null,
        fechaInicio,
        fechaFin
      };
      
      // Agregar campos específicos para slots
      if (formData.tipoEvaluacion === 'slots') {
        payload.fechaRangoInicio = formData.fechaRangoInicio;
        payload.fechaRangoFin = formData.fechaFinRango;
        payload.horaInicioDiaria = formData.horaInicioDiaria;
        payload.horaFinDiaria = formData.horaFinDiaria;
      }
      
      if (duracionPorAlumno !== undefined) payload.duracionPorAlumno = duracionPorAlumno;
      if (duracion !== undefined) payload.duracion = duracion;

      console.log('📤 Payload a enviar:', payload);

      // Obtener datos del ramo para mostrar en alertas
      const ramoData = misRamos.find(r => String(r.id) === String(formData.ramoId)) || { nombre: formData.ramoId };

      let eventoId;
      let eventoCreado = false;

      if (evento && evento.id) {
        await actualizarEvento(evento.id, payload);
        ToastNotificationService.success('Evento actualizado correctamente');
        NotificationService.success('Evento actualizado correctamente');
        eventoId = evento.id;
        
        // Mapeo de estados con emojis y colores
        const estadosMap = {
          'pendiente': { emoji: '📋', color: '#f59e0b', texto: 'Pendiente' },
          'confirmado': { emoji: '✅', color: '#10b981', texto: 'Confirmado' },
          'reagendado': { emoji: '🔄', color: '#3b82f6', texto: 'Reagendado' },
          'cancelado': { emoji: '❌', color: '#ef4444', texto: 'Cancelado' }
        };
        const estadoInfo = estadosMap[formData.estado] || estadosMap['pendiente'];
        const tipoEvaluacion = formData.tipoEvaluacion === 'escrita' ? 'Evaluación Escrita' : 'Evaluación';
        const fechaDisplay = formData.fechaDia || new Date().toLocaleDateString('es-ES');
        
        await Swal.fire({
          title: '✅ ¡Evento Actualizado!',
          html: `
            <div style="text-align: left; color: #333;">
              <p style="font-size: 16px; margin-bottom: 15px;"><strong>${formData.nombre}</strong></p>
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 10px 0; border-radius: 4px;">
                <p style="margin: 5px 0;"><strong>📝 Tipo:</strong> ${tipoEvaluacion}</p>
                <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${new Date(fechaDisplay).toLocaleDateString('es-ES')}</p>
                <p style="margin: 5px 0;"><strong>🕒 Horario:</strong> ${formData.horaInicio} - ${formData.horaFin}</p>
                <p style="margin: 5px 0;"><strong>📍 Sala:</strong> ${formData.sala || 'No especificada'}</p>
                ${formData.descripcion ? `<p style="margin: 5px 0;"><strong>📄 Descripción:</strong> ${formData.descripcion}</p>` : ''}
                <p style="margin: 10px 0 0 0; padding-top: 10px; border-top: 1px solid #ddd;"><strong>${estadoInfo.emoji} Estado:</strong> <span style="background-color: ${estadoInfo.color}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${estadoInfo.texto}</span></p>
              </div>
            </div>
          `,
          icon: 'success',
          confirmButtonText: '✓ Aceptar',
          confirmButtonColor: '#10b981',
          allowOutsideClick: false
        }).then(() => {
          window.dispatchEvent(new Event('eventosUpdated'));
          onSaved?.();
          resetearFormulario();
        });
      } else {
        try {
          console.log('📤 Enviando payload al backend...');
          const res = await crearEvento(payload);
          console.log('✅ Respuesta de crearEvento:', res);
          const eventoId = res?.data?.id || res?.id;

          if (!eventoId) {
            console.error('❌ No se recibió ID del evento. Respuesta completa:', JSON.stringify(res, null, 2));
            throw new Error('No se recibió el ID del evento creado. Respuesta: ' + JSON.stringify(res));
          }

          eventoCreado = true;
          console.log('✅ Evento creado con ID:', eventoId);

          // Generar slots automáticamente si es tipo slots
          if (formData.tipoEvaluacion === 'slots' && formData.duracionPorAlumno) {
            const durationMinutes = Number(formData.duracionPorAlumno);
            if (durationMinutes > 0) {
              try {
                const genRes = await generarSlots(eventoId, durationMinutes);
                console.log('✅ Respuesta de generarSlots:', genRes);
                // generarSlots devuelve { success, message, data }
                if (genRes?.success && Array.isArray(genRes.data) && genRes.data.length > 0) {
                  ToastNotificationService.success(`Evento creado y ${genRes.data.length} slots generados automáticamente`);
                  NotificationService.success(`Evento creado con ${genRes.data.length} slots generados`);
                  
                  // Sweet Alert mejorado para creación exitosa
                  await Swal.fire({
                    title: '✅ ¡Evaluación Creada!',
                    html: `
                      <div style="text-align: left; color: #333;">
                        <p style="font-size: 18px; margin-bottom: 15px; font-weight: bold; color: #0E2C66;">${formData.nombre}</p>
                        
                        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0; border-radius: 4px;">
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                              <p style="margin: 8px 0;"><strong>📚 Ramo:</strong></p>
                              <p style="margin: 0; color: #666;">${ramoData?.nombre || 'Ramo'}</p>
                            </div>
                            <div>
                              <p style="margin: 8px 0;"><strong>🎭 Tipo:</strong></p>
                              <p style="margin: 0; color: #666;">${formData.tipoEvaluacion === 'slots' ? 'Por Slots' : 'Escrita'}</p>
                            </div>
                          </div>
                          
                          <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;">
                          
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                              <p style="margin: 8px 0;"><strong>📅 Fecha Inicio:</strong></p>
                              <p style="margin: 0; color: #666;">${new Date(formData.fechaRangoInicio).toLocaleDateString('es-ES')}</p>
                            </div>
                            <div>
                              <p style="margin: 8px 0;"><strong>📅 Fecha Término:</strong></p>
                              <p style="margin: 0; color: #666;">${new Date(formData.fechaFinRango).toLocaleDateString('es-ES')}</p>
                            </div>
                          </div>
                          
                          <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;">
                          
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                              <p style="margin: 8px 0;"><strong>🕐 Hora Inicio:</strong></p>
                              <p style="margin: 0; color: #0E2C66; font-weight: bold; font-size: 16px;">${formData.horaInicioDiaria}</p>
                            </div>
                            <div>
                              <p style="margin: 8px 0;"><strong>🕑 Hora Término:</strong></p>
                              <p style="margin: 0; color: #0E2C66; font-weight: bold; font-size: 16px;">${formData.horaFinDiaria}</p>
                            </div>
                          </div>
                          
                          <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;">
                          
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                              <p style="margin: 8px 0;"><strong>⏳ Duración por alumno:</strong></p>
                              <p style="margin: 0; color: #666;">${durationMinutes} minutos</p>
                            </div>
                            <div>
                              <p style="margin: 8px 0;"><strong>👥 Cupo máximo:</strong></p>
                              <p style="margin: 0; color: #666;">${formData.cupoMaximo} alumnos</p>
                            </div>
                          </div>
                          
                          <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;">
                          
                          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 12px; border-radius: 4px; margin-top: 12px;">
                            <p style="margin: 8px 0;"><strong>✅ Slots generados:</strong></p>
                            <p style="margin: 0; color: #065f46; font-weight: bold; font-size: 18px;">${genRes.data.length} slots</p>
                          </div>
                          
                          ${formData.modalidad === 'online' ? `
                            <div style="background-color: #dbeafe; border-left: 4px solid #0284c7; padding: 12px; border-radius: 4px; margin-top: 12px;">
                              <p style="margin: 8px 0;"><strong>🔗 Link de clase:</strong></p>
                              <p style="margin: 0; color: #0c4a6e; word-break: break-all; font-size: 12px;">${formData.linkOnline || 'Por configurar'}</p>
                            </div>
                          ` : ''}
                          
                          ${formData.modalidad === 'presencial' ? `
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin-top: 12px;">
                              <p style="margin: 8px 0;"><strong>🏛️ Sala:</strong></p>
                              <p style="margin: 0; color: #78350f; font-weight: bold;">${formData.sala || 'Por definir'}</p>
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    `,
                    icon: 'success',
                    confirmButtonText: '✓ Aceptar',
                    confirmButtonColor: '#10b981',
                    allowOutsideClick: false,
                    width: '600px'
                  }).then(() => {
                    window.dispatchEvent(new Event('eventosUpdated'));
                    onSaved?.();
                    resetearFormulario();
                  });
                } else if (genRes?.success) {
                  ToastNotificationService.success('Evento creado pero no se generaron slots (verifica el rango y duración).');
                  NotificationService.success('Evento creado exitosamente');
                  
                  await Swal.fire({
                    title: '⚠️ Evaluación Creada (Sin Slots)',
                    html: `
                      <div style="text-align: left; color: #333;">
                        <p style="font-size: 18px; margin-bottom: 15px; font-weight: bold; color: #0E2C66;">${formData.nombre}</p>
                        
                        <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; border-radius: 4px;">
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                              <p style="margin: 8px 0;"><strong>📅 Fecha Inicio:</strong></p>
                              <p style="margin: 0; color: #666;">${new Date(formData.fechaRangoInicio).toLocaleDateString('es-ES')}</p>
                            </div>
                            <div>
                              <p style="margin: 8px 0;"><strong>📅 Fecha Término:</strong></p>
                              <p style="margin: 0; color: #666;">${new Date(formData.fechaFinRango).toLocaleDateString('es-ES')}</p>
                            </div>
                          </div>
                          
                          <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;">
                          
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                              <p style="margin: 8px 0;"><strong>🕐 Hora Inicio:</strong></p>
                              <p style="margin: 0; color: #0E2C66; font-weight: bold;">${formData.horaInicioDiaria}</p>
                            </div>
                            <div>
                              <p style="margin: 8px 0;"><strong>🕑 Hora Término:</strong></p>
                              <p style="margin: 0; color: #0E2C66; font-weight: bold;">${formData.horaFinDiaria}</p>
                            </div>
                          </div>
                          
                          <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;">
                          
                          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; margin-top: 12px;">
                            <p style="margin: 8px 0;"><strong>❌ Advertencia:</strong></p>
                            <p style="margin: 0; color: #991b1b; font-size: 14px;">No se generaron slots automáticamente.</p>
                            <p style="margin: 5px 0 0 0; color: #991b1b; font-size: 13px;">Verifica que la duración sea compatible con el rango de fechas y horas.</p>
                          </div>
                        </div>
                      </div>
                    `,
                    icon: 'warning',
                    confirmButtonText: '✓ Aceptar',
                    confirmButtonColor: '#f59e0b',
                    allowOutsideClick: false,
                    width: '600px'
                  }).then(() => {
                    window.dispatchEvent(new Event('eventosUpdated'));
                    onSaved?.();
                    resetearFormulario();
                  });
                } else {
                  const msg = genRes?.message || 'Error al generar slots';
                  ToastNotificationService.error(`${msg}. Puedes volver a intentar generar slots desde Gestionar Slots.`);
                  NotificationService.warning(`Evento creado pero: ${msg}`);
                  window.dispatchEvent(new Event('eventosUpdated'));
                  onSaved?.();
                  resetearFormulario();
                }
              } catch (errSlots) {
                console.error('Error generando slots:', errSlots);
                const msg = errSlots?.response?.data?.message || errSlots?.message || 'Error al generar slots';
                ToastNotificationService.error(`Evento creado pero: ${msg}. Puedes volver a intentar generar slots desde Gestionar Slots.`);
                NotificationService.warning(`Evento creado pero: ${msg}`);
                window.dispatchEvent(new Event('eventosUpdated'));
                onSaved?.();
                resetearFormulario();
              }
            }
          } else {
            ToastNotificationService.success('Evento creado correctamente');
            NotificationService.success('Evento creado exitosamente');
            
            // Sweet Alert para evaluación escrita creada
            const tipoEvaluacion = formData.tipoEvaluacion === 'escrita' ? 'Evaluación Escrita' : 'Evaluación';
            const fechaDisplay = formData.fechaDia || new Date().toLocaleDateString('es-ES');
            
            // Mapeo de estados con emojis y colores
            const estadosMap = {
              'pendiente': { emoji: '📋', color: '#f59e0b', texto: 'Pendiente' },
              'confirmado': { emoji: '✅', color: '#10b981', texto: 'Confirmado' },
              'reagendado': { emoji: '🔄', color: '#3b82f6', texto: 'Reagendado' },
              'cancelado': { emoji: '❌', color: '#ef4444', texto: 'Cancelado' }
            };
            const estadoInfo = estadosMap[formData.estado] || estadosMap['pendiente'];
            
            await Swal.fire({
              title: '✅ ¡Evento Creado!',
              html: `
                <div style="text-align: left; color: #333;">
                  <p style="font-size: 18px; margin-bottom: 15px; font-weight: bold; color: #0E2C66;">${formData.nombre}</p>
                  <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0; border-radius: 4px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                      <div>
                        <p style="margin: 8px 0;"><strong>📚 Ramo:</strong></p>
                        <p style="margin: 0; color: #666;">${ramoData?.nombre || 'Ramo'}</p>
                      </div>
                      <div>
                        <p style="margin: 8px 0;"><strong>🎭 Tipo:</strong></p>
                        <p style="margin: 0; color: #666;">${tipoEvaluacion}</p>
                      </div>
                    </div>
                    
                    <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;">
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                      <div>
                        <p style="margin: 8px 0;"><strong>📅 Fecha:</strong></p>
                        <p style="margin: 0; color: #666;">${new Date(fechaDisplay).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div>
                        <p style="margin: 8px 0;"><strong>🕐 Hora Inicio:</strong></p>
                        <p style="margin: 0; color: #0E2C66; font-weight: bold;">${formData.horaInicio}</p>
                      </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 12px;">
                      <div>
                        <p style="margin: 8px 0;"><strong>🕑 Hora Término:</strong></p>
                        <p style="margin: 0; color: #0E2C66; font-weight: bold;">${formData.horaFin}</p>
                      </div>
                      <div>
                        <p style="margin: 8px 0;"><strong>🏛️ Sala:</strong></p>
                        <p style="margin: 0; color: #666;">${formData.sala || 'No especificada'}</p>
                      </div>
                    </div>
                    
                    ${formData.descripcion ? `
                      <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;">
                      <div>
                        <p style="margin: 8px 0;"><strong>📄 Descripción:</strong></p>
                        <p style="margin: 0; color: #666; font-size: 13px;">${formData.descripcion}</p>
                      </div>
                    ` : ''}
                    
                    <hr style="margin: 12px 0; border: none; border-top: 1px solid #ddd;">
                    
                    <div>
                      <p style="margin: 8px 0;"><strong>${estadoInfo.emoji} Estado:</strong></p>
                      <p style="margin: 0;"><span style="background-color: ${estadoInfo.color}; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px;">${estadoInfo.texto}</span></p>
                    </div>
                  </div>
                </div>
              `,
              icon: 'success',
              confirmButtonText: '✓ Aceptar',
              confirmButtonColor: '#10b981',
              allowOutsideClick: false,
              width: '600px'
            }).then(() => {
              window.dispatchEvent(new Event('eventosUpdated'));
              onSaved?.();
              resetearFormulario();
            });
          }
        } catch (err) {
          console.error('❌ Error al crear evento:', err);
          const backendMsg = err?.response?.data?.message;
          ToastNotificationService.error(backendMsg || err.message || 'No se pudo guardar el evento');
          NotificationService.error(backendMsg || 'Error al guardar el evento');
          throw err;
        }
      }
    } catch (err) {
      console.error('❌ ERROR GENERAL en handleSubmit:', err);
      console.error('Stack:', err.stack);
      console.error('Response:', err.response);
      // Mostrar mensaje del backend si existe
      const backendMsg = err?.response?.data?.message;
      const errorMsg = backendMsg || err.message || 'No se pudo guardar el evento';
      console.error('📌 Error final:', errorMsg);
      ToastNotificationService.error(errorMsg);
      NotificationService.error(errorMsg);
    } finally {
      setGenerandoSlots(false);
    }
  };

  const handleEliminarEvento = async () => {
    if (!evento || !evento.id) return;

    const result = await Swal.fire({
      title: 'Eliminar Evaluación',
      html: `<p style="text-align: left; margin: 10px 0;"><strong>¿Estás seguro de que deseas eliminar esta evaluación?</strong></p>
             <div style="background-color: #f0f0f0; border-left: 4px solid #667eea; padding: 10px; margin: 10px 0; text-align: left;">
               <p style="margin: 5px 0;"><strong>Nombre:</strong> ${evento.nombre}</p>
               <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date(evento.fecha_inicio || evento.fechaDia).toLocaleDateString('es-ES')}</p>
               <p style="margin: 5px 0;"><strong>Ramo:</strong> ${evento.ramo_nombre || evento.ramo?.nombre || 'N/A'}</p>
             </div>
             <p style="color: #ef4444; margin-top: 10px;"><strong>⚠️ Esta acción no se puede deshacer</strong></p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await eliminarEvento(evento.id);
      
      await Swal.fire({
        title: '¡Eliminado!',
        text: 'La evaluación ha sido eliminada correctamente.',
        icon: 'success',
        confirmButtonColor: '#10b981',
      });

      NotificationService.success('Evento eliminado correctamente');
      onSaved?.();
      window.dispatchEvent(new Event('eventosUpdated'));
    } catch (error) {
      console.error('Error eliminando evento:', error);
      NotificationService.error('No se pudo eliminar el evento');
      await Swal.fire({
        title: 'Error',
        text: 'Error: ' + (error.message || 'No se pudo eliminar la evaluación'),
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-6 sm:p-10 border border-gray-100">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-[#0E2C66] to-[#1a3f8f] bg-clip-text text-transparent mb-3">
            {evento ? '✏️ Editar Evento' : '➕ Crear Nuevo Evento'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto">
            {evento ? 'Actualiza los detalles de tu evento' : 'Define los parámetros de tu nueva evaluación'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">

          {/* Información básica */}
          <section className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 sm:p-8 rounded-2xl border-2 border-blue-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full"></div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0E2C66]">Información Básica</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-800 flex items-center gap-2">
                  <span>📝 Nombre del evento</span>
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="nombre" 
                  value={formData.nombre} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-sm sm:text-base" 
                  placeholder="Ej: Certamen 2 - Derecho Civil"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-800 flex items-center gap-2">
                  <span>🎭 Tipo de evento</span>
                  <span className="text-red-500">*</span>
                </label>
                <select 
                  name="tipoEvento" 
                  value={formData.tipoEvento} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-sm sm:text-base"
                >
                  <option value="">{loadingTipos ? 'Cargando...' : 'Seleccionar tipo'}</option>
                  {tiposEventos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-bold mb-3 text-gray-800 flex items-center gap-2">
                <span>💬 Descripción</span>
              </label>
              <textarea 
                name="descripcion" 
                value={formData.descripcion} 
                onChange={handleChange} 
                rows="3" 
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none text-sm sm:text-base" 
                placeholder="Detalles adicionales sobre la evaluación..."
              />
            </div>
          </section>

          {/* Tipo de evaluación */}
          <section className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 sm:p-8 rounded-2xl border-2 border-purple-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0E2C66]">Tipo de Evaluación</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <label className={`p-6 sm:p-8 rounded-2xl border-2 cursor-pointer transition-all text-center ${
                formData.tipoEvaluacion === 'escrita' 
                  ? 'border-purple-500 bg-purple-100/50 shadow-lg ring-2 ring-purple-200' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}>
                <input 
                  type="radio" 
                  name="tipoEvaluacion" 
                  value="escrita" 
                  checked={formData.tipoEvaluacion === 'escrita'} 
                  onChange={handleChange} 
                  className="sr-only" 
                />
                <div className="text-4xl sm:text-5xl mb-3">📝</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">Escrita</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-2">Todos los alumnos de la sección</div>
              </label>
              <label className={`p-6 sm:p-8 rounded-2xl border-2 cursor-pointer transition-all text-center ${
                formData.tipoEvaluacion === 'slots' 
                  ? 'border-purple-500 bg-purple-100/50 shadow-lg ring-2 ring-purple-200' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
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
            <section className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 sm:p-8 rounded-2xl border-2 border-indigo-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-indigo-600 to-blue-600 rounded-full"></div>
                <label className="text-xl sm:text-2xl font-bold text-[#0E2C66]">👥 Cupo máximo de alumnos *</label>
              </div>
              <input 
                type="number" 
                name="cupoMaximo" 
                value={formData.cupoMaximo} 
                onChange={handleChange} 
                required 
                min="1" 
                className="w-full max-w-xs px-4 sm:px-5 py-3 sm:py-4 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition" 
              />
              <p className="text-sm text-indigo-700 mt-3 font-medium">Limita la cantidad total de alumnos que pueden inscribirse</p>
            </section>
          )}

          {/* Fechas y horarios */}
          <section className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 sm:p-6 rounded-2xl border-2 border-emerald-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-600 to-teal-600 rounded-full"></div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0E2C66]">🕒 Fechas y horarios</h3>
            </div>

            {formData.modalidad === 'presencial' && formData.tipoEvaluacion === 'escrita' ? (
              <div>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 sm:p-4 mb-5">
                  <p className="text-xs sm:text-sm text-amber-800 font-medium">⚠️ La evaluación debe programarse con al menos 4 horas de anticipación</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  {/* Calendario */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-gray-800 mb-2">📅 Selecciona fecha *</label>
                    <input
                      type="date"
                      value={formData.fechaDia}
                      onChange={(e) => setFormData({...formData, fechaDia: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white text-gray-800 font-medium text-sm"
                    />
                    {formData.fechaDia && (
                      <div className="mt-3 p-3 bg-emerald-100 border-2 border-emerald-300 rounded-lg text-center">
                        <p className="text-xs text-emerald-700 font-semibold">
                          ✓ {new Date(formData.fechaDia + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Horarios */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">⏰ Hora inicio *</label>
                        <input 
                          type="time" 
                          name="horaInicio" 
                          value={formData.horaInicio} 
                          onChange={handleChange} 
                          required 
                          min="08:00"
                          max="21:00"
                          className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white text-gray-800 font-medium text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">⏱️ Hora fin *</label>
                        <input 
                          type="time" 
                          name="horaFin" 
                          value={formData.horaFin} 
                          onChange={handleChange} 
                          required 
                          min="08:00"
                          max="21:00"
                          className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white text-gray-800 font-medium text-sm"
                        />
                      </div>
                    </div>
                    {formData.horaInicio && formData.horaFin && (
                      <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                        <p className="text-sm text-blue-800 font-semibold">
                          ⏳ Duración: {Math.round((new Date(`2000-01-01T${formData.horaFin}`) - new Date(`2000-01-01T${formData.horaInicio}`)) / 60000)} minutos
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : formData.tipoEvaluacion === 'slots' ? (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">📅 Fecha inicio del rango *</label>
                    <input 
                      type="date" 
                      name="fechaRangoInicio" 
                      value={formData.fechaRangoInicio} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">📆 Fecha fin del rango *</label>
                    <input 
                      type="date" 
                      name="fechaFinRango" 
                      value={formData.fechaFinRango} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">🕐 Hora inicio diaria *</label>
                    <input 
                      type="time" 
                      name="horaInicioDiaria" 
                      value={formData.horaInicioDiaria} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">🕕 Hora fin diaria *</label>
                    <input 
                      type="time" 
                      name="horaFinDiaria" 
                      value={formData.horaFinDiaria} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">⏳ Duración por alumno (min) *</label>
                    <input 
                      type="number" 
                      name="duracionPorAlumno" 
                      value={formData.duracionPorAlumno} 
                      onChange={handleChange} 
                      required 
                      min="5" 
                      max="120"
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                      placeholder="30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">🎯 Cantidad de slots por día *</label>
                  <input 
                    type="number" 
                    name="cantidadSlotsXDia" 
                    value={formData.cantidadSlotsXDia} 
                    onChange={handleChange} 
                    required 
                    min="1" 
                    max="50"
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    placeholder="5"
                  />
                  <p className="text-xs sm:text-sm text-emerald-700 mt-2 font-medium">Define cuántos espacios de evaluación habrá disponibles cada día</p>
                </div>
              </div>
            ) : formData.modalidad === 'online' ? (
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">⏱️ Duración total (minutos) *</label>
                <input 
                  type="number" 
                  name="duracionMinutos" 
                  value={formData.duracionMinutos} 
                  onChange={handleChange} 
                  required 
                  min="1" 
                  className="w-full max-w-xs px-4 sm:px-5 py-3 sm:py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  placeholder="60"
                />
              </div>
            ) : null}
          </section>

          {/* Ramo y Sección */}
          <section className="bg-gradient-to-br from-rose-50 to-orange-50 p-6 sm:p-8 rounded-2xl border-2 border-rose-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-rose-600 to-orange-600 rounded-full"></div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0E2C66]">📚 Ramo y sección</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">Ramo *</label>
                <select 
                  name="ramoId" 
                  value={formData.ramoId} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-rose-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition"
                >
                  <option value="">{loadingRamos ? 'Cargando...' : 'Seleccionar ramo'}</option>
                  {misRamos.map(r => (
                    <option key={r.id ?? r.codigo} value={String(r.id ?? r.codigo)}>
                      {r.nombre} ({r.codigo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">Sección *</label>
                <select 
                  name="seccionId" 
                  value={formData.seccionId} 
                  onChange={handleChange} 
                  required 
                  disabled={!formData.ramoId || loadingSecciones || secciones.length === 1} 
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-rose-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!formData.ramoId 
                      ? 'Primero selecciona un ramo' 
                      : loadingSecciones 
                      ? 'Cargando secciones...' 
                      : secciones.length === 0
                      ? 'No hay secciones disponibles'
                      : secciones.length === 1
                      ? `Sección única: Sección ${secciones[0].numero} (preseleccionada)`
                      : 'Seleccionar sección'}
                  </option>
                  {secciones.map(s => (
                    <option key={s.id} value={s.id}>
                      Sección {s.numero}
                    </option>
                  ))}
                </select>
                {formData.ramoId && !loadingSecciones && secciones.length === 0 && (
                  <p className="text-sm text-red-600 mt-2 font-medium">⚠️ Este ramo no tiene secciones creadas</p>
                )}
                {secciones.length === 1 && (
                  <p className="text-sm text-green-600 mt-2 font-medium">✓ Sección única preseleccionada automáticamente</p>
                )}
              </div>
            </div>
          </section>

          {/* Sala y estado */}
          <section className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 sm:p-8 rounded-2xl border-2 border-cyan-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-cyan-600 to-blue-600 rounded-full"></div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0E2C66]">🔧 Detalles adicionales</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Si es slots, mostrar selector de modalidad (presencial/online) */}
              {formData.tipoEvaluacion === 'slots' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">🎯 Modalidad *</label>
                    <select 
                      name="modalidad" 
                      value={formData.modalidad} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-cyan-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
                    >
                      <option value="presencial">🏫 Presencial</option>
                      <option value="online">💻 Online</option>
                    </select>
                  </div>
                  {formData.modalidad === 'presencial' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3">
                        🏛️ Sala *
                      </label>
                      <input 
                        type="text" 
                        name="sala" 
                        value={formData.sala} 
                        onChange={handleChange} 
                        required={formData.modalidad === 'presencial'} 
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-cyan-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
                        placeholder="Ej: A-101"
                      />
                    </div>
                  )}
                  {formData.modalidad === 'online' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3">
                        🔗 Link *
                      </label>
                      <input 
                        type="url" 
                        name="linkOnline" 
                        value={formData.linkOnline} 
                        onChange={handleChange} 
                        required={formData.modalidad === 'online'} 
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-cyan-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  )}
                </>
              ) : (
                /* Si no es slots, mostrar la versión anterior */
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      🏛️ Sala {formData.modalidad === 'presencial' ? '*' : '(opcional)'}
                    </label>
                    <input 
                      type="text" 
                      name="sala" 
                      value={formData.sala} 
                      onChange={handleChange} 
                      required={formData.modalidad === 'presencial'} 
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-cyan-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
                      placeholder="Ej: A-101"
                    />
                  </div>
                  {(formData.modalidad === 'online') && (
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3">
                        🔗 Link {formData.modalidad === 'online' ? '*' : '(opcional)'}
                      </label>
                      <input 
                        type="url" 
                        name="linkOnline" 
                        value={formData.linkOnline} 
                        onChange={handleChange} 
                        required={formData.modalidad === 'online'} 
                        className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-cyan-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  )}
                </>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">📌 Estado</label>
                <select 
                  name="estado" 
                  value={formData.estado} 
                  onChange={handleChange} 
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-cyan-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
                >
                  <option value="pendiente">📋 Pendiente</option>
                  <option value="confirmado">✅ Confirmado</option>
                  <option value="reagendado">🔄 Reagendado</option>
                  <option value="cancelado">❌ Cancelado</option>
                </select>
              </div>
            </div>
            {formData.estado === 'cancelado' && (
              <div className="mt-6 pt-6 border-t-2 border-cyan-200">
                <label className="block text-sm font-bold text-red-700 mb-3">💬 Motivo de cancelación (obligatorio) *</label>
                <textarea 
                  name="comentario" 
                  value={formData.comentario} 
                  onChange={handleChange} 
                  required 
                  rows="3" 
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-red-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-100 transition resize-none" 
                  placeholder="Explica brevemente el motivo de la cancelación..."
                />
              </div>
            )}
          </section>

          {/* Botones */}
          <div className="flex justify-between gap-3 sm:gap-4 pt-8 sm:pt-10 border-t-2 border-gray-200">
            <div className="flex gap-3 sm:gap-4 flex-wrap">
              {evento && evento.id && (
                <button 
                  type="button" 
                  onClick={handleEliminarEvento} 
                  disabled={generandoSlots} 
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm sm:text-base rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 order-last"
                  title={formData.tipoEvaluacion === 'slots' ? 'Eliminar esta evaluación por slots' : 'Eliminar esta evaluación'}
                >
                  🗑️ Eliminar {formData.tipoEvaluacion === 'slots' ? 'Evaluación' : ''}
                </button>
              )}
              <button 
                type="button" 
                onClick={onSaved} 
                disabled={generandoSlots} 
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-bold text-sm sm:text-base rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                ❌ Cancelar
              </button>
            </div>
            <button 
              type="submit" 
              disabled={generandoSlots} 
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#0E2C66] to-blue-600 hover:from-[#0a1f4d] hover:to-blue-700 text-white font-bold text-sm sm:text-base rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {generandoSlots ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block animate-spin">⏳</span>
                  Guardando...
                </span>
              ) : (
                <span>{evento ? '✏️ Actualizar Evento' : '➕ Crear Evento'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
