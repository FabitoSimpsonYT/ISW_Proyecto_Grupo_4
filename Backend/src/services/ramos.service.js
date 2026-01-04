// Buscar alumnos por nombre, apellido o rut
import { Like } from "typeorm";

export async function buscarAlumnosPorQuery(query) {
  const alumnoRepository = AppDataSource.getRepository(Alumno);
  // Buscar en los campos del usuario relacionado, solo usuarios con rol 'alumno'
  const alumnos = await alumnoRepository.find({
    relations: ["user"],
    where: [
      { user: { nombres: Like(`%${query}%`), role: "alumno" } },
      { user: { apellidoPaterno: Like(`%${query}%`), role: "alumno" } },
      { user: { apellidoMaterno: Like(`%${query}%`), role: "alumno" } },
      { user: { rut: Like(`%${query}%`), role: "alumno" } },
    ],
    take: 20 // Limitar resultados
  });
  // Devolver solo los datos necesarios
  return alumnos.map(a => ({
    id: a.id,
    nombres: a.user.nombres,
    apellidoPaterno: a.user.apellidoPaterno,
    apellidoMaterno: a.user.apellidoMaterno,
    rut: a.user.rut,
    email: a.user.email
  }));
}
import { AppDataSource } from "../config/configDB.js";
import { BadRequestError, NotFoundError } from "../Handlers/responseHandlers.js";
import { Ramos } from "../entities/ramos.entity.js";
import { Profesor } from "../entities/profesor.entity.js";
import { User } from "../entities/user.entity.js";
import { Alumno } from "../entities/alumno.entity.js";
import { Seccion } from "../entities/seccion.entity.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { Pauta } from "../entities/pauta.entity.js";
import { PautaEvaluada } from "../entities/pautaEvaluada.entity.js";
import { EvaluacionIntegradora } from "../entities/evaluacionIntegradora.entity.js";
import { PautaEvaluadaIntegradora } from "../entities/pautaEvaluadaIntegradora.entity.js";

const ramosRepository = AppDataSource.getRepository(Ramos);
const profesorRepository = AppDataSource.getRepository(Profesor);

export async function createRamo(ramoData) {
  // Validar que el código no esté vacío o nulo
  if (!ramoData.codigo || ramoData.codigo.trim() === '') {
    console.error('❌ ERROR: codigo vacío en createRamo:', ramoData);
    throw new BadRequestError("El código del ramo es obligatorio y no puede estar vacío");
  }

  console.log('✓ Creando ramo con datos:', {
    nombre: ramoData.nombre,
    codigo: ramoData.codigo,
    anio: ramoData.anio,
    periodo: ramoData.periodo,
    rutProfesor: ramoData.rutProfesor
  });

  const existingRamo = await ramosRepository.findOne({
    where: { codigo: ramoData.codigo }
  });

  if (existingRamo) {
    throw new BadRequestError("El código del ramo ya está registrado");
  }

  if (ramoData.rutProfesor) {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: [
        { rut: ramoData.rutProfesor, role: "profesor" },
        { rut: ramoData.rutProfesor, role: "jefecarrera" }
      ]
    });

    if (!user) {
      throw new BadRequestError("No se encontró un profesor/jefe de carrera con el RUT especificado");
    }

    const profesor = await profesorRepository.findOne({
      where: { id: user.id }
    });

    if (!profesor) {
      throw new BadRequestError("No se encontró el perfil del profesor/jefe de carrera");
    }

    const newRamo = ramosRepository.create({
      nombre: ramoData.nombre,
      codigo: ramoData.codigo,
      profesor: profesor
    });
    return await ramosRepository.save(newRamo);
  }

  const newRamo = ramosRepository.create({
    nombre: ramoData.nombre,
    codigo: ramoData.codigo,
    profesor: null
  });

  return await ramosRepository.save(newRamo);
}

export async function getAllRamos() {
  return await ramosRepository
    .createQueryBuilder('ramo')
    .leftJoinAndSelect('ramo.profesor', 'profesor')
    .leftJoinAndSelect('profesor.user', 'user')
    .leftJoinAndSelect('ramo.secciones', 'secciones')
    .getMany();
}

export async function getRamoById(id) {
  const ramo = await ramosRepository.findOne({
    where: { id },
    relations: ["profesor", "profesor.user", "secciones", "secciones.alumnos"]
  });

  if (!ramo) {
    throw new NotFoundError("Ramo no encontrado");
  }

  return ramo;
}

export async function getRamoByCodigo(codigo) {
  const ramo = await ramosRepository.findOne({
    where: { codigo },
    relations: ["profesor", "profesor.user", "secciones", "secciones.alumnos"]
  });

  if (!ramo) {
    throw new NotFoundError("Ramo no encontrado");
  }

  return ramo;
}

export async function updateRamo(codigo, ramoData) {
  const ramo = await ramosRepository.findOne({
    where: { codigo }
  });

  if (!ramo) {
    throw new NotFoundError("Ramo no encontrado");
  }

  if (ramoData.codigo && ramoData.codigo !== codigo) {
    const existingRamo = await ramosRepository.findOne({
      where: { codigo: ramoData.codigo }
    });

    if (existingRamo) {
      throw new BadRequestError("El código del ramo ya está en uso");
    }
  }

  let profesor = undefined;
  if (ramoData.rutProfesor) {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: [
        { rut: ramoData.rutProfesor, role: "profesor" },
        { rut: ramoData.rutProfesor, role: "jefecarrera" }
      ]
    });

    if (!user) {
      throw new BadRequestError("No se encontró un profesor/jefe de carrera con el RUT especificado");
    }

    profesor = await profesorRepository.findOne({
      where: { id: user.id }
    });

    if (!profesor) {
      throw new BadRequestError("No se encontró el perfil del profesor/jefe de carrera");
    }
  }

  const updateData = {};
  if (ramoData.nombre) updateData.nombre = ramoData.nombre;
  if (ramoData.codigo) updateData.codigo = ramoData.codigo;
  if (profesor) updateData.profesor = profesor;

  await ramosRepository.update({ codigo }, updateData);

  const updatedRamo = await ramosRepository.findOne({
    where: { codigo: ramoData.codigo || codigo },
    relations: ["profesor", "profesor.user", "secciones"]
  });

  if (updatedRamo.profesor?.user) {
    return {
      codigo: updatedRamo.codigo,
      nombre: updatedRamo.nombre,
      profesor: {
        rut: updatedRamo.profesor.user.rut,
        nombre: updatedRamo.profesor.user.nombre,
        apellido: updatedRamo.profesor.user.apellido
      },
      secciones: updatedRamo.secciones.map(seccion => ({
        numero: seccion.numero
      }))
    };
  }

  return {
    codigo: updatedRamo.codigo,
    nombre: updatedRamo.nombre,
    secciones: updatedRamo.secciones.map(seccion => ({
      numero: seccion.numero
    }))
  };
}

export async function deleteRamo(codigo) {
  try {
    const ramo = await ramosRepository.findOne({ where: { codigo } });
    if (!ramo) throw new NotFoundError("Ramo no encontrado");

    const pautaEvaluadaRepository = AppDataSource.getRepository(PautaEvaluada);
    const pautaRepository = AppDataSource.getRepository(Pauta);
    const evaluacionRepository = AppDataSource.getRepository(Evaluacion);
    const seccionRepository = AppDataSource.getRepository(Seccion);
    const evaluacionIntegradoraRepository = AppDataSource.getRepository(EvaluacionIntegradora);
    const pautaEvaluadaIntegradoraRepository = AppDataSource.getRepository(PautaEvaluadaIntegradora);

    // 1. Eliminar pautas evaluadas relacionadas al ramo
    console.log("Paso 1: Buscando pautas evaluadas del ramo:", codigo);
    const pautasEvaluadas = await pautaEvaluadaRepository.find({ where: { codigoRamo: codigo } });
    if (pautasEvaluadas.length > 0) {
      console.log("Encontradas", pautasEvaluadas.length, "pautas evaluadas. Eliminando...");
      await pautaEvaluadaRepository.remove(pautasEvaluadas);
    } else {
      console.log("No se encontraron pautas evaluadas");
    }

    // 2. Eliminar pautas asociadas a evaluaciones del ramo
    console.log("Paso 2: Buscando evaluaciones del ramo para eliminar sus pautas asociadas");
    const evaluaciones = await evaluacionRepository.find({ where: { codigoRamo: codigo } });
    for (const evaluacion of evaluaciones) {
      if (evaluacion.idPauta) {
        const pauta = await pautaRepository.findOneBy({ id: evaluacion.idPauta });
        if (pauta) {
          console.log("Eliminando pauta", pauta.id, "asociada a evaluación", evaluacion.id);
          await pautaRepository.remove(pauta);
        }
      }
    }

    // 3. Eliminar evaluaciones normales
    if (evaluaciones.length > 0) {
      console.log("Eliminando", evaluaciones.length, "evaluaciones normales");
      await evaluacionRepository.remove(evaluaciones);
    } else {
      console.log("No se encontraron evaluaciones normales");
    }

    // 4. Eliminar evaluación integradora y sus dependencias
    console.log("Paso 4: Buscando evaluación integradora del ramo");
    const evaluacionIntegradora = await evaluacionIntegradoraRepository.findOne({ where: { ramoId: ramo.id } });
    if (evaluacionIntegradora) {
      // Eliminar pautas evaluadas integradora
      const pautasEvalInt = await pautaEvaluadaIntegradoraRepository.find({ where: { evaluacionIntegradoraId: evaluacionIntegradora.id } });
      if (pautasEvalInt.length > 0) {
        console.log("Eliminando", pautasEvalInt.length, "pautas evaluadas integradora");
        await pautaEvaluadaIntegradoraRepository.remove(pautasEvalInt);
      }
      // Eliminar pauta asociada a la integradora
      if (evaluacionIntegradora.idPauta) {
        const pautaInt = await pautaRepository.findOneBy({ id: evaluacionIntegradora.idPauta });
        if (pautaInt) {
          console.log("Eliminando pauta integradora con ID:", pautaInt.id);
          await pautaRepository.remove(pautaInt);
        }
      }
      // Eliminar la evaluación integradora
      console.log("Eliminando evaluación integradora con ID:", evaluacionIntegradora.id);
      await evaluacionIntegradoraRepository.remove(evaluacionIntegradora);
    } else {
      console.log("No se encontró evaluación integradora");
    }

    // 5. Eliminar secciones
    console.log("Paso 5: Buscando secciones del ramo");
    const secciones = await seccionRepository.find({ where: { ramo: { id: ramo.id } } });
    if (secciones.length > 0) {
      console.log("Eliminando", secciones.length, "secciones");
      await seccionRepository.remove(secciones);
    } else {
      console.log("No se encontraron secciones");
    }

    // 6. Eliminar el ramo
    console.log("Paso 6: Eliminando ramo con código:", codigo);
    await ramosRepository.remove(ramo);
    console.log("✓ Ramo eliminado correctamente");

    return { message: "Ramo eliminado correctamente" };
  } catch (error) {
    console.error("Error al eliminar ramo:", error);
    throw error;
  }
}

export async function getRamosByUser(userId, role) {
  if (role === "alumno") {
    const userRepository = AppDataSource.getRepository(User);
    const alumnoRepository = AppDataSource.getRepository(Alumno);
    
    const user = await userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    const alumno = await alumnoRepository.findOne({
      where: { id: userId },
      relations: [
        "secciones",
        "secciones.ramo",
        "secciones.ramo.profesor",
        "secciones.ramo.profesor.user"
      ]
    });

    if (!alumno) {
      throw new NotFoundError("Alumno no encontrado");
    }

    const ramosInscritos = alumno.secciones.map(seccion => {
      const { ramo } = seccion;
      const profesor = ramo.profesor?.user;
      
      return {
        codigo: ramo.codigo,
        anio: ramo.anio,
        periodo: ramo.periodo,
        nombre: ramo.nombre,
        seccion: {
          numero: seccion.numero
        },
        profesor: profesor ? {
          rut: profesor.rut,
          nombre: profesor.nombre,
          apellido: profesor.apellido
        } : null,
        alumno: {
          rut: user.rut
        }
      };
    });

    return ramosInscritos;

  } else if (role === "profesor" || role === "jefecarrera") {
    const userRepository = AppDataSource.getRepository(User);
    const profesorRepository = AppDataSource.getRepository(Profesor);
    
    const user = await userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    const profesor = await profesorRepository.findOne({
      where: { id: userId },
      relations: [
        "ramos",
        "ramos.secciones",
        "ramos.secciones.alumnos",
        "ramos.secciones.alumnos.user"
      ]
    });

    if (!profesor) {
      throw new NotFoundError("Profesor no encontrado");
    }

    const ramosDictados = profesor.ramos.map(ramo => ({
      codigo: ramo.codigo,
      anio: ramo.anio,
      periodo: ramo.periodo,
      nombre: ramo.nombre,
      profesor: {
        rut: user.rut,
        nombre: user.nombres,
        apellido: user.apellidoPaterno
      },
      secciones: ramo.secciones.map(seccion => ({
        numero: seccion.numero,
        alumnos: seccion.alumnos.map(alumno => ({
          rut: alumno.user.rut,
          nombre: alumno.user.nombres,
          apellido: alumno.user.apellidoPaterno
        }))
      }))
    }));

    return ramosDictados;
  }

  throw new BadRequestError("Rol no válido para esta operación");
}

export async function inscribirAlumnoEnRamo(rutAlumno, seccionId, codigoRamo, userId, userRole) {
  const userRepository = AppDataSource.getRepository(User);
  const alumnoRepository = AppDataSource.getRepository(Alumno);
  const seccionRepository = AppDataSource.getRepository(Seccion);

  // Primero: Validar que el ramo existe
  const ramo = await getRamoByCodigo(codigoRamo);

  // Segundo: Obtener y validar la sección
  const seccion = await seccionRepository.findOne({
    where: { id: seccionId, ramo: { id: ramo.id } },
    relations: ["ramo", "alumnos"]
  });

  if (!seccion) {
    throw new NotFoundError("Sección no encontrada para el ramo especificado");
  }

  // Validar permisos: si es profesor, debe ser el profesor del ramo
  if (userRole === "profesor") {
    if (ramo.profesor.id !== userId) {
      throw new BadRequestError("No tienes permiso para modificar esta sección");
    }
  }

  // Tercero: Validar que el alumno existe
  const userAlumno = await userRepository.findOne({
    where: { rut: rutAlumno, role: "alumno" }
  });

  if (!userAlumno) {
    throw new BadRequestError("No se encontró un alumno con el RUT especificado");
  }

  const alumno = await alumnoRepository.findOne({
    where: { id: userAlumno.id },
    relations: ["user"]
  });

  if (!alumno) {
    throw new BadRequestError("No se encontró el perfil de alumno");
  }

  // Verificar si el alumno ya está inscrito en otra sección del mismo ramo
  const otrasSeccionesDelRamo = await seccionRepository.find({
    where: { ramo: { id: ramo.id } },
    relations: ["alumnos"]
  });

  for (const seccionOtra of otrasSeccionesDelRamo) {
    if (seccionOtra.id !== seccionId && seccionOtra.alumnos.some(a => a.id === alumno.id)) {
      // Desinscribir del otra sección
      seccionOtra.alumnos = seccionOtra.alumnos.filter(a => a.id !== alumno.id);
      await seccionRepository.save(seccionOtra);
    }
  }

  // Validar que el alumno no esté ya inscrito en la sección actual
  if (seccion.alumnos && seccion.alumnos.some(a => a.id === alumno.id)) {
    return {
      ramo: ramo.nombre,
      seccion: seccion.numero,
      alumno: alumno.user.nombres + " " + alumno.user.apellidoPaterno + " " + alumno.user.apellidoMaterno,
      mensaje: "El alumno ya estaba inscrito en esta sección"
    };
  }

  // Inscribir alumno en la nueva sección
  if (!seccion.alumnos) {
    seccion.alumnos = [];
  }
  seccion.alumnos.push(alumno);
  await seccionRepository.save(seccion);

  return {
    ramo: ramo.nombre,
    seccion: seccion.numero,
    alumno: alumno.user.nombres + " " + alumno.user.apellidoPaterno + " " + alumno.user.apellidoMaterno
  };
}

export async function createSeccion(seccionData) {
  const seccionRepository = AppDataSource.getRepository(Seccion);
  const userRepository = AppDataSource.getRepository(User);
  const alumnoRepository = AppDataSource.getRepository(Alumno);

  // Validar que el ramo existe
  const ramo = await getRamoByCodigo(seccionData.codigoRamo);

  // Validar que no existe una sección con ese número en el ramo
  const existingSeccion = await seccionRepository.findOne({
    where: { numero: seccionData.numero, ramo: { codigo: seccionData.codigoRamo } },
    relations: ["ramo"]
  });

  if (existingSeccion) {
    throw new BadRequestError(`Ya existe una sección ${seccionData.numero} para el ramo ${seccionData.codigoRamo}`);
  }

  // Crear la sección
  const newSeccion = seccionRepository.create({
    numero: seccionData.numero,
    ramo: ramo,
    alumnos: []
  });

  // Si se proporcionan RUTs de alumnos, inscribirse
  if (seccionData.alumnosRut && seccionData.alumnosRut.length > 0) {
    const alumnos = [];

    for (const rut of seccionData.alumnosRut) {
      const user = await userRepository.findOne({
        where: { rut, role: "alumno" }
      });

      if (!user) {
        throw new BadRequestError(`No se encontró un alumno con el RUT: ${rut}`);
      }

      const alumno = await alumnoRepository.findOne({
        where: { id: user.id }
      });

      if (!alumno) {
        throw new BadRequestError(`No se encontró el perfil de alumno para el RUT: ${rut}`);
      }

      alumnos.push(alumno);
    }

    newSeccion.alumnos = alumnos;
  }

  return await seccionRepository.save(newSeccion);
}

export async function getSeccionesByRamo(codigoRamo) {
  const seccionRepository = AppDataSource.getRepository(Seccion);
  
  const secciones = await seccionRepository.find({
    where: { ramo: { codigo: codigoRamo } },
    relations: ["ramo", "alumnos", "alumnos.user"]
  });
  // Si no hay secciones, devolver arreglo vacío (frontend maneja el mensaje)
  if (!secciones || secciones.length === 0) {
    return [];
  }

  return secciones.map(seccion => ({
    id: seccion.id,
    numero: seccion.numero,
    ramo: {
      codigo: seccion.ramo.codigo,
      nombre: seccion.ramo.nombre
    },
    alumnos: seccion.alumnos.map(alumno => ({
      id: alumno.id,
      rut: alumno.user.rut,
      nombres: alumno.user.nombres,
      apellidoPaterno: alumno.user.apellidoPaterno
    }))
  }));
}

export async function deleteSeccion(seccionId, codigoRamo) {
  const seccionRepository = AppDataSource.getRepository(Seccion);

  const seccion = await seccionRepository.findOne({
    where: { id: seccionId, ramo: { codigo: codigoRamo } },
    relations: ["ramo", "alumnos"]
  });

  if (!seccion) {
    throw new NotFoundError(`No se encontró la sección con ID ${seccionId} para el ramo ${codigoRamo}`);
  }

  // Buscar otras secciones del mismo ramo para reasignar alumnos
  const otrasSecciones = await seccionRepository.find({
    where: { ramo: { id: seccion.ramo.id } },
    relations: ["alumnos"]
  });

  const destinos = otrasSecciones.filter(s => s.id !== seccion.id);

  if ((seccion.alumnos?.length || 0) > 0 && destinos.length === 0) {
    throw new BadRequestError("No se puede eliminar la sección porque no hay otra sección para reasignar a los alumnos");
  }

  // Repartir alumnos de forma aleatoria entre las secciones disponibles
  if (seccion.alumnos && seccion.alumnos.length > 0 && destinos.length > 0) {
    for (const alumno of seccion.alumnos) {
      const destino = destinos[Math.floor(Math.random() * destinos.length)];
      destino.alumnos = destino.alumnos || [];
      const yaInscrito = destino.alumnos.some(a => a.id === alumno.id);
      if (!yaInscrito) {
        destino.alumnos.push(alumno);
      }
    }
    await Promise.all(destinos.map(sec => seccionRepository.save(sec)));
  }

  await seccionRepository.remove(seccion);
  const reasignados = seccion.alumnos?.length && destinos.length ? " y alumnos reasignados" : "";
  return { message: `Sección eliminada exitosamente${reasignados}` };
}

