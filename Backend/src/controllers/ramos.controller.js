import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import { AppDataSource } from "../config/configDb.js";
import { Ramos } from "../entities/ramos.entity.js";
import { Seccion } from "../entities/seccion.entity.js";
import { Alumno } from "../entities/alumno.entity.js";
import { Profesor } from "../entities/profesor.entity.js";
import { User } from "../entities/user.entity.js";

export async function crearRamo(req, res) {
    try {
        const { codigo, nombre, semestre } = req.body;
        const ramoRepository = AppDataSource.getRepository(Ramos);
        
        // Verificar si ya existe un ramo con el mismo código
        const ramoExistente = await ramoRepository.findOne({ where: { codigo } });
        if (ramoExistente) {
            return handleErrorClient(res, 400, "Ya existe un ramo con este código");
        }

        // Crear el nuevo ramo
        const nuevoRamo = ramoRepository.create({ codigo, nombre, semestre });
        const ramoGuardado = await ramoRepository.save(nuevoRamo);

        handleSuccess(res, 201, "Ramo creado exitosamente", { ramo: ramoGuardado });
    } catch (error) {
        handleErrorServer(res, 500, "Error al crear el ramo", error.message);
    }
}

export async function crearSeccion(req, res) {
    try {
        const { ramoId } = req.params;
        const { numero } = req.body;
        
        const ramoRepository = AppDataSource.getRepository(Ramos);
        const seccionRepository = AppDataSource.getRepository(Seccion);

        // Verificar si existe el ramo
        const ramo = await ramoRepository.findOne({ where: { id: parseInt(ramoId) } });
        if (!ramo) {
            return handleErrorClient(res, 404, "Ramo no encontrado");
        }

        // Verificar si ya existe una sección con el mismo número para este ramo
        const seccionExistente = await seccionRepository
            .createQueryBuilder("seccion")
            .where("seccion.ramo = :ramoId AND seccion.numero = :numero", { ramoId, numero })
            .getOne();

        if (seccionExistente) {
            return handleErrorClient(res, 400, "Ya existe una sección con este número para este ramo");
        }

        // Crear la nueva sección
        const nuevaSeccion = seccionRepository.create({ 
            numero,
            ramo: ramo
        });
        const seccionGuardada = await seccionRepository.save(nuevaSeccion);

        handleSuccess(res, 201, "Sección creada exitosamente", { seccion: seccionGuardada });
    } catch (error) {
        handleErrorServer(res, 500, "Error al crear la sección", error.message);
    }
}

export async function inscribirAlumno(req, res) {
    try {
        const profesorId = req.user.sub; // ID del profesor desde el token JWT
        const { rutAlumno, codigoRamo } = req.body;

        if (!rutAlumno || !codigoRamo) {
            return handleErrorClient(res, 400, "Se requiere el RUT del alumno y el código del ramo");
        }

        const ramoRepository = AppDataSource.getRepository(Ramos);
        const alumnoRepository = AppDataSource.getRepository(Alumno);
        const userRepository = AppDataSource.getRepository(User);
        const profesorRepository = AppDataSource.getRepository(Profesor);

        // Buscar al alumno por su RUT
        const userAlumno = await userRepository.findOne({
            where: { rut: rutAlumno, role: "alumno" }
        });

        if (!userAlumno) {
            return handleErrorClient(res, 404, "No se encontró un alumno con el RUT especificado");
        }

        const alumno = await alumnoRepository.findOne({
            where: { id: userAlumno.id },
            relations: ["user"]
        });

        if (!alumno) {
            return handleErrorClient(res, 404, "No se encontró el perfil de alumno");
        }

        // Verificar que el ramo exista y pertenezca al profesor
        const ramo = await ramoRepository.findOne({
            where: { codigo: codigoRamo },
            relations: ["profesor", "secciones", "secciones.alumnos"]
        });

        if (!ramo) {
            return handleErrorClient(res, 404, "Ramo no encontrado");
        }

        if (ramo.profesor.id !== profesorId) {
            return handleErrorClient(res, 403, "No tienes permiso para modificar este ramo");
        }

        // Si el ramo no tiene secciones, crear una por defecto
        if (!ramo.secciones || ramo.secciones.length === 0) {
            const seccionRepository = AppDataSource.getRepository(Seccion);
            const nuevaSeccion = seccionRepository.create({
                numero: 1,
                ramo: ramo
            });
            await seccionRepository.save(nuevaSeccion);
            ramo.secciones = [nuevaSeccion];
        }

        // Añadir alumno a la primera sección del ramo
        const seccion = ramo.secciones[0];
        if (!seccion.alumnos) {
            seccion.alumnos = [];
        }

        // Verificar si el alumno ya está inscrito
        if (seccion.alumnos.some(a => a.id === alumno.id)) {
            return handleErrorClient(res, 400, "El alumno ya está inscrito en este ramo");
        }

        // Inscribir alumno
        seccion.alumnos.push(alumno);
        await AppDataSource.getRepository(Seccion).save(seccion);

        handleSuccess(res, 200, "Alumno inscrito exitosamente", {
            ramo: ramo.nombre,
            alumno: alumno.user.nombres + " " + alumno.user.apellidoPaterno
        });

    } catch (error) {
        handleErrorServer(res, 500, "Error al inscribir alumno", error.message);
    }
}