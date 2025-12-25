// src/components/CalendarioAlumno.jsx
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function CalendarioAlumno() {
  const hoy = new Date();
  const diaActual = hoy.getDate();
  const mesActual = hoy.getMonth();
  const añoActual = hoy.getFullYear();

  // Estado para el mes mostrado
  const [fechaMostrada, setFechaMostrada] = useState(new Date(añoActual, mesActual));

  // Eventos del alumno (temporal - conecta API)
  const eventosAlumno = [
    {
      dia: 10,
      nombre: 'Certamen 1 - Derecho Civil',
      descripcion: 'Evaluación escrita sobre temas 1 al 5. Traer lápiz.',
      hora: '09:00 - 11:00'
    },
    {
      dia: 15,
      nombre: 'Certamen Oral por Slots',
      descripcion: 'Evaluación oral. Cada alumno tiene 30 minutos.',
      rango: '15 al 20 de diciembre',
      duracion: '30 minutos'
    },
    {
      dia: 24,
      nombre: 'Entrega Trabajo Final',
      descripcion: 'Entrega en PDF. Máximo 15 páginas.',
      hora: 'Hasta las 23:59'
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

  const dias = generarDias();

  const mesMostrado = fechaMostrada.getMonth();
  const añoMostrado = fechaMostrada.getFullYear();

  // Navegación (máximo 8 meses adelante)
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

  const mostrarEventosDelDia = (dia) => {
    if (dia === null) return;

    const eventosDia = eventosAlumno.filter(e => e.dia === dia);

    if (eventosDia.length === 0) {
      Swal.fire({
        title: `${dia} de ${nombresMeses[mesMostrado]} ${añoMostrado}`,
        text: 'No tienes evaluaciones agendadas este día',
        icon: 'info',
        confirmButtonColor: '#0E2C66'
      });
      return;
    }

    let html = '<div class="space-y-4">';
    eventosDia.forEach(evento => {
      html += `
        <div class="p-4 bg-red-50 border border-red-300 rounded-xl">
          <h4 class="font-bold text-red-800 text-lg">${evento.nombre}</h4>
          <p class="text-gray-700 mt-2"><strong>Descripción:</strong> ${evento.descripcion}</p>
          ${evento.hora ? `<p class="text-gray-600 mt-1"><strong>Hora:</strong> ${evento.hora}</p>` : ''}
          ${evento.rango ? `
            <p class="text-gray-600 mt-1"><strong>Rango:</strong> ${evento.rango}</p>
            <p class="text-gray-600"><strong>Duración:</strong> ${evento.duracion}</p>
          ` : ''}
        </div>
      `;
    });
    html += '</div>';

    Swal.fire({
      title: `Evaluaciones el día ${dia}`,
      html,
      confirmButtonColor: '#0E2C66',
      width: '600px'
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">
        📅 Mis Evaluaciones Agendadas
      </h2>

      {/* Navegación y título */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => cambiarMes(-1)}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition shadow"
        >
          ← Mes Anterior
        </button>

        <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
          {nombresMeses[mesMostrado]} {añoMostrado}
        </h3>

        <button
          onClick={() => cambiarMes(1)}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition shadow"
        >
          Mes Siguiente →
        </button>
      </div>

      {/* Calendario compacto */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-300 p-6">
        <div className="grid grid-cols-7 gap-3 text-center">
          {diasSemana.map(d => (
            <div key={d} className="font-bold text-gray-700 py-3 bg-gray-100 rounded-lg">
              {d}
            </div>
          ))}

          {dias.map((dia, i) => {
            if (dia === null) return <div key={i}></div>;

            const eventosDia = eventosAlumno.filter(e => e.dia === dia);

            return (
              <div
                key={i}
                onClick={() => mostrarEventosDelDia(dia)}
                className={`
                  min-h-28 p-4 rounded-xl border-2 transition-all cursor-pointer
                  bg-white hover:bg-gray-50 hover:shadow-lg
                  ${esHoy(dia)
                    ? 'border-[#0E2C66] bg-[#0E2C66]/10 shadow-md'
                    : 'border-gray-300'
                  }
                  ${eventosDia.length > 0 ? 'ring-2 ring-red-300' : ''}
                `}
              >
                <p className={`text-lg font-bold mb-2 ${esHoy(dia) ? 'text-[#0E2C66]' : 'text-gray-800'}`}>
                  {dia}
                </p>

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
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-10 p-6 bg-gray-100 rounded-xl border border-gray-300 text-center">
        <div className="flex justify-center gap-8 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 border-2 border-red-400"></div>
            <span className="text-gray-700 font-medium">Día con evaluación</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0E2C66]/10 border-2 border-[#0E2C66]"></div>
            <span className="text-gray-700 font-medium">Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
}