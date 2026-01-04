import { AppDataSource } from "../config/configDB.js";

// Usar la entidad si existe, sino usar query builder
let TipoEvento;
try {
  const { TipoEvento: TE } = await import("../entities/tipoEvento.entity.js");
  TipoEvento = TE;
} catch (err) {
  console.log("TipoEvento entity no encontrada, usando query");
}

/**
 * Obtener todos los tipos de eventos activos
 */
export async function getTiposEventos() {
  try {
    console.log('📝 [tipoEvento.service] getTiposEventos() iniciado');
    console.log('📝 [tipoEvento.service] TipoEvento disponible?:', !!TipoEvento);
    
    if (TipoEvento) {
      const repo = AppDataSource.getRepository(TipoEvento);
      const result = await repo.find({
        where: { activo: true },
        order: { nombre: "ASC" },
      });
      console.log('✅ [tipoEvento.service] Resultado desde TypeORM:', result);
      console.log('✅ [tipoEvento.service] Longitud:', result?.length || 0);
      return result || [];
    }

    // Fallback a query directa
    console.log('⚠️ [tipoEvento.service] TypeORM no disponible, usando query');
    const result = await AppDataSource.query(
      "SELECT * FROM tipos_eventos WHERE activo = true ORDER BY nombre"
    );
    console.log('✅ [tipoEvento.service] Resultado desde query:', result);
    return result || [];
  } catch (error) {
    console.error("❌ Error en getTiposEventos:", error);
    throw error;
  }
}

/**
 * Obtener un tipo de evento por ID
 */
export async function getTipoEventoPorId(id) {
  try {
    if (TipoEvento) {
      const repo = AppDataSource.getRepository(TipoEvento);
      return await repo.findOne({ where: { id } });
    }

    const result = await AppDataSource.query(
      "SELECT * FROM tipos_eventos WHERE id = $1",
      [id]
    );
    return result[0] || null;
  } catch (error) {
    console.error("Error en getTipoEventoPorId:", error);
    throw error;
  }
}

/**
 * Crear un nuevo tipo de evento
 */
export async function crearTipoEvento(data) {
  try {
    const { nombre, descripcion, color } = data;

    // Validar datos
    if (!nombre || !nombre.trim()) {
      throw new Error("El nombre es obligatorio");
    }

    if (!color || !/^#[0-9A-F]{6}$/i.test(color)) {
      throw new Error("El color debe ser un hexadecimal válido (ej: #FF5733)");
    }

    if (TipoEvento) {
      const repo = AppDataSource.getRepository(TipoEvento);
      
      // Verificar que no existe otro con el mismo nombre (case-insensitive)
      const existe = await repo.createQueryBuilder()
        .where("LOWER(nombre) = LOWER(:nombre)", { nombre: nombre.trim() })
        .getOne();
      
      if (existe) {
        console.warn(`⚠️ [tipoEvento] Ya existe un tipo con nombre: "${nombre}" (ID: ${existe.id})`);
        throw new Error("Ya existe un tipo de evento con ese nombre");
      }

      const nuevoTipo = repo.create({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        color: color,
        activo: true,
      });

      const resultado = await repo.save(nuevoTipo);
      console.log(`✅ [tipoEvento] Tipo guardado en BD:`, resultado);
      return resultado;
    }

    // Fallback a query
    const result = await AppDataSource.query(
      "INSERT INTO tipos_eventos (nombre, descripcion, color, activo) VALUES ($1, $2, $3, true) RETURNING *",
      [nombre.trim(), descripcion?.trim() || null, color]
    );

    return result[0];
  } catch (error) {
    console.error("Error en crearTipoEvento:", error);
    throw error;
  }
}

/**
 * Actualizar un tipo de evento
 */
export async function actualizarTipoEvento(id, data) {
  try {
    const { nombre, descripcion, color } = data;

    if (nombre && !nombre.trim()) {
      throw new Error("El nombre no puede estar vacío");
    }

    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      throw new Error("El color debe ser un hexadecimal válido (ej: #FF5733)");
    }

    if (TipoEvento) {
      const repo = AppDataSource.getRepository(TipoEvento);
      
      const tipoEvento = await repo.findOne({ where: { id } });
      if (!tipoEvento) {
        throw new Error("Tipo de evento no encontrado");
      }

      if (nombre?.trim()) tipoEvento.nombre = nombre.trim();
      if (color) tipoEvento.color = color;
      if (descripcion !== undefined) tipoEvento.descripcion = descripcion?.trim() || null;

      return await repo.save(tipoEvento);
    }

    // Fallback a query
    const actualizaciones = [];
    const valores = [];
    let paramNum = 1;

    if (nombre?.trim()) {
      actualizaciones.push(`nombre = $${paramNum}`);
      valores.push(nombre.trim());
      paramNum++;
    }
    if (color) {
      actualizaciones.push(`color = $${paramNum}`);
      valores.push(color);
      paramNum++;
    }
    if (descripcion !== undefined) {
      actualizaciones.push(`descripcion = $${paramNum}`);
      valores.push(descripcion?.trim() || null);
      paramNum++;
    }

    if (actualizaciones.length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    valores.push(id);
    const query = `UPDATE tipos_eventos SET ${actualizaciones.join(", ")} WHERE id = $${paramNum} RETURNING *`;

    const result = await AppDataSource.query(query, valores);
    return result[0] || null;
  } catch (error) {
    console.error("Error en actualizarTipoEvento:", error);
    throw error;
  }
}

/**
 * Eliminar un tipo de evento (soft delete)
 * Solo si no hay eventos que lo usen
 */
export async function eliminarTipoEvento(id) {
  try {
    // Verificar que no hay eventos con este tipo
    const eventosCount = await AppDataSource.query(
      "SELECT COUNT(*) FROM eventos WHERE tipo_evento_id = $1",
      [id]
    );

    if (parseInt(eventosCount[0].count) > 0) {
      throw new Error("No se puede eliminar este tipo de evento porque hay eventos que lo utilizan");
    }

    if (TipoEvento) {
      const repo = AppDataSource.getRepository(TipoEvento);
      const tipoEvento = await repo.findOne({ where: { id } });
      
      if (!tipoEvento) {
        throw new Error("Tipo de evento no encontrado");
      }

      tipoEvento.activo = false;
      return await repo.save(tipoEvento);
    }

    // Fallback a query
    const result = await AppDataSource.query(
      "UPDATE tipos_eventos SET activo = false WHERE id = $1 RETURNING *",
      [id]
    );

    return result[0] || null;
  } catch (error) {
    console.error("Error en eliminarTipoEvento:", error);
    throw error;
  }
}

/**
 * Obtener tipos de eventos incluyendo inactivos (solo para admin)
 */
export async function getTiposEventosTodos() {
  try {
    if (TipoEvento) {
      const repo = AppDataSource.getRepository(TipoEvento);
      return await repo.find({ order: { nombre: "ASC" } });
    }

    const result = await AppDataSource.query(
      "SELECT * FROM tipos_eventos ORDER BY nombre"
    );
    return result;
  } catch (error) {
    console.error("Error en getTiposEventosTodos:", error);
    throw error;
  }
}