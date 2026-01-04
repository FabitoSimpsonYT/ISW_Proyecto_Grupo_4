import { generarReporteEvaluacionesService, generarReporteSlotsService } from "../services/reporte.service.js";
import { handleSuccess, handleErrorServer, handleErrorClient } from "../Handlers/responseHandlers.js";

/**
 * Descargar reporte de evaluaciones en Excel
 */
export async function descargarReporteEvaluaciones(req, res) {
  try {
    const user = req.user;
    const { codigoRamo } = req.query;

    // Validar que sea profesor
    if (user.rol !== "profesor" && user.rol !== "jefe") {
      return handleErrorClient(res, 403, "No tienes permiso para descargar reportes");
    }

    // Generar Excel
    const buffer = await generarReporteEvaluacionesService(user, codigoRamo);

    // Headers para descarga
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Reporte_Evaluaciones_${new Date().toISOString().split("T")[0]}.xlsx"`
    );

    // Enviar buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error en descargarReporteEvaluaciones:", error);
    handleErrorServer(res, 500, "Error al generar reporte", error.message);
  }
}

/**
 * Descargar reporte de slots en Excel
 */
export async function descargarReporteSlots(req, res) {
  try {
    const user = req.user;

    // Validar que sea profesor
    if (user.rol !== "profesor" && user.rol !== "jefe") {
      return handleErrorClient(res, 403, "No tienes permiso para descargar reportes");
    }

    // Generar Excel
    const buffer = await generarReporteSlotsService(user);

    // Headers para descarga
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Reporte_Slots_${new Date().toISOString().split("T")[0]}.xlsx"`);

    // Enviar buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error en descargarReporteSlots:", error);
    handleErrorServer(res, 500, "Error al generar reporte", error.message);
  }
}
