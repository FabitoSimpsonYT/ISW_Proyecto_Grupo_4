import { AppDataSource } from "../config/configDB.js";
import { Retroalimentacion } from "../entities/retroalimentacion.entity.js";
import { crearMensajeRetroalimentacion, marcarMensajesComoVistos } from "../services/retroalimentacion.service.js";
import { notificarAlumnos } from "../services/notificacionuno.service.js";
import jwt from 'jsonwebtoken';

const retroalimentacionRepo = AppDataSource.getRepository(Retroalimentacion);
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_isw_2024';

class RetroalimentacionHandler {
  constructor() {
    // Estructura: { ramoId: { alumnoRut: { profesorSocket, alumnoSocket } } }
    this.salas = new Map();
    // Estructura: { userId: socket }
    this.usuariosConectados = new Map();
  }

  initialize(io) {
    io.on("connection", (socket) => {
      console.log(`[Socket.IO] Usuario conectado: ${socket.id}`);

      // Autenticar y unirse a sala de retroalimentación
      socket.on("join-retroalimentacion", async (data) => {
        console.log('📥 [Backend Socket] Recibido join-retroalimentacion:', {
          socketId: socket.id,
          dataKeys: Object.keys(data),
        });
        
        try {
          const { token, userId: userIdFromFrontend, ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId } = data;

          // alumnoRut puede ser null/undefined para profesores
          if (!token || !ramoId) {
            console.warn('⚠️ [Backend Socket] Parámetros faltantes. Requeridos: token, ramoId');
            socket.emit("error", { message: "Faltan parámetros requeridos: token y ramoId" });
            return;
          }

          // Decodificar token JWT
          let user;
          try {
            user = jwt.verify(token, JWT_SECRET);
            console.log('✓ [Backend Socket] Token verificado para usuario:', user.id, user.role, 'RUT:', user.rut);
            
            // Usar el userId del frontend si está disponible (es más confiable)
            if (userIdFromFrontend) {
              console.log(`✓ [Backend Socket] Usando userId del frontend: ${userIdFromFrontend}`);
              user.id = userIdFromFrontend;
            }
          } catch (err) {
            console.error('❌ [Backend Socket] Error verificando token:', err.message);
            socket.emit("error", { message: "Token inválido o expirado" });
            return;
          }

          if (!user.id) {
            console.warn('⚠️ [Backend Socket] Usuario sin ID en token');
            socket.emit("error", { message: "Usuario no autenticado" });
            return;
          }

          const sala = `${user.role}-${user.id}`;
          socket.join(sala);
          console.log(`✓ [Backend Socket] Usuario ${user.id} se unió a sala: ${sala}`);

          // Guardar info del usuario
          this.usuariosConectados.set(socket.id, {
            userId: user.id,
            role: user.role,
            ramoId,
            alumnoRut, // Puede ser null para profesores
            evaluacionId,
            evaluacionIntegradoraId,
          });

          console.log(`✓ [Backend Socket] Usuarios conectados total:`, this.usuariosConectados.size);

          // Obtener RUT del usuario conectado
          const { User } = await import("../entities/user.entity.js");
          const userRepo = AppDataSource.getRepository(User);
          const usuarioConectado = await userRepo.findOne({ where: { id: user.id } });
          const rutUsuarioConectado = usuarioConectado?.rut;

          // Guardar RUT en la info del usuario
          const usuarioInfoActual = this.usuariosConectados.get(socket.id);
          if (usuarioInfoActual) {
            usuarioInfoActual.rut = rutUsuarioConectado;
          }

          // Enviar mensajes previos
          // Obtener el ramo primero para obtener su ID real (si ramoId es código)
          const { Ramos } = await import("../entities/ramos.entity.js");
          const ramoRepo = AppDataSource.getRepository(Ramos);
          
          const ramo = await ramoRepo
            .createQueryBuilder("r")
            .where("r.codigo = :codigo", { codigo: ramoId })
            .orWhere("r.id = :id", { id: parseInt(ramoId, 10) })
            .getOne();

          // Guardar el ramoIdNum en usuariosConectados para usar después
          if (usuarioInfoActual && ramo) {
            usuarioInfoActual.ramoIdNum = ramo.id;
          }

          if (!ramo) {
            console.warn(`⚠️ [Backend Socket] No se encontró ramo con código/ID ${ramoId}`);
            socket.emit("mensajes-previos", { mensajes: [] });
          } else {
            // Obtener mensajes filtrados por rutEmisor y rutReceptor
            const profesorRut = user.role === "profesor" || user.role === "jefecarrera" ? rutUsuarioConectado : null;
            
            const where = {
              ramoId: ramo.id,
              alumnoRut,
              ...(evaluacionId && { evaluacionId: parseInt(evaluacionId) }),
              ...(evaluacionIntegradoraId && { evaluacionIntegradoraId: parseInt(evaluacionIntegradoraId) }),
            };

            let mensajes;
            if (profesorRut) {
              // Profesor: obtener solo mensajes de este chat
              mensajes = await retroalimentacionRepo
                .createQueryBuilder("r")
                .where(
                  "(r.rutEmisor = :alumnoRut AND r.rutReceptor = :profesorRut) OR (r.rutEmisor = :profesorRut AND r.rutReceptor = :alumnoRut)",
                  { alumnoRut, profesorRut }
                )
                .andWhere("r.ramoId = :ramoId", { ramoId: ramo.id })
                .andWhere(evaluacionId ? "r.evaluacionId = :evaluacionId" : "r.evaluacionIntegradoraId = :evaluacionIntegradoraId", {
                  evaluacionId: evaluacionId ? parseInt(evaluacionId) : null,
                  evaluacionIntegradoraId: evaluacionIntegradoraId ? parseInt(evaluacionIntegradoraId) : null,
                })
                .leftJoinAndSelect("r.profesor", "p")
                .orderBy("r.createdAt", "ASC")
                .getMany();
            } else {
              // Alumno: obtener mensajes de todos los profesores en este ramo
              mensajes = await retroalimentacionRepo.find({
                where,
                relations: ["profesor"],
                order: { createdAt: "ASC" },
              });
            }

            console.log(`✓ [Backend Socket] Cargando ${mensajes.length} mensajes previos para ramo ${ramo.id}`);
            socket.emit("mensajes-previos", { mensajes });
          }

          // Crear sala específica para retroalimentación (usar ramo.id numérico)
          const salaRetroalimentacion = `retroalimentacion-${ramo?.id || ramoId}-${alumnoRut}-${evaluacionId || evaluacionIntegradoraId}`;
          socket.join(salaRetroalimentacion);
          console.log(`✓ [Backend Socket] Usuario ${user.id} se unió a retroalimentación: ${salaRetroalimentacion}`);

          // Notificar que el usuario se conectó a todos en la sala
          console.log(`📤 [Backend Socket] Emitiendo otro-usuario-conectado a sala: ${salaRetroalimentacion}`);
          socket.to(salaRetroalimentacion).emit("otro-usuario-conectado", { 
            userId: user.id, 
            role: user.role 
          });

          console.log(`[Socket.IO] Usuario ${user.id} (${user.role}) se unió a retroalimentación: ${salaRetroalimentacion}`);
        } catch (error) {
          console.error("[Retroalimentación] Error en join:", error);
          socket.emit("error", { message: "Error al unirse a la sala" });
        }
      });

      // Recibir nuevo mensaje
      socket.on("mensaje-retroalimentacion", async (data) => {
        try {
          const { evaluacionId, evaluacionIntegradoraId, alumnoRut, ramoId, codigoRamo, mensaje } = data;
          const usuarioInfo = this.usuariosConectados.get(socket.id);

          if (!usuarioInfo) {
            socket.emit("error", { message: "No autenticado" });
            return;
          }

          const { userId, role } = usuarioInfo;
          console.log(`📨 [Socket] Mensaje recibido. socketId=${socket.id}, userId=${userId}, role=${role}`);

          // Solo profesores/jefes de carrera pueden enviar retroalimentaciones iniciales
          // Los alumnos pueden responder/enviar mensajes
          if (role !== "profesor" && role !== "jefecarrera" && role !== "alumno") {
            console.warn(`❌ [Socket] Usuario ${userId} con rol ${role} intentó enviar mensaje`);
            socket.emit("error", { message: "Rol no autorizado para enviar mensajes" });
            return;
          }

          console.log(`📨 [Socket] ${role} ${userId} enviando mensaje en retroalimentacion`);
          console.log(`📨 [Socket] Parámetros: ramoId=${ramoId} (type: ${typeof ramoId}), alumnoRut=${alumnoRut}`);

          // Determinar profesorId según el rol
          let profesorId = userId;
          let ramoIdNum = ramoId;
          
          // Resolver ramoId a su ID numérico si es código
          if (ramoId && isNaN(parseInt(ramoId, 10)) === false) {
            // ramoId es un número, pero podría ser un código almacenado como string
            // Intentar obtener el ramo
            const { Ramos } = await import("../entities/ramos.entity.js");
            const ramoRepo = AppDataSource.getRepository(Ramos);

            console.log(`✓ [Socket] Buscando ramo por código/ID: ${ramoId}`);

            const ramo = await ramoRepo
              .createQueryBuilder("r")
              .leftJoinAndSelect("r.profesor", "p")
              .where("r.codigo = :codigo", { codigo: ramoId })
              .orWhere("r.id = :id", { id: parseInt(ramoId, 10) })
              .getOne();
            
            if (ramo) {
              ramoIdNum = ramo.id;
              console.log(`✓ [Socket] Ramo encontrado: ${ramo.nombre} (ID: ${ramo.id}, Código: ${ramo.codigo})`);
              
              // Si es profesor, obtener el ID del profesor del ramo si existe
              if (role === "profesor" && ramo.profesor && ramo.profesor.id) {
                // Verificar que el usuario sea el profesor del ramo
                if (ramo.profesor.id !== userId) {
                  console.warn(`⚠️ [Socket] Profesor ${userId} no es el profesor del ramo ${ramoIdNum}`);
                  socket.emit("error", { message: "No eres el profesor de este ramo" });
                  return;
                }
              }
            } else if (role === "alumno") {
              console.error(`❌ No se encontró ramo con código/ID ${ramoId}`);
              socket.emit("error", { message: `No se encontró el ramo ${ramoId}` });
              return;
            }
          }
          
          if (role === "alumno") {
            // Si es alumno, obtener el profesor del ramo
            const { Ramos } = await import("../entities/ramos.entity.js");
            const ramoRepo = AppDataSource.getRepository(Ramos);

            // Buscar ramo por código (ramoId puede ser código del ramo como "620519")
            console.log(`✓ [Socket] Buscando ramo por código: ${ramoId}`);

            const ramo = await ramoRepo
              .createQueryBuilder("r")
              .leftJoinAndSelect("r.profesor", "p")
              .where("r.codigo = :codigo", { codigo: ramoId })
              .orWhere("r.id = :id", { id: parseInt(ramoId, 10) })
              .getOne();
            
            if (!ramo) {
              console.error(`❌ No se encontró ramo con código/ID ${ramoId}`);
              socket.emit("error", { message: `No se encontró el ramo ${ramoId}` });
              return;
            }

            ramoIdNum = ramo.id;
            console.log(`✓ [Socket] Ramo encontrado: ${ramo.nombre} (ID: ${ramo.id}, Código: ${ramo.codigo})`);

            // Si el ramo tiene profesor, usar su ID; de lo contrario, usar un profesor por defecto o null
            if (ramo.profesor && ramo.profesor.id) {
              profesorId = ramo.profesor.id;
              console.log(`✓ [Socket] Alumno ${userId} enviando en ramo ${ramoIdNum}, profesor: ${profesorId}`);
            } else {
              console.warn(`⚠️ [Socket] Ramo ${ramoIdNum} no tiene profesor asignado`);
              // Buscar el primer usuario con rol profesor como fallback
              const { User } = await import("../entities/user.entity.js");
              const userRepo = AppDataSource.getRepository(User);
              const profesorDefault = await userRepo.findOne({
                where: { role: "profesor" }
              });
              
              if (!profesorDefault) {
                socket.emit("error", { message: "No hay profesor disponible para este ramo" });
                return;
              }
              
              profesorId = profesorDefault.id;
              console.log(`✓ [Socket] Usando profesor por defecto: ${profesorId}`);
            }
          }

          // Guardar mensaje en BD
          // Obtener RUT del usuario que envía
          const { User } = await import("../entities/user.entity.js");
          const userRepo = AppDataSource.getRepository(User);
          const userEmisor = await userRepo.findOne({ where: { id: userId } });
          const rutEmisor = userEmisor?.rut;

          // Determinar rutReceptor según el rol
          let rutReceptor = alumnoRut;
          if (role === "alumno") {
            // Si es alumno, el receptor es el profesor
            // Obtener RUT del profesor
            const profesor = await userRepo.findOne({ where: { id: profesorId } });
            rutReceptor = profesor?.rut;
          }

          const resultado = await crearMensajeRetroalimentacion({
            evaluacionId: evaluacionId || null,
            evaluacionIntegradoraId: evaluacionIntegradoraId || null,
            profesorId,
            alumnoRut,
            ramoId: ramoIdNum,
            codigoRamo: codigoRamo || null,
            mensaje,
            creadoPor: userId,
            rutEmisor,
            rutReceptor,
          });

          if (resultado.error) {
            socket.emit("error", { message: resultado.error });
            return;
          }

          const mensajeGuardado = resultado.data;
          const salaRetroalimentacion = `retroalimentacion-${ramoIdNum}-${alumnoRut}-${evaluacionId || evaluacionIntegradoraId}`;

          // Emitir a la sala de retroalimentación
          const dataMensaje = {
            id: mensajeGuardado.id,
            mensaje: mensajeGuardado.mensaje,
            profesorId: mensajeGuardado.profesorId,
            creadoPor: mensajeGuardado.creadoPor,
            rutEmisor: mensajeGuardado.rutEmisor,
            rutReceptor: mensajeGuardado.rutReceptor,
            visto: mensajeGuardado.visto,
            createdAt: mensajeGuardado.createdAt,
          };

          console.log(`📤 [Socket] Emitiendo nuevo-mensaje a sala retroalimentación: ${salaRetroalimentacion}`);
          io.to(salaRetroalimentacion).emit("nuevo-mensaje", dataMensaje);

          // Notificar al alumno si no está conectado
          try {
            const { User } = await import("../entities/user.entity.js");
            const { Ramos } = await import("../entities/ramos.entity.js");
            const userRepo = AppDataSource.getRepository(User);
            const ramoRepo = AppDataSource.getRepository(Ramos);

            const alumnoUser = await userRepo.createQueryBuilder("u")
              .where("u.rut = :rut", { rut: alumnoRut })
              .getOne();

            const ramo = await ramoRepo.findOne({ where: { id: ramoId } });

            if (alumnoUser?.email && ramo) {
              const titulo = `Nueva retroalimentación en ${ramo.nombre}`;
              const textoMensaje = `Tienes un nuevo mensaje de retroalimentación en ${ramo.nombre}. Revísalo en el sistema.`;
              await notificarAlumnos([alumnoUser.email], titulo, textoMensaje);
            }
          } catch (notifError) {
            console.warn("[Retroalimentación] Error al notificar:", notifError.message);
          }
        } catch (error) {
          console.error("[Retroalimentación] Error al enviar mensaje:", error);
          socket.emit("error", { message: "Error al enviar mensaje" });
        }
      });

      // Marcar mensajes como vistos
      socket.on("marcar-vistos", async (data) => {
        try {
          const { evaluacionId, evaluacionIntegradoraId, alumnoRut, ramoId } = data;
          const usuarioInfo = this.usuariosConectados.get(socket.id);

          if (!usuarioInfo) {
            socket.emit("error", { message: "No autenticado" });
            return;
          }

          const { userId } = usuarioInfo;

          // Marcar como visto en BD
          await marcarMensajesComoVistos(
            evaluacionId || null,
            evaluacionIntegradoraId || null,
            userId,
            alumnoRut
          );

          const sala = `${usuarioInfo.role}-${usuarioInfo.userId}`;
          io.to(sala).emit("mensajes-marcados-vistos", { ramoId, alumnoRut });
        } catch (error) {
          console.error("[Retroalimentación] Error al marcar como visto:", error);
        }
      });

      // Desconexión
      socket.on("disconnect", () => {
        const usuarioInfo = this.usuariosConectados.get(socket.id);
        this.usuariosConectados.delete(socket.id);

        if (usuarioInfo) {
          // Notificar desconexión en la sala de retroalimentación
          const { ramoId, alumnoRut, evaluacionId, evaluacionIntegradoraId } = usuarioInfo;
          const salaRetroalimentacion = `retroalimentacion-${ramoId}-${alumnoRut}-${evaluacionId || evaluacionIntegradoraId}`;
          
          io.to(salaRetroalimentacion).emit("otro-usuario-desconectado");
          console.log(`[Socket.IO] Usuario desconectado de ${salaRetroalimentacion}`);
        }
      });
    });
  }
}

export default new RetroalimentacionHandler();
