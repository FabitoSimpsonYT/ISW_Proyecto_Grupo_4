import nodemailer from 'nodemailer';
import config from './config.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port) || 587,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    if (!config?.email?.host || !config?.email?.user || !config?.email?.password) {
      throw new Error(
        "Email no configurado. Define EMAIL_HOST, EMAIL_PORT, EMAIL_USER y EMAIL_PASSWORD en Backend/.env"
      );
    }
    const info = await transporter.sendMail({
      from: `"Plataforma de Derecho " <${config.email.user}>`,
      to,
      subject,
      html,
    });
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
};

export default transporter;