// src/components/CalendarioView.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getEventosProfesor, getEventosAlumno, actualizarEvento, eliminarEvento } from '../services/evento.service.js';
import { getTiposEventos } from '../services/tipoEvento.service.js';
import { getBloqueos } from '../services/bloqueo.service.js';
import { useAuth } from '../context/AuthContext';
import CrearEventoForm from './CrearEventoForm';

export default function CalendarioView({ onEditarEvento }) {
  const [fechaMostrada, setFechaMostrada] = useState(new Date());
  const [eventos, setEventos] = useState([]);
  const [tiposEventos, setTiposEventos] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);

  const { user } = useAuth();
  const esProfesorOJefe = ['profesor', 'jefecarrera', 'admin'].includes(user?.role);

  const hoy = new Date();
  const diaActual = hoy.getDate();
  const mesActual = hoy.getMonth();
  const añoActual = hoy.getFullYear();

  const getColorPorTipo = (nombreTipo) => {
    const tipo = tiposEventos.find(t => t.nombre.toLowerCase() === nombreTipo?.toLowerCase());
    return tipo?.color || '#6B7280';
  };

  const getColorPorEstado = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente': return '#6B7280'; // gris
      case 'confirmada': case 'confirmado': return '#22C55E'; // verde
      case 'cancelada': case 'cancelado': return '#EF4444'; // rojo
      case 'reagendado': return '#F97316'; // naranja
      default: return '#3B82F6';
    }
  };

  const mapearEventos = (eventosBackend) => {
    console.log('📅 Eventos del backend:', eventosBackend);
    return eventosBackend.map(ev => {
      const fechaInicio = ev.fecha_inicio ? new Date(ev.fecha_inicio) : null;
      const mapped = {
        // Datos originales del backend (para editar)
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
      console.log('✅ Evento mapeado:', mapped);
      return mapped;
    }).filter(e => e.dia !== null && e.mes !== null && e.año !== null);
  };

  const nombresMeses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const diasSemana = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  const generarDiasMes = () => {
    const año = fechaMostrada.getFullYear();
    const mes = fechaMostrada.getMonth();
    const primerDia = new Date(año, mes, 1).getDay();
    const offset = primerDia === 0 ? 6 : primerDia - 1;
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    const dias = [];
    for (let i = 0; i < offset; i++) dias.push(null);
    for (let d = 1; d <= diasEnMes; d++) dias.push(d);
    return dias;
  };

  const dias = generarDiasMes();

  const cargarDatos = async () => {
    try {
      const tiposRes = await getTiposEventos();
      setTiposEventos(tiposRes?.data || tiposRes || []);

      let eventosRes;
      try {
        eventosRes = await getEventosProfesor();
      } catch {
        eventosRes = await getEventosAlumno();
      }
      setEventos(mapearEventos(eventosRes?.data || eventosRes || []));

      const bloqueosRes = await getBloqueos();
      const bloqueosData = bloqueosRes?.data || bloqueosRes || [];
      setBloqueos(bloqueosData.map(b => ({
        ...b,
        inicio: new Date(b.fechaInicio),
        fin: new Date(b.fechaFin)
      })));
    } catch (err) {
      console.error('Error cargando calendario:', err);
    }
  };

  useEffect(() => {
    cargarDatos();
    const recargar = () => cargarDatos();
    window.addEventListener('eventosUpdated', recargar);
    window.addEventListener('bloqueosUpdated', recargar);
    return () => {
      window.removeEventListener('eventosUpdated', recargar);
      window.removeEventListener('bloqueosUpdated', recargar);
    };
  }, []);

  const cambiarMes = (dir) => {
    const nueva = new Date(fechaMostrada);
    nueva.setMonth(nueva.getMonth() + dir);
    const mesesAdelante = (nueva.getFullYear() - añoActual) * 12 + (nueva.getMonth() - mesActual);
    if (mesesAdelante > 8) {
      Swal.fire('Límite', 'Solo puedes ver hasta 8 meses adelante', 'info');
      return;
    }
    setFechaMostrada(nueva);
  };

  const esHoy = (dia) => dia === diaActual && fechaMostrada.getMonth() === mesActual && fechaMostrada.getFullYear() === añoActual;

  const diaBloqueado = (dia) => {
    const fechaDia = new Date(fechaMostrada.getFullYear(), fechaMostrada.getMonth(), dia);
    return bloqueos.find(b => fechaDia >= b.inicio && fechaDia <= b.fin);
  };

  const mostrarDetallesDia = async (dia) => {
    if (!dia) return;
    const fechaDia = new Date(fechaMostrada.getFullYear(), fechaMostrada.getMonth(), dia);
    const bloqueo = diaBloqueado(dia);

    if (bloqueo) {
      Swal.fire({
        title: 'Día bloqueado',
        html: `<p><strong>Razón:</strong> ${bloqueo.razon || 'Sin especificar'}</p>`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0E2C66'
      });
      return;
    }

    const eventosDia = eventos.filter(e => e.dia === dia && e.mes === fechaMostrada.getMonth() && e.año === fechaMostrada.getFullYear());

    if (eventosDia.length === 0) {
      Swal.fire(`${dia} de ${nombresMeses[fechaMostrada.getMonth()]} ${fechaMostrada.getFullYear()}`, 'No hay eventos programados', 'info');
      return;
    }

    let html = '<div class="space-y-4 max-h-96 overflow-y-auto">';
    eventosDia.forEach(ev => {
      const colorTipo = getColorPorTipo(ev.tipo);
      const colorEstado = getColorPorEstado(ev.estado);
      html += `
        <div class="p-4 rounded-lg text-white shadow-lg" style="background-color: ${colorTipo}CC;">
          <h4 class="font-bold text-lg">${ev.nombre}</h4>
          <p><strong>Tipo:</strong> ${ev.tipo}</p>
          <p><strong>Descripción:</strong> ${ev.descripcion || 'Sin descripción'}</p>
          <p><strong>Hora inicio:</strong> ${ev.horaInicio}</p>
          <p><strong>Hora fin:</strong> ${ev.horaFin}</p>
          <p><strong>Duración:</strong> ${ev.duracion || 'No especificada'}</p>
          <p><strong>Capacidad:</strong> ${ev.capacidad}</p>
          <p><strong>Sala:</strong> ${ev.sala || 'No especificada'}</p>
          <p><strong>Estado:</strong> <span style="background:${colorEstado}; padding:2px 8px; border-radius:4px;">${ev.estado}</span></p>
          ${esProfesorOJefe ? `
            <div class="mt-3 flex gap-2">
              <button onclick="window.editarEvento(${ev.id})" class="px-4 py-2 bg-blue-600 rounded">Editar</button>
              <button onclick="window.eliminarEvento(${ev.id})" class="px-4 py-2 bg-red-600 rounded">Eliminar</button>
            </div>
          ` : ''}
        </div>`;
    });
    html += '</div>';

    Swal.fire({
      title: `${eventosDia.length} evento${eventosDia.length > 1 ? 's' : ''} el día ${dia}`,
      html,
      width: '700px',
      showConfirmButton: false,
      didOpen: () => {
        window.editarEvento = (id) => {
          const ev = eventosDia.find(e => e.id === id);
          onEditarEvento?.(ev);
          Swal.close();
        };
        window.eliminarEvento = async (id) => {
          const confirm = await Swal.fire({
            title: '¿Eliminar evento?',
            text: 'No podrás deshacer esta acción',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
          });
          if (confirm.isConfirmed) {
            try {
              await eliminarEvento(id);
              Swal.fire('Eliminado', 'El evento fue eliminado', 'success');
              cargarDatos();
            } catch {
              Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
          }
          Swal.close();
        };
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Navegación mes */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => cambiarMes(-1)} className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">← Mes anterior</button>
        <h2 className="text-3xl font-bold">{nombresMeses[fechaMostrada.getMonth()]} {fechaMostrada.getFullYear()}</h2>
        <button onClick={() => cambiarMes(1)} className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">Mes siguiente →</button>
      </div>

      {/* Grid calendario */}
      <div className="grid grid-cols-7 gap-4 text-center">
        {diasSemana.map(d => <div key={d} className="font-bold text-gray-700 py-3 bg-gray-100 rounded">{d}</div>)}

        {dias.map((dia, i) => {
          if (!dia) return <div key={i}></div>;
          // Filtrar eventos por día, mes y año completo para evitar replicación en otros meses
          const eventosDia = eventos.filter(e => e.dia === dia && e.mes === fechaMostrada.getMonth() && e.año === fechaMostrada.getFullYear());
          const bloqueo = diaBloqueado(dia);

          return (
            <div
              key={i}
              onClick={() => mostrarDetallesDia(dia)}
              className={`relative min-h-48 p-4 rounded-lg border-4 cursor-pointer transition-all shadow-md
                ${bloqueo ? 'bg-red-500/30 border-red-600 hover:bg-red-500/40 hover:shadow-lg' : 'bg-white hover:bg-gray-50 hover:shadow-lg'}
                ${esHoy(dia) && !bloqueo ? 'border-[#0E2C66] bg-[#0E2C66]/10' : 'border-gray-400'}
              `}
            >
              <p className={`font-bold text-xl ${esHoy(dia) ? 'text-[#0E2C66]' : 'text-gray-800'}`}>{dia}</p>
              {bloqueo && <p className="text-red-700 font-extrabold text-base mt-2">Bloqueado</p>}

              <div className="space-y-2 mt-3 pr-8">
                {eventosDia.slice(0, 3).map((ev, idx) => (
                  <div 
                    key={idx} 
                    className="text-xs truncate px-2 py-2 rounded text-white font-medium flex items-center justify-between group"
                    style={{backgroundColor: getColorPorTipo(ev.tipo)}}
                    title={ev.nombre}
                  >
                    <span className="flex-1 truncate">{ev.nombre}</span>
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 ml-2" 
                      style={{backgroundColor: getColorPorEstado(ev.estado)}} 
                      title={ev.estado}
                    />
                  </div>
                ))}
                {eventosDia.length > 3 && <p className="text-xs text-gray-600 font-semibold">+{eventosDia.length - 3} más</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-12 p-6 bg-gray-100 rounded-xl">
        <h3 className="font-bold text-xl mb-4 text-center">Leyenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {tiposEventos.map(t => (
            <div key={t.nombre} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border" style={{backgroundColor: `${t.color}66`}}></div>
              <span>{t.nombre}</span>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0E2C66]/10 border-2 border-[#0E2C66]"></div>
            <span>Día actual</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/30 border-2 border-red-500"></div>
            <span>Día bloqueado</span>
          </div>
          <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-gray-500"></div><span>Pendiente</span></div>
          <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Confirmado</span></div>
          <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Cancelado</span></div>
          <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>Reagendado</span></div>
        </div>
      </div>
    </div>
  );
}