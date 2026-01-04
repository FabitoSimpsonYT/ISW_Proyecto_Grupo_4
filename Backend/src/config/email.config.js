import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

try {
  // Usar las variables de entorno configuradas
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log('✅ Nodemailer configurado correctamente');
  } else {
    console.warn('⚠️  Variables de email no configuradas. Usando modo demo.');
    // Modo desarrollo: no enviar realmente pero loguear
    transporter = null;
  }
} catch (error) {
  console.error('❌ Error configurando nodemailer:', error.message);
  transporter = null;
}

export const getMailTransporter = () => transporter;

export const sendEmail = async (to, subject, htmlContent) => {
  if (!transporter) {
    console.log(`📧 [MODO DEMO] Email a: ${to}`);
    console.log(`📧 [MODO DEMO] Asunto: ${subject}`);
    console.log(`📧 [MODO DEMO] Contenido HTML guardado en logs`);
    return { success: true, message: 'Email enviado en modo demo', demo: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Sistema Evaluaciones" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`✅ Email enviado a ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email a ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};
