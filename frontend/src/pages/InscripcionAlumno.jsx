import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

// Simulación de servicios
const getBloqueos = async () => {
  return {
    data: [
      {
        id: 1,
        fecha_inicio: '2025-02-01',
        fecha_fin: '2025-02-07',
        razon: 'Semana de receso',
        created_by: 1,
        creador: { nombres: 'María', apellidoPaterno: 'González' },
        created_at: '2025-01-01T10:00:00'
      }
    ]
  };
};

const crearBloqueo = async (data) => {
  console.log('Creando bloqueo:', data);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { 
    success: true, 
    data: { 
      id: Date.now(), 
      ...data,
      created_at: new Date().toISOString()
    } 
  };
};

const eliminarBloqueo = async (id) => {
  console.log('Eliminando bloqueo:', id);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
};

export default function BloquearDias() {
  const [bloqueos, setBloqueos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fechaInicio: '',
    fechaFin: '',
    razon: ''
  });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista' o 'calendario'
  const [mesActual, setMesActual] = useState(new Date());

  useEffect(() => {
    cargarBloqueos();
  }, []);

  const cargarBloqueos = async () => {
    setLoading(true);
    try {
      const res = await getBloqueos();
      setBloqueos(res?.data || res || []);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar los bloqueos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fechaInicio || !formData.fechaFin) {
      Swal.fire('Error', 'Debes especificar fecha de inicio y fin', 'warning');
      return;
    }

    const inicio = new Date(formData.fechaInicio);
    const fin = new Date(formData.fechaFin);

    if (fin < inicio) {
      Swal.fire('Error', 'La fecha de fin debe ser posterior a la fecha de inicio', 'warning');
      return;
    }

    if (!formData.razon.trim()) {
      Swal.fire('Error', 'Debes especificar el motivo del bloqueo', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: '¿Crear bloqueo?',
      html: `
        <div class="text-left space-y-2">
          <p><strong>Período:</strong></p>
          <p class="ml-4">Desde: ${formatearFecha(formData.fechaInicio)}</p>
          <p class="ml-4">Hasta: ${formatearFecha(formData.fechaFin)}</p>
          <p class="mt-3"><strong>Motivo:</strong></p>
          <p class="ml-4">${formData.razon}</p>
        </div>
        <div class="mt-4 p-3 bg-yellow-50 rounded">
          <p class="text-sm text-yellow-800">⚠️ Los profesores no podrán crear eventos en estas fechas</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Sí, bloquear',
      cancelButtonText: 'Cancelar',
      width: '600px'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await crearBloqueo(formData);
      
      Swal.fire({
        title: '¡Bloqueo creado!',
        html: `
          <p>Las fechas han sido bloqueadas exitosamente</p>
          <div class="mt-4 p-3 bg-green-50 rounded text-left">
            <p class="text-sm"><strong>Período bloqueado:</strong></p>
            <p class="text-sm">${formatearFecha(formData.fechaInicio)} - ${formatearFecha(formData.fechaFin)}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#0E2C66'
      });

      setFormData({ fechaInicio: '', fechaFin: '', razon: '' });
      setModoEdicion(false);
      cargarBloqueos();
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudo crear el bloqueo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (bloqueo) => {
    const result = await Swal.fire({
      title: '¿Eliminar bloqueo?',
      html: `
        <div class="text-left space-y-2">
          <p>Se eliminará el siguiente bloqueo:</p>
          <div class="mt-3 p-3 bg-gray-50 rounded">
            <p><strong>Período:</strong></p>
            <p class="ml-4">${formatearFecha(bloqueo.fecha_inicio)} - ${formatearFecha(bloqueo.fecha_fin)}</p>
            <p class="mt-2"><strong>Motivo:</strong></p>
            <p class="ml-4">${bloqueo.razon}</p>
          </div>
          <p class="text-sm text-gray-600 mt-3">Los profesores podrán crear eventos en estas fechas nuevamente</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      width: '600px'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await eliminarBloqueo(bloqueo.id);
      
      Swal.fire('¡Eliminado!', 'El bloqueo ha sido removido', 'success');
      cargarBloqueos();
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudo eliminar el bloqueo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDiasBloqueo = (inicio, fin) => {
    const start = new Date(inicio + 'T00:00:00');
    const end = new Date(fin + 'T00:00:00');
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  const generarCalendario = () => {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();
    const offset = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    const dias = [];
    for (let i = 0; i < offset; i++) {
      dias.push(null);
    }
    for (let i = 1; i <= diasEnMes; i++) {
      dias.push(i);
    }

    return dias;
  };

  const esDiaBloqueado = (dia) => {
    if (!dia) return false;
    
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    
    return bloqueos.find(b => {
      const inicio = new Date(b.fecha_inicio + 'T00:00:00');
      const fin = new Date(b.fecha_fin + 'T00:00:00');
      return fecha >= inicio && fecha <= fin;
    });
  };

  const cambiarMes = (direccion) => {
    const nuevaFecha = new Date(mesActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setMesActual(nuevaFecha);
  };

  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const diasCalendario = generarCalendario();

  const bloqueosOrdenados = [...bloqueos].sort((a, b) => 
    new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
  );

  const bloqueosActivos = bloqueosOrdenados.filter(b => 
    new Date(b.fecha_fin) >= new Date()
  );

  const bloqueosPasados = bloqueosOrdenados.filter(b => 
    new Date(b.fecha_fin) < new Date()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-4xl font-bold mb-2">🚫 Administración de Bloqueos</h1>
          <p className="text-red-100 text-lg">
            Gestiona las fechas en las que no se pueden crear evaluaciones
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toggle Vista */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setVistaActual('lista')}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${
              vistaActual === 'lista'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📋 Vista Lista
          </button>
          <button
            onClick={() => setVistaActual('calendario')}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${
              vistaActual === 'calendario'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📅 Vista Calendario
          </button>
        </div>

        {/* Formulario de creación */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-red-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <span>➕</span> Crear Nuevo Bloqueo
            </h2>
            {!modoEdicion && (
              <button
                onClick={() => setModoEdicion(true)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition"
              >
                Crear Bloqueo
              </button>
            )}
          </div>

          {modoEdicion && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    required
                    min={formData.fechaInicio || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">
                  Motivo del Bloqueo *
                </label>
                <textarea
                  value={formData.razon}
                  onChange={(e) => setFormData({ ...formData, razon: e.target.value })}
                  required
                  rows="3"
                  placeholder="Ej: Semana de receso, Feriado institucional, Período de exámenes..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setModoEdicion(false);
                    setFormData({ fechaInicio: '', fechaFin: '', razon: '' });
                  }}
                  disabled={loading}
                  className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-bold transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Bloqueo'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Vista Lista */}
        {vistaActual === 'lista' && (
          <div className="space-y-6">
            {/* Bloqueos Activos */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🔴</span> Bloqueos Activos ({bloqueosActivos.length})
              </h3>

              {bloqueosActivos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-gray-600">No hay bloqueos activos actualmente</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bloqueosActivos.map(bloqueo => (
                    <div key={bloqueo.id} className="bg-red-50 border-2 border-red-300 rounded-xl p-5 hover:shadow-lg transition">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🚫</span>
                            <span className="font-bold text-red-700">
                              {getDiasBloqueo(bloqueo.fecha_inicio, bloqueo.fecha_fin)} días bloqueados
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Desde:</strong> {formatearFecha(bloqueo.fecha_inicio)}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Hasta:</strong> {formatearFecha(bloqueo.fecha_fin)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEliminar(bloqueo)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition text-sm disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg mb-3">
                        <p className="text-sm text-gray-700">
                          <strong>Motivo:</strong> {bloqueo.razon}
                        </p>
                      </div>

                      <div className="text-xs text-gray-600 flex items-center gap-2">
                        <span>👤 Creado por: {bloqueo.creador?.nombres} {bloqueo.creador?.apellidoPaterno}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bloqueos Pasados */}
            {bloqueosPasados.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-600 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📜</span> Historial de Bloqueos ({bloqueosPasados.length})
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bloqueosPasados.map(bloqueo => (
                    <div key={bloqueo.id} className="bg-gray-50 border border-gray-300 rounded-lg p-4 opacity-60">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700 mb-1">
                            {formatearFecha(bloqueo.fecha_inicio)} - {formatearFecha(bloqueo.fecha_fin)}
                          </p>
                          <p className="text-xs text-gray-600">{bloqueo.razon}</p>
                        </div>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">Finalizado</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vista Calendario */}
        {vistaActual === 'calendario' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => cambiarMes(-1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition"
              >
                ← Mes Anterior
              </button>
              <h3 className="text-2xl font-bold text-gray-800">
                {nombresMeses[mesActual.getMonth()]} {mesActual.getFullYear()}
              </h3>
              <button
                onClick={() => cambiarMes(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition"
              >
                Mes Siguiente →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {diasSemana.map(dia => (
                <div key={dia} className="text-center font-bold text-gray-700 py-3 bg-gray-100 rounded">
                  {dia}
                </div>
              ))}

              {diasCalendario.map((dia, idx) => {
                const bloqueo = esDiaBloqueado(dia);
                
                return (
                  <div
                    key={idx}
                    className={`min-h-20 p-2 rounded-lg border-2 transition ${
                      dia === null 
                        ? 'bg-gray-50 border-transparent'
                        : bloqueo
                        ? 'bg-red-100 border-red-400 cursor-pointer hover:bg-red-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      if (bloqueo) {
                        Swal.fire({
                          title: `Día bloqueado`,
                          html: `
                            <div class="text-left">
                              <p><strong>Motivo:</strong> ${bloqueo.razon}</p>
                              <p class="mt-2"><strong>Período:</strong></p>
                              <p>${formatearFecha(bloqueo.fecha_inicio)}</p>
                              <p>hasta ${formatearFecha(bloqueo.fecha_fin)}</p>
                            </div>
                          `,
                          icon: 'info',
                          confirmButtonColor: '#DC2626'
                        });
                      }
                    }}
                  >
                    {dia && (
                      <>
                        <div className={`text-lg font-bold ${bloqueo ? 'text-red-700' : 'text-gray-800'}`}>
                          {dia}
                        </div>
                        {bloqueo && (
                          <div className="text-xs text-red-600 font-bold mt-1">
                            🚫 Bloqueado
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="mt-6 pt-6 border-t-2 border-gray-200 flex justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 border-2 border-red-400 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Día bloqueado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white border-2 border-gray-200 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Día disponible</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}