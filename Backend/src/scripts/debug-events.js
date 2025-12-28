import { query } from '../config/database.js';
import config from '../config/config.js';

async function main() {
  try {
    console.log('DB config:', config.db);
    const res = await query(`SELECT id, nombre, duracion_por_alumno, ramo_id, seccion_id, fecha_inicio, fecha_fin, profesor_id, cupo_disponible FROM eventos ORDER BY fecha_inicio LIMIT 50`);
    console.log('Eventos encontrados:', res.rows.length);
    res.rows.forEach(r => console.log(r));

    // Buscar un alumno de la seccion 1 para probar la consulta usada por obtenerEventosDisponiblesSlots
    const alumnosRes = await query(`SELECT alumno_id FROM seccion_alumnos WHERE seccion_id = $1 LIMIT 1`, [1]);
    if (alumnosRes.rows.length === 0) {
      console.log('No hay alumnos en la seccion 1 para probar');
    } else {
      const alumnoId = alumnosRes.rows[0].alumno_id;
      console.log('Probando consulta de eventos disponibles para alumnoId=', alumnoId);
      const evs = await query(
        `SELECT e.*, t.nombre as tipo_nombre, t.color, r.codigo AS ramo_codigo, r.nombre AS ramo_nombre, s.numero AS seccion_numero,
                CASE WHEN EXISTS(SELECT 1 FROM slots WHERE evento_id = e.id AND alumno_id = $1) THEN true ELSE false END as alumno_inscrito
         FROM eventos e
         JOIN tipos_eventos t ON e.tipo_evento_id = t.id
         LEFT JOIN ramos r ON e.ramo_id = r.id
         LEFT JOIN secciones s ON e.seccion_id = s.id
         JOIN seccion_alumnos sa ON sa.seccion_id = e.seccion_id
         WHERE sa.alumno_id = $1 AND e.duracion_por_alumno IS NOT NULL AND e.duracion_por_alumno > 0 AND NOT EXISTS(SELECT 1 FROM slots WHERE evento_id = e.id AND alumno_id = $1)
         ORDER BY e.fecha_inicio ASC`,
        [alumnoId]
      );
      console.log('Eventos disponibles para inscripcion (por slots) encontrados:', evs.rows.length);
      evs.rows.forEach(r => console.log({ id: r.id, nombre: r.nombre, duracion_por_alumno: r.duracion_por_alumno, ramo_codigo: r.ramo_codigo }));
    }
  } catch (err) {
    console.error('Error en query:', err.message || err);
  } finally {
    process.exit(0);
  }
}

main();
