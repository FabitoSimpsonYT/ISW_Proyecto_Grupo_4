// src/components/AgendaProfesor.jsx
import { useState, useEffect } from 'react';
import { evaluacionService, inscripcionService } from '../services/evaluacion.service';
import Swal from 'sweetalert2';

export default function AgendaProfesor() {
  const [vista, setVista] = useState('calendario'); // 'calendario', 'crear', 'editar'
  const [mesActual, setMesActual] = useState(new Date());
  const [misEventos, setMisEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarModalInscripciones, setMostrarModalInscripciones] = useState(false);

  // Formulario para crear/editar evento
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'confirmado',
    fechaInicio: '',
    fechaFin: '',
    tipoEvento: 'evaluacion',
    modalidad: 'presencial',
    linkOnline: '',
    sala: '',
    ramoId: '',
    seccionId: '',
    duracionPorAlumno: '',
    cupoMaximo: '',
    tipoInscripcion: 'individual',
    tamanioGrupo: 1
  });

  useEffect(() => {
    cargarMisEventos();
  }, [mesActual]);

  const cargarMisEventos = async () => {
    setLoading(true);
    try {
      const inicio = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
      const fin = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
      const res = await evaluacionService.obtenerMisEventos({
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString()
      });
      setMisEventos(res.data.eventos || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearEvento = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre || !formData.fechaInicio || !formData.fechaFin) {
      Swal.fire({ icon: 'warning', text: 'Completa todos los campos obligatorios' });
      return;
    }

    if (formData.modalidad === 'online' && !formData.linkOnline) {
      Swal.fire({ icon: 'warning', text: 'Los eventos online requieren un link' });
      return;
    }

    if (formData.modalidad === 'presencial' && !formData.sala) {
      Swal.fire({ icon: 'warning', text: 'Los eventos presenciales requieren una sala' });
      return;
    }

    setLoading(true);
    try {
      await evaluacionService.crear({
        ...formData,
        cupoMaximo: parseInt(formData.cupoMaximo) || 1,
        duracionPorAlumno: parseInt(formData.duracionPorAlumno) || null,
        tamanioGrupo: parseInt(formData.tamanioGrupo),
        alumnosEmails: [] // Aquí deberías cargar los emails de tus alumnos del ramo
      });

      await Swal.fire({ 
        icon: 'success', 
        title: '¡Evento creado!', 
        text: formData.duracionPorAlumno ? 'Slots generados automáticamente' : '',
        timer: 2000, 
        showConfirmButton: false 
      });

      resetForm();
      setVista('calendario');
      cargarMisEventos();
    } catch (error) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error', 
        text: error.response?.data?.error || 'Error al crear evento' 
      });
    } finally {
      setLoading(false);
    }
  };

  const editarEvento = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await evaluacionService.actualizar(eventoSeleccionado.id, {
        ...formData,
        cupoMaximo: parseInt(formData.cupoMaximo),
        duracionPorAlumno: parseInt(formData.duracionPorAlumno) || null,
        tamanioGrupo: parseInt(formData.tamanioGrupo)
      });

      await Swal.fire({ icon: 'success', title: '¡Evento actualizado!', timer: 2000, showConfirmButton: false });
      
      resetForm();
      setVista('calendario');
      cargarMisEventos();
    } catch (error) {
      Swal.fire({ icon: 'error', text: error.response?.data?.error || 'Error al actualizar' });
    } finally {
      setLoading(false);
    }
  };

  const eliminarEvento = async (eventoId, nombreEvento) => {
    const result = await Swal.fire({
      title: '¿Eliminar evento?',
      text: `"${nombreEvento}" - Esta acción no se puede deshacer`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await evaluacionService.eliminar(eventoId);
        await Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
        cargarMisEventos();
      } catch (error) {
        Swal.fire({ icon: 'error', text: error.response?.data?.error || 'Error al eliminar' });
      } finally {
        setLoading(false);
      }
    }
  };

  const verInscripciones = async (evento) => {
    setLoading(true);
    try {
      const res = await inscripcionService.obtenerPorEvento(evento.id);
      setInscripciones(res.data.inscripciones || []);
      setEventoSeleccionado(evento);
      setMostrarModalInscripciones(true);
    } catch (error) {
      Swal.fire({ icon: 'error', text: 'Error al cargar inscripciones' });
    } finally {
      setLoading(false);
    }
  };

  const abrirEditar = (evento) => {
    setEventoSeleccionado(evento);
    setFormData({
      nombre: evento.nombre,
      descripcion: evento.descripcion || '',
      estado: evento.estado,
      fechaInicio: new Date(evento.fechaInicio).toISOString().slice(0, 16),
      fechaFin: new Date(evento.fechaFin).toISOString().slice(0, 16),
      tipoEvento: evento.tipoEvento,
      modalidad: evento.modalidad,
      linkOnline: evento.linkOnline || '',
      sala: evento.sala || '',
      ramoId: evento.ramoId,
      seccionId: evento.seccionId,
      duracionPorAlumno: evento.duracionPorAlumno || '',
      cupoMaximo: evento.cupoMaximo,
      tipoInscripcion: evento.tipoInscripcion,
      tamanioGrupo: evento.tamanioGrupo
    });
    setVista('editar');
  };

  const resetForm = () => {
    setFormData({
      nombre: '', descripcion: '', estado: 'confirmado', fechaInicio: '', fechaFin: '',
      tipoEvento: 'evaluacion', modalidad: 'presencial', linkOnline: '', sala: '',
      ramoId: '', seccionId: '', duracionPorAlumno: '', cupoMaximo: '',
      tipoInscripcion: 'individual', tamanioGrupo: 1
    });
    setEventoSeleccionado(null);
  };

  const renderCalendario = () => {
    const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
    const dias = [];

    for (let i = primerDia.getDay(); i > 0; i--) {
      const fecha = new Date(primerDia);
      fecha.setDate(fecha.getDate() - i);
      dias.push({ fecha, mesActual: false });
    }

    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      dias.push({ fecha: new Date(mesActual.getFullYear(), mesActual.getMonth(), d), mesActual: true });
    }

    const faltantes = 42 - dias.length;
    for (let i = 1; i <= faltantes; i++) {
      const fecha = new Date(ultimoDia);
      fecha.setDate(fecha.getDate() + i);
      dias.push({ fecha, mesActual: false });
    }

    return dias;
  };

  const obtenerEventosDelDia = (fecha) => {
    return misEventos.filter(e => new Date(e.fechaInicio).toDateString() === fecha.toDateString());
  };

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setVista('calendario'); resetForm(); }}
          className={`px-6 py-3 rounded-lg font-medium ${vista === 'calendario' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          📅 Mi Calendario
        </button>
        <button
          onClick={() => { setVista('crear'); resetForm(); }}
          className={`px-6 py-3 rounded-lg font-medium ${vista === 'crear' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          ➕ Crear Evento
        </button>
      </div>

      {/* VISTA CALENDARIO */}
      {vista === 'calendario' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
              ← Anterior
            </button>
            <h2 className="text-2xl font-bold">{mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
              Siguiente →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="text-center font-semibold py-2">{d}</div>
            ))}

            {renderCalendario().map((diaObj, i) => {
              const eventos = obtenerEventosDelDia(diaObj.fecha);
              const esHoy = diaObj.fecha.toDateString() === new Date().toDateString();

              return (
                <div
                  key={i}
                  className={`min-h-[120px] border rounded p-2 ${!diaObj.mesActual ? 'bg-gray-50' : esHoy ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className={`text-sm font-semibold mb-1 ${esHoy ? 'text-blue-600' : ''}`}>
                    {diaObj.fecha.getDate()}
                  </div>

                  {eventos.map(ev => (
                    <div key={ev.id} className="text-xs bg-green-100 text-green-800 p-1 rounded mb-1 group cursor-pointer hover:bg-green-200">
                      <div className="font-semibold truncate">{ev.nombre}</div>
                      <div>{new Date(ev.fechaInicio).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}</div>
                      <div className="text-xs">
                        <span className={`inline-block px-1 rounded ${ev.estado === 'confirmado' ? 'bg-green-200' : ev.estado === 'pendiente' ? 'bg-yellow-200' : 'bg-gray-200'}`}>
                          {ev.estado}
                        </span>
                      </div>
                      
                      {/* Acciones al hover */}
                      <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); verInscripciones(ev); }}
                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                          title="Ver inscripciones"
                        >
                          👁️
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); abrirEditar(ev); }}
                          className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); eliminarEvento(ev.id, ev.nombre); }}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
              <span>Hoy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span>Evento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-200 rounded"></div>
              <span>Pendiente</span>
            </div>
          </div>
        </div>
      )}

      {/* VISTA CREAR/EDITAR */}
      {(vista === 'crear' || vista === 'editar') && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">{vista === 'crear' ? 'Crear Nuevo Evento' : 'Editar Evento'}</h2>

          <form onSubmit={vista === 'crear' ? crearEvento : editarEvento} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block font-medium mb-1">Nombre del evento *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block font-medium mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Tipo de evento *</label>
                <select
                  value={formData.tipoEvento}
                  onChange={(e) => setFormData({...formData, tipoEvento: e.target.value})}
                  className="w-full px-4 py-2 border rounded"
                >
                  <option value="evaluacion">Evaluación</option>
                  <option value="reunion">Reunión</option>
                  <option value="clase">Clase</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Estado *</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  className="w-full px-4 py-2 border rounded"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="tentativo">Tentativo</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Fecha y hora inicio *</label>
                <input
                  type="datetime-local"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Fecha y hora fin *</label>
                <input
                  type="datetime-local"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Modalidad *</label>
                <select
                  value={formData.modalidad}
                  onChange={(e) => setFormData({...formData, modalidad: e.target.value})}
                  className="w-full px-4 py-2 border rounded"
                >
                  <option value="presencial">🏫 Presencial</option>
                  <option value="online">💻 Online</option>
                </select>
              </div>

              {formData.modalidad === 'presencial' && (
                <div>
                  <label className="block font-medium mb-1">Sala *</label>
                  <input
                    type="text"
                    value={formData.sala}
                    onChange={(e) => setFormData({...formData, sala: e.target.value})}
                    placeholder="Ej: Sala 301"
                    className="w-full px-4 py-2 border rounded"
                    required
                  />
                </div>
              )}

              {formData.modalidad === 'online' && (
                <div>
                  <label className="block font-medium mb-1">Link de reunión *</label>
                  <input
                    type="url"
                    value={formData.linkOnline}
                    onChange={(e) => setFormData({...formData, linkOnline: e.target.value})}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-4 py-2 border rounded"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">ID del Ramo *</label>
                <input
                  type="text"
                  value={formData.ramoId}
                  onChange={(e) => setFormData({...formData, ramoId: e.target.value})}
                  placeholder="Ej: DERECHO-101"
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">ID de Sección *</label>
                <input
                  type="text"
                  value={formData.seccionId}
                  onChange={(e) => setFormData({...formData, seccionId: e.target.value})}
                  placeholder="Ej: SEC-1"
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Duración por alumno/grupo (minutos)</label>
                <input
                  type="number"
                  value={formData.duracionPorAlumno}
                  onChange={(e) => setFormData({...formData, duracionPorAlumno: e.target.value})}
                  min="5"
                  placeholder="Ej: 20"
                  className="w-full px-4 py-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">✨ Se generarán slots automáticos</p>
              </div>

              <div>
                <label className="block font-medium mb-1">Cupo máximo *</label>
                <input
                  type="number"
                  value={formData.cupoMaximo}
                  onChange={(e) => setFormData({...formData, cupoMaximo: e.target.value})}
                  min="1"
                  placeholder="Ej: 40"
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Tipo de inscripción *</label>
                <select
                  value={formData.tipoInscripcion}
                  onChange={(e) => setFormData({
                    ...formData, 
                    tipoInscripcion: e.target.value,
                    tamanioGrupo: e.target.value === 'individual' ? 1 : e.target.value === 'pareja' ? 2 : 3
                  })}
                  className="w-full px-4 py-2 border rounded"
                >
                  <option value="individual">👤 Individual</option>
                  <option value="pareja">👥 Pareja (2 personas)</option>
                  <option value="grupo">👥👥 Grupo</option>
                </select>
              </div>

              {formData.tipoInscripcion === 'grupo' && (
                <div>
                  <label className="block font-medium mb-1">Tamaño máximo del grupo *</label>
                  <input
                    type="number"
                    value={formData.tamanioGrupo}
                    onChange={(e) => setFormData({...formData, tamanioGrupo: e.target.value})}
                    min="2"
                    max="10"
                    className="w-full px-4 py-2 border rounded"
                    required
                  />
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => { setVista('calendario'); resetForm(); }}
                className="flex-1 px-6 py-3 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : vista === 'crear' ? 'Crear Evento' : 'Actualizar Evento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL INSCRIPCIONES */}
      {mostrarModalInscripciones && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Inscripciones: {eventoSeleccionado?.nombre}</h2>
                <p className="text-sm text-gray-600">Total: {inscripciones.length} inscripciones</p>
              </div>
              <button onClick={() => setMostrarModalInscripciones(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="p-6">
              {inscripciones.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay inscripciones aún</p>
              ) : (
                <div className="space-y-3">
                  {inscripciones.map((insc, index) => (
                    <div key={insc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Inscripción #{index + 1}</p>
                          <p className="text-sm text-gray-600">
                            📧 Email: {insc.alumnoEmail}
                          </p>
                          <p className="text-sm text-gray-600">
                            🕐 Horario: {new Date(insc.horarioAsignado.inicio).toLocaleString('es-CL')} - 
                            {new Date(insc.horarioAsignado.fin).toLocaleTimeString('es-CL', {hour: '2-digit', minute: '2-digit'})}
                          </p>
                          
                          {insc.miembrosGrupo?.length > 0 && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <p className="text-sm font-medium text-blue-800">
                                👥 Grupo de {insc.cantidadMiembros} personas:
                              </p>
                              <ul className="text-sm text-blue-700 ml-4 list-disc">
                                {insc.miembrosGrupo.map((miembro, i) => (
                                  <li key={i}>{miembro.alumnoEmail}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          insc.estado === 'confirmado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {insc.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}