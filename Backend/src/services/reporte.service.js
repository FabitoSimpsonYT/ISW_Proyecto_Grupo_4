import ExcelJS from "exceljs";
import { AppDataSource } from "../config/configDB.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { Ramos } from "../entities/ramos.entity.js";
import { User } from "../entities/user.entity.js";

/**
 * Generar reporte de evaluaciones en Excel
 * @param {Object} user - Usuario profesor
 * @param {string} codigoRamo - (Opcional) Filtrar por ramo
 * @returns {Promise<Buffer>} Buffer del archivo Excel
 */
export async function generarReporteEvaluacionesService(user, codigoRamo = null) {
  try {
    const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
    const ramoRepo = AppDataSource.getRepository(Ramos);

    let query = evaluacionRepo
      .createQueryBuilder("evaluaciones")
      .leftJoinAndSelect("evaluaciones.ramo", "ramo")
      .leftJoinAndSelect("evaluaciones.profesor", "profesor")
      .leftJoinAndSelect("evaluaciones.slots", "slots")
      .where("profesor.id = :profesorId", { profesorId: user.id });

    if (codigoRamo) {
      query = query.andWhere("ramo.codigo = :codigoRamo", { codigoRamo });
    }

    const evaluaciones = await query.orderBy("ramo.codigo", "ASC").addOrderBy("evaluaciones.nombre", "ASC").getMany();

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Evaluaciones");

    // Estilos
    const headerStyle = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } },
      font: { color: { argb: "FFFFFFFF" }, bold: true, size: 12 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      },
    };

    const cellStyle = {
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      },
    };

    // Headers
    const headers = [
      "ID",
      "Ramo",
      "Código",
      "Nombre Evaluación",
      "Tipo",
      "Modalidad",
      "Fecha Programada",
      "Sección",
      "Lugar/Link",
      "Puntaje Total",
      "Estado",
      "Cantidad Slots",
      "Alumnos Evaluados",
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Ancho de columnas
    worksheet.columns = [
      { width: 10 },
      { width: 20 },
      { width: 12 },
      { width: 25 },
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 12 },
      { width: 20 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 16 },
    ];

    // Llenar datos
    evaluaciones.forEach((evaluacion) => {
      const row = worksheet.addRow([
        evaluacion.id,
        evaluacion.ramo?.nombre || "N/A",
        evaluacion.ramo?.codigo || "N/A",
        evaluacion.nombre || "N/A",
        evaluacion.tipoEvaluacion || "Sin especificar",
        evaluacion.modalidad || "Presencial",
        evaluacion.fechaProgramada
          ? new Date(evaluacion.fechaProgramada).toLocaleDateString("es-CL", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A",
        evaluacion.seccion || "N/A",
        evaluacion.lugarPresencial || evaluacion.linkOnline || "N/A",
        evaluacion.puntajeTotal || 0,
        evaluacion.estado || "activo",
        evaluacion.slots?.length || 0,
        evaluacion.alumnosEvaluados || 0,
      ]);

      row.eachCell((cell) => {
        cell.style = cellStyle;
      });
    });

    // Agregar resumen
    const resumenRow = worksheet.addRow([]);
    worksheet.addRow([
      "RESUMEN",
      `Total Evaluaciones: ${evaluaciones.length}`,
      `Profesor: ${user.nombre || user.email}`,
      `Generado: ${new Date().toLocaleDateString("es-CL")}`,
    ]);

    // Convertir a buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    console.error("Error generando reporte:", error);
    throw new Error(`Error al generar reporte: ${error.message}`);
  }
}

/**
 * Generar reporte de slots en Excel
 * @param {Object} user - Usuario profesor
 * @returns {Promise<Buffer>} Buffer del archivo Excel
 */
export async function generarReporteSlotsService(user) {
  try {
    const evaluacionRepo = AppDataSource.getRepository(Evaluacion);

    const query = evaluacionRepo
      .createQueryBuilder("evaluaciones")
      .leftJoinAndSelect("evaluaciones.ramo", "ramo")
      .leftJoinAndSelect("evaluaciones.profesor", "profesor")
      .leftJoinAndSelect("evaluaciones.slots", "slots")
      .leftJoinAndSelect("slots.alumno", "alumno")
      .where("profesor.id = :profesorId", { profesorId: user.id })
      .orderBy("ramo.codigo", "ASC")
      .addOrderBy("evaluaciones.nombre", "ASC");

    const evaluaciones = await query.getMany();

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Slots");

    // Estilos
    const headerStyle = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } },
      font: { color: { argb: "FFFFFFFF" }, bold: true, size: 12 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      },
    };

    const cellStyle = {
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      },
    };

    // Headers
    const headers = ["Ramo", "Evaluación", "Slot ID", "Fecha", "Hora", "Alumno", "RUT", "Estado Inscripción", "Calificación"];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    worksheet.columns = [
      { width: 20 },
      { width: 25 },
      { width: 12 },
      { width: 15 },
      { width: 10 },
      { width: 20 },
      { width: 14 },
      { width: 18 },
      { width: 14 },
    ];

    // Llenar datos
    evaluaciones.forEach((evaluacion) => {
      if (evaluacion.slots && evaluacion.slots.length > 0) {
        evaluacion.slots.forEach((slot) => {
          const row = worksheet.addRow([
            evaluacion.ramo?.codigo || "N/A",
            evaluacion.nombre || "N/A",
            slot.id || "N/A",
            slot.fechaSlot ? new Date(slot.fechaSlot).toLocaleDateString("es-CL") : "N/A",
            slot.horaInicio ? slot.horaInicio.substring(0, 5) : "N/A",
            slot.alumno?.user?.nombre || "Sin asignar",
            slot.alumno?.rut || "N/A",
            slot.estadoInscripcion || "pendiente",
            slot.calificacion || "Sin calificar",
          ]);

          row.eachCell((cell) => {
            cell.style = cellStyle;
          });
        });
      }
    });

    // Convertir a buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    console.error("Error generando reporte slots:", error);
    throw new Error(`Error al generar reporte: ${error.message}`);
  }
}
