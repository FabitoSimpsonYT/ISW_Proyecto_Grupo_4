// src/components/CalendarioAlumno.jsx
import { useState, useEffect } from 'react';
import { getSlotsEvento } from '../services/slot.service.js';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { getEventosAlumno } from '../services/evento.service.js';
import { getBloqueos } from '../services/bloqueo.service.js';
import { getTiposEventos } from '../services/tipoEvento.service.js';

export default function CalendarioAlumno() {
  const { user } = useAuth();
  const hoy = new Date();
  const diaActual = hoy.getDate();
  const mesActual = hoy.getMonth();
  const añoActual = hoy.getFullYear();

  const [fechaMostrada, setFechaMostrada] = useState(new Date(añoActual, mesActual));
  const [eventos, setEventos] = useState([]);
  const [tiposEventos, setTiposEventos] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);

  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const generarDias = () => {
    const año = fechaMostrada.getFullYear();
    const mes = fechaMostrada.getMonth();
    const primerDiaMes = new Date(año, mes, 1);
    const primerDiaSemana = primerDiaMes.getDay();
    const offset = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    const diasEnMes = new Date(año, mes + 1, 0).getDate();

    const dias = [];
    for (let i = 0; i < offset; i++) dias.push(null);
    for (let dia = 1; dia <= diasEnMes; dia++) dias.push(dia);
    return dias;
  };

  const dias = generarDias();

  const mesMostrado = fechaMostrada.getMonth();
  const añoMostrado = fechaMostrada.getFullYear();

  const mapearEventos = (eventosBackend) => {
    return eventosBackend.map(ev => {
      const fechaInicio = ev.fecha_inicio ? new Date(ev.fecha_inicio) : null;
      return {
        // Datos originales del backend
        id: ev.id,
        ramo_id: ev.ramo_id,
        seccion_id: ev.seccion_id,
        tipo_evento_id: ev.tipo_evento_id || ev.tipoEvento,
        profesor_id: ev.profesor_id,
        
        // Datos mapeados para el calendario
        dia: fechaInicio?.getDate() ?? null,
        mes: fechaInicio?.getMonth() ?? null,
        año: fechaInicio?.getFullYear() ?? null,
        fecha_inicio: ev.fecha_inicio,
        fecha_fin: ev.fecha_fin,
        nombre: ev.nombre || ev.titulo || '',
        tipo: ev.tipo_nombre || ev.tipoEvento || 'Otro',
        horaInicio: ev.horaInicio || ev.start_time?.split(' ')[1]?.slice(0,5) || '',
        horaFin: ev.horaFin || ev.end_time?.split(' ')[1]?.slice(0,5) || '',
        duracion: ev.duracion || '',
        duracion_por_alumno: ev.duracion_por_alumno,
        capacidad: ev.capacidad || ev.max_bookings || '',
        cupo_maximo: ev.cupo_maximo || ev.capacidad,
        sala: ev.sala || '',
        descripcion: ev.descripcion || '',
        estado: ev.estado || 'pendiente',
        modalidad: ev.modalidad || 'presencial',
        linkOnline: ev.link_online || '',
        tipoEvaluacion: ev.tipoEvaluacion,
        comentario: ev.comentario
      };
    }).filter(e => e.dia !== null && e.mes !== null && e.año !== null);
  };

  const cambiarMes = (direccion) => {
    const nuevaFecha = new Date(fechaMostrada);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);

    const mesesAdelante = (nuevaFecha.getFullYear() - añoActual) * 12 + (nuevaFecha.getMonth() - mesActual);
    if (mesesAdelante > 8) {
      Swal.fire('Límite', 'Solo puedes ver hasta 8 meses por adelantado', 'info');
      return;
    }

    setFechaMostrada(nuevaFecha);
  };

  const esHoy = (dia) => {
    return dia === diaActual && mesMostrado === mesActual && añoMostrado === añoActual;
  };


  const cargarDatos = async () => {
    try {
      const evRes = await getEventosAlumno();
      const evs = evRes?.data || evRes || [];
      setEventos(mapearEventos(evs));

      const bRes = await getBloqueos();
      const bData = bRes?.data || bRes || [];
      const parsed = bData.map(b => ({
        ...b,
        fechaInicioObj: b.fechaInicio ? new Date(b.fechaInicio) : null,
        fechaFinObj: b.fechaFin ? new Date(b.fechaFin) : null
      }));
      setBloqueos(parsed);

      const tiposRes = await getTiposEventos();
      setTiposEventos(tiposRes?.data || tiposRes || []);
    } catch (err) {
      console.error('Error cargando datos', err);
    }
  };

  useEffect(() => {
    cargarDatos();
    const recargar = () => { cargarDatos(); };
    window.addEventListener('bloqueosUpdated', recargar);
    return () => window.removeEventListener('bloqueosUpdated', recargar);
  }, []);

  const mostrarEventosDelDia = async (dia) => {
    const eventosDia = eventos.filter(e => e.dia === dia && e.mes === mesMostrado && e.año === añoMostrado);
    const fechaDia = new Date(añoMostrado, mesMostrado, dia);
    const bloqueo = bloqueos.find(b => {
      if (!b.fechaInicioObj || !b.fechaFinObj) return false;
      return fechaDia >= b.fechaInicioObj && fechaDia <= b.fechaFinObj;
    });

    if (bloqueo) {
      Swal.fire({
        title: `Día bloqueado`,
        html: `<div style='color:#dc2626;font-weight:bold;font-size:18px;'>No puedes inscribir ni ver eventos este día.<br>${bloqueo.comentario ? bloqueo.comentario : ''}</div>`,
        icon: 'error',
        confirmButtonText: 'Cerrar',
        width: 400
      });
      return;
    }

    if (eventosDia.length === 0) {
      Swal.fire({
        title: `Eventos del ${dia} de ${nombresMeses[mesMostrado]}`,
        html: `<div style='color:#888;font-size:16px;'>No hay eventos para este día</div>`,
        confirmButtonText: 'Cerrar',
        width: 400
      });
      return;
    }

    // Formatear hora de inicio y fin igual que en el calendario de profesor
    // Si el evento es por slots, mostrar la hora reservada del slot del alumno
    let html = '';
    for (const e of eventosDia) {
      // Mostrar en 'Hora' el horario completo del evento (no el slot)
      let horaInicio = e.fecha_inicio ? new Date(e.fecha_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : (e.horaInicio || '-');
      let horaFin = e.fecha_fin ? new Date(e.fecha_fin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : (e.horaFin || '-');
      let slotInfoHtml = '';
      // Si es evento por slots (duracion_por_alumno > 0), mostrar el slot reservado del alumno
      if (e.duracion_por_alumno && Number(e.duracion_por_alumno) > 0) {
        try {
          const slotsRes = await getSlotsEvento(e.id);
          const slots = slotsRes?.data || slotsRes || [];
          const userId = user?.id;
          const mySlot = slots.find(s => s.alumno && s.alumno.id === userId);
          if (mySlot) {
            const slotInicio = new Date(mySlot.fecha_hora_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
            const slotFin = new Date(mySlot.fecha_hora_fin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
            slotInfoHtml = `<div style='margin-bottom:6px;'><b>Tu horario reservado:</b> <span style='background:#bbf7d0;padding:2px 8px;border-radius:6px;'>${slotInicio} a ${slotFin}</span></div>`;
          } else {
            slotInfoHtml = `<div style='margin-bottom:6px;'><b>Tu horario reservado:</b> <span style='background:#fee2e2;padding:2px 8px;border-radius:6px;'>No asignado</span></div>`;
          }
        } catch (err) {
          slotInfoHtml = `<div style='margin-bottom:6px;'><b>Tu horario reservado:</b> <span style='background:#fee2e2;padding:2px 8px;border-radius:6px;'>Error al obtener slot</span></div>`;
        }
      }
      // Si no hay horaInicio/horaFin, intentar formatear desde fecha_inicio/fecha_fin
      if ((!horaInicio || horaInicio === '-') && e.fecha_inicio) {
        try {
          horaInicio = new Date(e.fecha_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        } catch {}
      }
      if ((!horaFin || horaFin === '-') && e.fecha_fin) {
        try {
          horaFin = new Date(e.fecha_fin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        } catch {}
      }
      html += `
      <div style=\"border-radius:16px;border:2px solid #e5e7eb;padding:18px;margin-bottom:18px;background:#fff;box-shadow:0 2px 8px #e5e7eb;\">
        <div style='font-size:20px;font-weight:bold;color:#0E2C66;margin-bottom:8px;'>${e.nombre}</div>
        <div style='margin-bottom:6px;'><b>Tipo:</b> ${e.tipo}</div>
        <div style='margin-bottom:6px;'><b>Descripción:</b> ${e.descripcion || '-'} </div>
        <div style='margin-bottom:6px;'><b>Hora:</b> <span style='background:#e0e7ff;padding:2px 8px;border-radius:6px;'>${horaInicio || '-'}</span> a <span style='background:#e0e7ff;padding:2px 8px;border-radius:6px;'>${horaFin || '-'}</span></div>
        ${slotInfoHtml}
        <div style='margin-bottom:6px;'><b>Sala:</b> ${e.sala || '-'} </div>
        <div style='margin-bottom:6px;'><b>Estado:</b> <span style='color:${e.estado==='cancelado'?'#dc2626':e.estado==='confirmado'?'#16a34a':'#64748b'};font-weight:bold;background:${e.estado==='cancelado'?'#fee2e2':e.estado==='confirmado'?'#bbf7d0':'#f3f4f6'};padding:2px 10px;border-radius:8px;'>${e.estado}</span></div>
      </div>
      `;
    }

    Swal.fire({
      title: `Eventos del ${dia} de ${nombresMeses[mesMostrado]}`,
      html,
      confirmButtonText: 'Cerrar',
      width: 500
    });
  };

    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">
          📅 Mis Evaluaciones Agendadas
        </h2>

        {/* Navegación */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => cambiarMes(-1)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition shadow">
            ← Mes Anterior
          </button>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
            {nombresMeses[mesMostrado]} {añoMostrado}
          </h3>
          <button onClick={() => cambiarMes(1)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition shadow">
            Mes Siguiente →
          </button>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-300 p-6">
          <div className="grid grid-cols-7 gap-3 text-center">
            {diasSemana.map(d => (
              <div key={d} className="font-bold text-gray-700 py-3 bg-gray-100 rounded-lg">
                {d}
              </div>
            ))}

            {dias.map((dia, i) => {
              if (dia === null) return <div key={i}></div>;

              // Filtrar eventos solo de ramos inscritos del usuario
              const ramosInscritos = user?.ramosInscritos || [];
              const eventosDia = eventos.filter(e => {
                if (ramosInscritos.length > 0 && !ramosInscritos.includes(e.ramo_id)) return false;
                return e.dia === dia && e.mes === mesMostrado && e.año === añoMostrado;
              });

              const fechaDia = new Date(añoMostrado, mesMostrado, dia);
              const bloqueo = bloqueos.find(b => {
                if (!b.fechaInicioObj || !b.fechaFinObj) return false;
                return fechaDia >= b.fechaInicioObj && fechaDia <= b.fechaFinObj;
              });

              const isBlocked = !!bloqueo;

              return (
                <div
                  key={i}
                  onClick={() => mostrarEventosDelDia(dia)}
                  className={`
                    min-h-28 p-4 rounded-xl border-2 transition-all cursor-pointer
                    ${isBlocked ? 'bg-red-100 border-red-400 text-red-700 hover:bg-red-200' : 'bg-white hover:bg-gray-50 hover:shadow-lg'}
                    ${!isBlocked && esHoy(dia) ? 'border-[#0E2C66] bg-[#0E2C66]/10 shadow-md' : 'border-gray-300'}
                  `}
                >
                  <p className={`text-lg font-bold mb-2 ${esHoy(dia) ? 'text-[#0E2C66]' : 'text-gray-800'}`}>
                    {dia}
                  </p>

                  <div className="relative">
                    {isBlocked && (
                      <p className="text-red-500 font-bold text-sm">Bloqueado</p>
                    )}

                    <div className="space-y-1">
                      {eventosDia.map((e, idx) => {
                        let color = '#64748b';
                        if (e.estado === 'cancelado') color = '#dc2626';
                        else if (e.estado === 'confirmado') color = '#16a34a';
                        else if (e.estado === 'reagendado') color = '#f59e42';
                        // Formatear hora desde fecha_inicio y fecha_fin si no hay horaInicio/horaFin
                        const horaInicio = e.horaInicio || (e.fecha_inicio ? new Date(e.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-');
                        const horaFin = e.horaFin || (e.fecha_fin ? new Date(e.fecha_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-');
                        return (
                          <div key={idx} className="flex items-center justify-center rounded-lg px-2 py-1 mb-1 shadow" style={{background:'#2563eb',borderRadius:'8px',width:'100%',maxWidth:'100%',height:'38px',boxSizing:'border-box'}}>
                            <span style={{width:'14px',height:'14px',borderRadius:'50%',background:color,display:'inline-block',marginRight:'8px'}}></span>
                            <span className="text-xs font-bold text-white truncate" style={{maxWidth:'70px',marginRight:'10px'}}>{e.nombre}</span>
                            <span className="text-[11px] text-white font-normal truncate" style={{marginLeft:'auto'}}>
                              {horaInicio} a {horaFin}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-10 p-6 bg-gray-100 rounded-xl border border-gray-300 text-center">
          <div className="flex justify-center gap-8 flex-wrap">
            {/* Tipos */}
            {tiposEventos.map((tipo) => (
              <div key={tipo.nombre} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-gray-500" style={{ backgroundColor: `${tipo.color}66` }}></div>
                <span className="text-gray-700 font-medium">{tipo.nombre}</span>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0E2C66]/10 border-2 border-[#0E2C66]"></div>
              <span className="text-gray-700 font-medium">Hoy</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 border-2 border-red-400"></div>
              <span className="text-gray-700 font-medium">Día bloqueado</span>
            </div>
            {/* Estados */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-gray-700 font-medium">Pendiente</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-700 font-medium">Confirmado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-700 font-medium">Cancelado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-700 font-medium">Reagendado</span>
            </div>
          </div>
        </div>
      </div>
    );
}