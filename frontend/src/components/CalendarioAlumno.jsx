// src/components/CalendarioAlumno.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getEventosAlumno } from '../services/evento.service.js';
import { getBloqueos } from '../services/bloqueo.service.js';
import { getTiposEventos } from '../services/tipoEvento.service.js';

export default function CalendarioAlumno() {
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
  ];

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Semana LUNES a DOMINGO con "Mié" en lugar de "X"
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Generar días del mes mostrado
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

  useEffect(() => {
    cargarDatos();
    const recargar = () => { cargarDatos(); };
    window.addEventListener('bloqueosUpdated', recargar);
    return () => window.removeEventListener('bloqueosUpdated', recargar);
  }, []);

  const mostrarEventosDelDia = (dia) => {
    // Similar to CalendarioView, but without edit/delete
    // ... (copia el código de mostrarEventosDelDia de CalendarioView, removiendo botones isProfesor)
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

            const eventosDia = eventos.filter(e => e.dia === dia);

            const fechaDia = new Date(añoMostrado, mesMostrado, dia);
            const bloqueo = bloqueos.find(b => {
              // same as above
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
                    {eventosDia.slice(0, 2).map((e, idx) => (
                      <p key={idx} className="text-xs text-gray-600 truncate">
                        {e.nombre}
                      </p>
                    ))}
                    {eventosDia.length > 2 && (
                      <p className="text-xs text-gray-500">+{eventosDia.length - 2} más</p>
                    )}
                  </div>

                  {/* Dots for states */}
                  {eventosDia.length > 0 && (
                    <div className="absolute top-0 right-0 flex flex-col gap-1">
                      {eventosDia.map((e, idx) => (
                        <div
                          key={idx}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getColorPorEstado(e.estado) }}
                          title={e.estado}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend (same as CalendarioView) */}
      <div className="mt-10 p-6 bg-gray-100 rounded-xl border border-gray-300 text-center">
        <div className="flex justify-center gap-8 flex-wrap">
          {/* Tipos */}
          {tiposEventos.map((tipo) => (
            <div key={tipo.nombre} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[color]/66 border border-gray-500" style={{ backgroundColor: `${tipo.color}66` }}></div>
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