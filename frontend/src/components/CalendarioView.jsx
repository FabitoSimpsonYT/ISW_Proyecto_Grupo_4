// src/components/CalendarioView.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getEventosProfesor, getEventosAlumno } from '../services/evento.service.js';
import { getTiposEventos } from '../services/tipoEvento.service.js';
import { getBloqueos } from '../services/bloqueo.service.js';

export default function CalendarioView() {
  const [fechaMostrada, setFechaMostrada] = useState(new Date());
  const [eventos, setEventos] = useState([]);
  const [tiposEventos, setTiposEventos] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);

  const hoy = new Date();
  const diaActual = hoy.getDate();
  const mesActual = hoy.getMonth();
  const añoActual = hoy.getFullYear();

  const getColorPorTipo = (tipoNombre) => {
    const tipo = tiposEventos.find(t => t.nombre === tipoNombre);
    return tipo ? tipo.color : '#6B7280';
  };

  const mapBackendEventos = (backendEventos, tipos) => {
    // backendEventos items expected to have nombre, fecha_inicio, fecha_fin, tipo_evento_id
    return backendEventos.map(ev => {
      const fecha = ev.fecha_inicio ? new Date(ev.fecha_inicio) : (ev.fechaInicio ? new Date(ev.fechaInicio) : null);
      const dia = fecha ? fecha.getDate() : null;
      const hora = fecha ? fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ev.hora || null;
      const tipoObj = tipos.find(t => t.id === ev.tipo_evento_id || t.id === ev.tipoEvento || t.id === ev.tipo);
      const tipoNombre = tipoObj ? tipoObj.nombre : (ev.tipo_nombre || ev.tipo || 'OTRO');
      return { dia, nombre: ev.nombre || ev.titulo || ev.subject || '', tipo: tipoNombre, hora };
    }).filter(e => e.dia !== null);
  };

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

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

  const cargarDatos = async () => {
    try {
      const tiposRes = await getTiposEventos();
      const tiposData = tiposRes?.data || tiposRes || [];
      setTiposEventos(tiposData);

      // Intentamos cargar eventos de profesor; si falla, cargamos eventos alumno
      try {
        const evRes = await getEventosProfesor();
        const evs = evRes?.data || evRes || [];
        setEventos(mapBackendEventos(evs, tiposData));
      } catch (err) {
        const evRes = await getEventosAlumno();
        const evs = evRes?.data || evRes || [];
        setEventos(mapBackendEventos(evs, tiposData));
      }

      // Cargar bloqueos (rango de fechas)
      try {
        const bRes = await getBloqueos();
        const bData = bRes?.data || bRes || [];
        const parsed = bData.map(b => ({
          ...b,
          fechaInicioObj: b.fechaInicio ? new Date(b.fechaInicio) : null,
          fechaFinObj: b.fechaFin ? new Date(b.fechaFin) : null
        }));
        setBloqueos(parsed);
      } catch (errBloq) {
        console.warn('No se pudieron cargar bloqueos:', errBloq);
        setBloqueos([]);
      }
    } catch (err) {
      console.error('Error cargando eventos/tipos:', err);
    }
  };

  useEffect(() => {
    cargarDatos();

    const onTipos = () => cargarDatos();
    const onEventos = () => cargarDatos();
    window.addEventListener('tiposUpdated', onTipos);
    window.addEventListener('eventosUpdated', onEventos);
    return () => {
      window.removeEventListener('tiposUpdated', onTipos);
      window.removeEventListener('eventosUpdated', onEventos);
    };
  }, []);

  const mesMostrado = fechaMostrada.getMonth();
  const añoMostrado = fechaMostrada.getFullYear();

  const cambiarMes = (direccion) => {
    const nuevaFecha = new Date(fechaMostrada);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);

    const mesesAdelante = (nuevaFecha.getFullYear() - añoActual) * 12 + (nuevaFecha.getMonth() - mesActual);
    if (mesesAdelante > 8) {
      Swal.fire('Límite', 'Solo puedes ver hasta 8 meses adelante', 'info');
      return;
    }

    setFechaMostrada(nuevaFecha);
  };

  const esHoy = (dia) => dia === diaActual && mesMostrado === mesActual && añoMostrado === añoActual;

  const mostrarEventosDelDia = (dia) => {
    if (dia === null) return;

    const eventosDia = eventos.filter(e => e.dia === dia);

    if (eventosDia.length === 0) {
      Swal.fire({
        title: `${dia} de ${nombresMeses[mesMostrado]} ${añoMostrado}`,
        text: 'No hay eventos agendados para este día',
        icon: 'info',
        confirmButtonColor: '#0E2C66'
      });
      return;
    }

    let html = '<div class="space-y-3">';
    eventosDia.forEach(evento => {
      const color = getColorPorTipo(evento.tipo);
      html += `
        <div class="p-3 rounded-lg text-white shadow" style="background-color: ${color}CC;">
          <p class="font-semibold">${evento.nombre}</p>
          <p class="text-sm opacity-90">${evento.hora || 'Hora no especificada'}</p>
        </div>
      `;
    });
    html += '</div>';

    Swal.fire({
      title: `${eventosDia.length} evento${eventosDia.length > 1 ? 's' : ''}`,
      html,
      confirmButtonColor: '#0E2C66'
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Navegación y título */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <button
          onClick={() => cambiarMes(-1)}
          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
        >
          ← Mes Anterior
        </button>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          {nombresMeses[mesMostrado]} {añoMostrado}
        </h2>

        <button
          onClick={() => cambiarMes(1)}
          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
        >
          Mes Siguiente →
        </button>
      </div>

      {/* Calendario compacto y responsive */}
      <div className="grid grid-cols-7 gap-2 md:gap-4 text-center">
        {/* Encabezados */}
        {diasSemana.map((diaSemana) => (
          <div key={diaSemana} className="font-bold text-gray-800 py-3 bg-gray-200 border border-gray-400 rounded-lg">
            {diaSemana}
          </div>
        ))}

        {/* Días - COMPACTOS y ADAPTATIVOS */}
        {dias.map((dia, index) => {
          if (dia === null) return <div key={index}></div>;

          const eventosDia = eventos.filter(e => e.dia === dia);

          // Determinar si el día está bloqueado
          const fechaDia = new Date(añoMostrado, mesMostrado, dia);
          const estaBloqueado = bloqueos.some(b => {
            if (!b.fechaInicioObj || !b.fechaFinObj) return false;
            const inicio = new Date(b.fechaInicioObj.getFullYear(), b.fechaInicioObj.getMonth(), b.fechaInicioObj.getDate());
            const fin = new Date(b.fechaFinObj.getFullYear(), b.fechaFinObj.getMonth(), b.fechaFinObj.getDate());
            return fechaDia.getTime() >= inicio.getTime() && fechaDia.getTime() <= fin.getTime();
          });

          return (
            <div
              key={index}
              onClick={() => mostrarEventosDelDia(dia)}
              className={`
                min-h-24 md:min-h-32 p-2 md:p-4 rounded-lg border transition-all cursor-pointer
                ${estaBloqueado ? 'bg-red-50 border-2 border-red-400/60 text-red-700 hover:bg-red-100' : 'bg-white hover:bg-gray-50 hover:shadow-md'}
                ${!estaBloqueado && (esHoy(dia)
                  ? 'border-2 border-[#0E2C66] bg-[#0E2C66]/10'
                  : 'border-gray-300')
                }
              `}
            >
              <p className={`font-bold text-lg mb-2 ${esHoy(dia) ? 'text-[#0E2C66]' : 'text-gray-800'}`}>
                {dia}
              </p>

              <div className="space-y-1">
                {eventosDia.slice(0, 3).map((evento, idx) => (
                  <div
                    key={idx}
                    className="text-xs px-2 py-1 rounded text-white truncate shadow-sm"
                    style={{ backgroundColor: `${getColorPorTipo(evento.tipo)}B3` }}
                    title={evento.nombre}
                  >
                    {evento.nombre}
                  </div>
                ))}
                {eventosDia.length > 3 && (
                  <p className="text-xs text-gray-600">+{eventosDia.length - 3} más</p>
                )}
                {estaBloqueado && (
                  <div className="mt-2 text-xs text-red-700 font-semibold">Día bloqueado</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda compacta */}
      <div className="mt-8 p-6 bg-gray-100 rounded-lg border border-gray-400">
        <h3 className="font-bold text-gray-800 mb-4 text-center">Leyenda de colores</h3>
        <div className="flex flex-wrap justify-center gap-6">
          {tiposEventos.map((tipo) => (
            <div key={tipo.nombre} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg shadow-sm border border-gray-500"
                style={{ backgroundColor: `${tipo.color}66` }}
              ></div>
              <span className="text-gray-700 font-medium">{tipo.nombre}</span>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0E2C66]/10 border-2 border-[#0E2C66]"></div>
            <span className="text-gray-700 font-medium">Día actual</span>
          </div>
        </div>
      </div>
    </div>
  );
}