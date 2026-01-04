import { query } from '../config/database.js';
import { sendEmail } from '../config/email.js';
import { renderNotificationEmail } from '../utils/emailTemplate.js';

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
  sendTestEmail = async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ success: false, message: 'Solo disponible en development' });
      }

      const to = String(req.body?.to || req.user?.email || '').trim();
      if (!to) {
        return res.status(400).json({ success: false, message: 'Debes indicar un destinatario (body.to) o tener email en el usuario' });
      }

      const subject = String(req.body?.subject || 'Correo de prueba - Sistema de Agendamiento').trim();
      const badgeText = String(req.body?.badgeText || 'Test de lenguaje').trim();

      const publicadoEl = (() => {
        try {
          return new Intl.DateTimeFormat('es-CL', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'America/Santiago',
          }).format(new Date());
        } catch {
          return new Date().toLocaleString('es-CL');
        }
      })();

      const html = renderNotificationEmail({
        title: 'Certamen publicado',
        preheader: 'Se ha publicado exitosamente el certamen.',
        lines: [
          'Se ha publicado exitosamente el certamen y está disponible en el sistema.',
          `Publicado el: ${publicadoEl}`,
          'Ya puedes revisarlo y realizar los ajustes necesarios.',
        ],
        badgeText,
      });

      const info = await sendEmail(to, subject, html);
      return res.json({ success: true, messageId: info?.messageId });
    } catch (error) {
      console.error('Error sendTestEmail:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}

export default new DevController();
