import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import {
  getTiposEventos,
  getTipoEventoPorId,
  crearTipoEvento,
  actualizarTipoEvento,
  eliminarTipoEvento,
  getTiposEventosTodos,
} from "../services/tipoEvento.service.js";

/**
 * GET /api/tipos-eventos
 * Obtener todos los tipos de eventos activos
 */
export async function obtenerTiposEventos(req, res) {
  try {
    const tipos = await getTiposEventos();
    console.log('🔍 [tipoEvento] Tipos obtenidos en controlador:', tipos);
    console.log('🔍 [tipoEvento] Array.isArray(tipos):', Array.isArray(tipos));
    console.log('🔍 [tipoEvento] tipos.length:', tipos?.length);
    handleSuccess(res, 200, "Tipos de eventos obtenidos", { tipos });
  } catch (error) {
    console.error("Error en obtenerTiposEventos:", error);
    handleErrorServer(res, 500, "Error al obtener tipos de eventos", error.message);
  }
}

/**
 * GET /api/tipos-eventos/admin/todos
 * Obtener todos los tipos de eventos incluyendo inactivos (solo admin)
 */
export async function obtenerTiposEventosTodos(req, res) {
  try {
    const user = req.user;
    
    // Validar que sea admin/jefe
    if (user.rol !== "jefe" && user.rol !== "admin") {
      return handleErrorClient(res, 403, "No tienes permiso para acceder a este recurso");
    }

    const tipos = await getTiposEventosTodos();
    handleSuccess(res, 200, "Tipos de eventos obtenidos", { tipos });
  } catch (error) {
    console.error("Error en obtenerTiposEventosTodos:", error);
    handleErrorServer(res, 500, "Error al obtener tipos de eventos", error.message);
  }
}

/**
 * GET /api/tipos-eventos/:id
 * Obtener un tipo de evento por ID
 */
export async function obtenerTipoEvento(req, res) {
  try {
    const { id } = req.params;
    const tipo = await getTipoEventoPorId(parseInt(id));

    if (!tipo) {
      return handleErrorClient(res, 404, "Tipo de evento no encontrado");
    }

    handleSuccess(res, 200, "Tipo de evento obtenido", { tipo });
  } catch (error) {
    console.error("Error en obtenerTipoEvento:", error);
    handleErrorServer(res, 500, "Error al obtener tipo de evento", error.message);
  }
}

/**
 * POST /api/tipos-eventos
 * Crear un nuevo tipo de evento
 */
export async function crearTipo(req, res) {
  try {
    const user = req.user;
    const { nombre, descripcion, color } = req.body;

    console.log(`📝 [tipoEvento] Creando tipo - nombre=${nombre}, color=${color}, user.rol=${user.rol}`);

    // Validar que sea profesor/jefe/admin
    if (user.rol !== "profesor" && user.rol !== "jefe" && user.rol !== "admin") {
      return handleErrorClient(res, 403, "No tienes permiso para crear tipos de eventos");
    }

    // Validaciones básicas
    if (!nombre || !nombre.trim()) {
      return handleErrorClient(res, 400, "El nombre es obligatorio");
    }

    if (!color || !/^#[0-9A-F]{6}$/i.test(color)) {
      return handleErrorClient(res, 400, "El color debe ser un hexadecimal válido (ej: #FF5733)");
    }

    const tipo = await crearTipoEvento({ nombre, descripcion, color });
    console.log(`✅ [tipoEvento] Tipo creado:`, tipo);
    handleSuccess(res, 201, "Tipo de evento creado", { tipo });
  } catch (error) {
    console.error("Error en crearTipo:", error);
    
    if (error.message.includes("Ya existe")) {
      return handleErrorClient(res, 409, error.message);
    }
    
    handleErrorServer(res, 500, "Error al crear tipo de evento", error.message);
  }
}

/**
 * PUT /api/tipos-eventos/:id
 * Actualizar un tipo de evento
 */
export async function actualizarTipo(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { nombre, descripcion, color } = req.body;

    // Validar que sea profesor/jefe
    if (user.rol !== "profesor" && user.rol !== "jefe" && user.rol !== "admin") {
      return handleErrorClient(res, 403, "No tienes permiso para actualizar tipos de eventos");
    }

    // Validar color si se proporciona
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return handleErrorClient(res, 400, "El color debe ser un hexadecimal válido (ej: #FF5733)");
    }

    const tipo = await actualizarTipoEvento(parseInt(id), { nombre, descripcion, color });

    if (!tipo) {
      return handleErrorClient(res, 404, "Tipo de evento no encontrado");
    }

    handleSuccess(res, 200, "Tipo de evento actualizado", { tipo });
  } catch (error) {
    console.error("Error en actualizarTipo:", error);
    handleErrorServer(res, 500, "Error al actualizar tipo de evento", error.message);
  }
}

/**
 * DELETE /api/tipos-eventos/:id
 * Eliminar un tipo de evento
 */
export async function eliminarTipo(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    // Validar que sea profesor/jefe/admin
    if (user.rol !== "profesor" && user.rol !== "jefe" && user.rol !== "admin") {
      return handleErrorClient(res, 403, "No tienes permiso para eliminar tipos de eventos");
    }

    const tipo = await eliminarTipoEvento(parseInt(id));

    if (!tipo) {
      return handleErrorClient(res, 404, "Tipo de evento no encontrado");
    }

    handleSuccess(res, 200, "Tipo de evento eliminado", { tipo });
  } catch (error) {
    console.error("Error en eliminarTipo:", error);
    
    if (error.message.includes("No se puede eliminar")) {
      return handleErrorClient(res, 409, error.message);
    }

    handleErrorServer(res, 500, "Error al eliminar tipo de evento", error.message);
  }
}

export const createTipoEvento = async (req, res, next) => {
  try {
    const { nombre, descripcion, color, icono } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ message: 'Nombre obligatorio' });
    }

    const result = await query(
      'INSERT INTO tipos_eventos (nombre, descripcion, color, icono) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, descripcion, color || '#3b82f6', icono || '📅']
    );

    res.status(201).json({
      success: true,
      message: "Tipo creado",
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: "Nombre ya existe" });
    }
    next(error);
  }
};

export const updateTipoEvento = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { nombre, descripcion, color, icono } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: 'Nombre obligatorio' });
    }

    const result = await client.query(
      'UPDATE tipos_eventos SET nombre = $1, descripcion = $2, color = $3, icono = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [nombre, descripcion, color, icono, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Tipo no encontrado" });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Tipo actualizado",
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const deleteTipoEvento = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Validación: no eliminar si hay eventos asociados
    const check = await client.query(
      'SELECT COUNT(*) FROM eventos WHERE tipo_evento_id = $1',
      [id]
    );

    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ message: "No se puede eliminar, hay eventos asociados" });
    }

    const result = await client.query(
      'DELETE FROM tipos_eventos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Tipo no encontrado" });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Tipo eliminado"
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};