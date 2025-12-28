import { query } from '../config/database.js';

class DevController {
  // Enroll authenticated alumno into a given section (development only)
  enrollAlumnoEnSeccion = async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ success: false, message: 'Solo disponible en development' });
      }

      const alumnoId = req.user?.id;
      if (!alumnoId) return res.status(401).json({ success: false, message: 'No autorizado' });

      const seccionId = Number(req.query.seccionId || req.body.seccionId || 1);

      // Insert if not exists
      await query(`INSERT INTO seccion_alumnos (seccion_id, alumno_id)
                   SELECT $1, $2
                   WHERE NOT EXISTS (SELECT 1 FROM seccion_alumnos WHERE seccion_id = $1 AND alumno_id = $2)`,
        [seccionId, alumnoId]
      );

      return res.json({ success: true, message: `Alumno ${alumnoId} inscrito en seccion ${seccionId}` });
    } catch (error) {
      console.error('Error enrollAlumnoEnSeccion:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}

export default new DevController();
