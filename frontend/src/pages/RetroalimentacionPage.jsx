import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RetroalimentacionChat } from '../components/RetroalimentacionChat';
import { useAuth } from '../context/AuthContext';
import { getAlumnosBySeccion, getMisRamos, getRamosByCodigo } from '../services/ramos.service';
import { getAllAlumnos, getProfesorById, getProfesorByRut, getAllProfesores } from '../services/users.service';
import { getEvaluacionById } from '../services/evaluacion.service';
import { getEvaluacionIntegradora } from '../services/evaluacionIntegradora.service';

export default function RetroalimentacionPage() {
  const { ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Validar y convertir parámetros a número
  const codigoRamo = ramoId && ramoId !== 'undefined' ? parseInt(ramoId) : null;
  const evalId = evaluacionId ? parseInt(evaluacionId) : null;
  const evalIntegradoraId = evaluacionIntegradoraId ? parseInt(evaluacionIntegradoraId) : null;

  const [alumnoInfo, setAlumnoInfo] = useState({
    nombre: '',
    email: '',
  });

  const [profesorInfo, setProfesorInfo] = useState({
    nombre: '',
    email: '',
    rut: '',
  });

  const [ramoNombre, setRamoNombre] = useState('');

  const [evaluacionInfo, setEvaluacionInfo] = useState({
    id: evalId || evalIntegradoraId,
    nombre: '',
  });

  useEffect(() => {
    // Validar que tenemos los parámetros necesarios
    if (!codigoRamo || !alumnoRut) {
      console.error('Parámetros faltantes:', { codigoRamo, alumnoRut });
      navigate(-1);
      return;
    }

    // Validar que el usuario está autorizado para acceder a este chat
    if (!user?.id) {
      console.error('Usuario no autenticado');
      navigate(-1);
      return;
    }

    // Si el usuario es alumno, solo puede acceder a su propio chat
    if (user?.role === 'alumno' && user?.rut !== alumnoRut) {
      console.error('❌ Acceso denegado: Alumno intentando acceder a chat de otro alumno');
      console.error('   RUT del usuario:', user?.rut);
      console.error('   RUT solicitado:', alumnoRut);
      navigate(-1);
      return;
    }

    // Si el usuario es admin, puede acceder a cualquier chat
    // Si el usuario es profesor/jefe de carrera, puede acceder a chats de alumnos en sus ramos

    const cargarDatos = async () => {
      try {
        // Obtener datos del alumno y profesor
        let alumnoEncontrado = null;
        let ramoNombreEncontrado = '';
        let evaluacionNombre = '';
        let profesorId = null;
        let rutProfesor = null;
        let email = '';
        let profesorNombre = '';
        let profesorEmail = '';

        // Si es alumno, cargar primero los datos del ramo para obtener el profesor
        if (user?.role === 'alumno') {
          try {
            const misRamos = await getMisRamos();
            const ramoActual = misRamos?.find(r => parseInt(r.codigo) === codigoRamo || r.codigo === codigoRamo);
            if (ramoActual) {
              profesorId = ramoActual?.profesor?.id;
              rutProfesor = ramoActual?.rutProfesor;
              ramoNombreEncontrado = ramoActual?.nombre || `Ramo ${codigoRamo}`;
              console.log('Ramo encontrado en mis ramos:', ramoActual.nombre, 'Código:', ramoActual.codigo, 'Profesor ID:', profesorId);
            } else {
              console.warn('Ramo no encontrado en mis ramos con código:', codigoRamo);
            }
          } catch (err) {
            console.warn('Error cargando mis ramos:', err);
          }

          // Cargar datos del profesor por RUT
          if (rutProfesor) {
            try {
              const profesor = await getProfesorByRut(rutProfesor);
              if (profesor) {
                profesorNombre = [profesor.user.nombres, profesor.user.apellidoPaterno, profesor.user.apellidoMaterno]
                  .filter(Boolean)
                  .join(' ');
                profesorEmail = profesor.user.email || '';
                profesorId = profesor.id || profesorId;
              }
            } catch (err) {
              console.warn('Error al obtener datos del profesor por RUT:', err);
              // Fallback a getProfesorById si tenemos el ID
              if (profesorId) {
                try {
                  const profesor = await getProfesorById(profesorId);
                  if (profesor) {
                    profesorNombre = [profesor.user.nombres, profesor.user.apellidoPaterno, profesor.user.apellidoMaterno]
                      .filter(Boolean)
                      .join(' ');
                    profesorEmail = profesor.user.email || '';
                  }
                } catch (err2) {
                  console.warn('Error al obtener datos del profesor por ID:', err2);
                }
              }
            }
          }

          // Obtener email del alumno logueado
          email = user?.email || '';
        } else {
          // Si es profesor/jefe de carrera, obtener email del alumno
          try {
            const usuariosLista = await getAllAlumnos();
            const usuarioAlumno = usuariosLista?.find(u => u.user?.rut === alumnoRut);
            email = usuarioAlumno?.user?.email || '';
          } catch (err) {
            console.warn('Error obteniendo email del alumno:', err);
          }
        }

        // Obtener datos del alumno por RUT en cualquier sección (solo para profesores)
        if (user?.role !== 'alumno') {
          try {
            // Intentar obtener la sección y alumno
            const secciones = await Promise.all(
              [1, 2, 3, 4, 5].map(secNum => getAlumnosBySeccion(codigoRamo, secNum).catch(() => []))
            );
            
            for (const alumnos of secciones) {
              const alumno = alumnos?.find(a => a.rut === alumnoRut);
              if (alumno) {
                alumnoEncontrado = alumno;
                console.log('Alumno encontrado:', alumno.nombres);
                break;
              }
            }
          } catch (err) {
            console.warn('Error buscando alumno en secciones:', err);
          }
        }

        // CARGAR DATOS DEL RAMO - PARA TODOS (alumno y profesor)
        // Esto es importante para obtener datos del profesor
        if (!rutProfesor) {
          try {
            console.log('📡 Cargando ramo con código:', codigoRamo);
            const ramo = await getRamosByCodigo(codigoRamo);
            console.log('✓ Ramo obtenido:', ramo);
            if (ramo) {
              ramoNombreEncontrado = ramo.nombre || `Ramo ${codigoRamo}`;
              // El profesor_id viene en la entidad Ramo
              profesorId = ramo.profesor_id || ramo.profesor?.id;
              console.log('✓ Profesor ID del ramo:', profesorId);
            }
          } catch (err) {
            console.warn('❌ Error obteniendo ramo:', err);
          }
        }

        // CARGAR TODOS LOS PROFESORES Y BUSCAR EL DEL RAMO
        if (!profesorNombre && profesorId) {
          try {
            console.log('📡 Cargando lista de profesores y jefes de carrera...');
            const profesoresList = await getAllProfesores();
            console.log('✓ Profesores cargados:', profesoresList);
            
            // Buscar el profesor del ramo en la lista
            const profesorDelRamo = profesoresList?.find(p => p.id === profesorId);
            console.log('✓ Profesor del ramo encontrado:', profesorDelRamo);
            
            if (profesorDelRamo) {
              profesorNombre = [profesorDelRamo.user?.nombres, profesorDelRamo.user?.apellidoPaterno, profesorDelRamo.user?.apellidoMaterno]
                .filter(Boolean)
                .join(' ');
              profesorEmail = profesorDelRamo.user?.email || '';
              rutProfesor = profesorDelRamo.user?.rut || '';
              console.log('✓ Datos profesor asignados:', { profesorNombre, profesorEmail, rutProfesor });
            } else {
              console.warn('⚠️ Profesor con ID', profesorId, 'no encontrado en la lista');
            }
          } catch (err) {
            console.error('❌ Error cargando profesores:', err);
          }
        }

        // Cargar información de la evaluación
        try {
          if (evalId) {
            const evaluacion = await getEvaluacionById(codigoRamo, evalId);
            evaluacionNombre = evaluacion?.titulo || evaluacion?.nombre || 'Evaluación';
            if (evaluacion?.ramo && !ramoNombreEncontrado) {
              ramoNombreEncontrado = evaluacion.ramo.nombre || ramoNombreEncontrado;
            }
          } else if (evalIntegradoraId) {
            const evaluacionIntegradora = await getEvaluacionIntegradora(codigoRamo);
            evaluacionNombre = evaluacionIntegradora?.nombre || evaluacionIntegradora?.titulo || 'Evaluación Integradora';
            if (evaluacionIntegradora?.ramo && !ramoNombreEncontrado) {
              ramoNombreEncontrado = evaluacionIntegradora.ramo.nombre || ramoNombreEncontrado;
            }
          }
        } catch (err) {
          console.warn('Error al obtener información de la evaluación:', err);
        }

        // Cargar datos del profesor - ASEGURAR QUE SIEMPRE SE EJECUTE
        console.log('=== ANTES DE CARGAR PROFESOR ===');
        console.log('rutProfesor:', rutProfesor);
        console.log('profesorId:', profesorId);
        console.log('profesorNombre:', profesorNombre);
        console.log('profesorEmail:', profesorEmail);

        // Si aún no tenemos nombre de profesor, cargar datos
        if ((!profesorNombre || profesorNombre === '') && (rutProfesor || profesorId)) {
          console.log('✓ Condición cumplida - Cargando profesor');
          
          if (rutProfesor) {
            try {
              console.log('📡 Intentando GET: /profesores/rut/' + rutProfesor);
              const profesor = await getProfesorByRut(rutProfesor);
              console.log('✓ Profesor obtenido por RUT:', profesor);
              if (profesor) {
                profesorNombre = [profesor.user.nombres, profesor.user.apellidoPaterno, profesor.user.apellidoMaterno]
                  .filter(Boolean)
                  .join(' ');
                profesorEmail = profesor.user.email || '';
                console.log('✓ Datos profesor asignados:', { profesorNombre, profesorEmail });
              }
            } catch (err) {
              console.error('❌ Error GET /profesores/rut/' + rutProfesor + ':', err);
              // Fallback a ID
              if (profesorId) {
                try {
                  console.log('📡 Fallback: Intentando GET: /profesores/' + profesorId);
                  const profesor = await getProfesorById(profesorId);
                  console.log('✓ Profesor obtenido por ID:', profesor);
                  if (profesor) {
                    profesorNombre = [profesor.user.nombres, profesor.user.apellidoPaterno, profesor.user.apellidoMaterno]
                      .filter(Boolean)
                      .join(' ');
                    profesorEmail = profesor.user.email || '';
                    rutProfesor = profesor.user.rut || '';
                    console.log('✓ Datos profesor asignados desde ID:', { profesorNombre, profesorEmail, rutProfesor });
                  }
                } catch (err2) {
                  console.error('❌ Error GET /profesores/' + profesorId + ':', err2);
                }
              }
            }
          } else if (profesorId) {
            try {
              console.log('📡 Intentando GET: /profesores/' + profesorId);
              const profesor = await getProfesorById(profesorId);
              console.log('✓ Profesor obtenido:', profesor);
              if (profesor) {
                profesorNombre = [profesor.user.nombres, profesor.user.apellidoPaterno, profesor.user.apellidoMaterno]
                  .filter(Boolean)
                  .join(' ');
                profesorEmail = profesor.user.email || '';
                rutProfesor = profesor.user.rut || '';
                console.log('✓ Datos profesor asignados:', { profesorNombre, profesorEmail, rutProfesor });
              }
            } catch (err) {
              console.error('❌ Error GET /profesores/' + profesorId + ':', err);
            }
          } else {
            console.warn('⚠️ No hay rutProfesor ni profesorId para cargar');
          }
        } else {
          console.log('⚠️ Condición no cumplida:');
          console.log('  - profesorNombre vacío?:', !profesorNombre || profesorNombre === '');
          console.log('  - tiene rutProfesor o profesorId?:', rutProfesor || profesorId);
        }

        const nombreCompleto = alumnoEncontrado
          ? [alumnoEncontrado.nombres, alumnoEncontrado.apellidoPaterno, alumnoEncontrado.apellidoMaterno]
              .filter(Boolean)
              .join(' ')
          : 'Alumno';

        console.log('FINAL - Datos antes de setProfesorInfo:', { profesorNombre, profesorEmail, rutProfesor });

        setAlumnoInfo({
          nombre: nombreCompleto,
          email: email || '',
        });

        setProfesorInfo({
          nombre: profesorNombre || 'Profesor',
          email: profesorEmail || '',
          rut: rutProfesor || '',
        });

        setRamoNombre(ramoNombreEncontrado || `Ramo ${codigoRamo}`);
        
        setEvaluacionInfo({
          id: evalId || evalIntegradoraId,
          nombre: evaluacionNombre || 'Evaluación',
        });
      } catch (err) {
        console.error('Error cargando datos:', err);
        setRamoNombre(`Ramo ${codigoRamo}`);
      }
    };

    cargarDatos();
  }, [codigoRamo, alumnoRut, evalId, evalIntegradoraId, navigate]);

  if (!codigoRamo || !alumnoRut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">Parámetros inválidos para abrir el chat de retroalimentación</p>
          <p className="text-sm text-gray-500 mb-6">
            Requeridos: ramo ({codigoRamo ? '✓' : '✗'}), alumno ({alumnoRut ? '✓' : '✗'})
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Chat Component - Full Screen */}
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
          <RetroalimentacionChat
            ramoId={codigoRamo}
            ramoNombre={ramoNombre}
            alumnoRut={alumnoRut}
            profesorRut={profesorInfo.rut}
            evaluacionId={evalId}
            evaluacionIntegradoraId={evalIntegradoraId}
            alumnoNombre={alumnoInfo.nombre}
            alumnoEmail={alumnoInfo.email}
            profesorNombre={profesorInfo.nombre}
            profesorEmail={profesorInfo.email}
            isProfesor={user?.role === 'profesor' || user?.role === 'jefecarrera'}
            evaluacion={evaluacionInfo}
          />
        </div>
      </div>
    </div>
  );
}
