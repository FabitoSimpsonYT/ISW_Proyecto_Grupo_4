function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function compact(value) {
  return String(value || "").trim();
}

function toInitials(name) {
  const cleaned = compact(name);
  if (!cleaned) return "";
  const parts = cleaned
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = (parts[1]?.[0] || parts[0]?.[1] || "").toString();
  return (first + second).toUpperCase();
}

function renderKeyValueRows(details) {
  const safeDetails = Array.isArray(details) ? details : [];
  const rows = safeDetails
    .filter((d) => d && compact(d.label) && compact(d.value))
    .map((d) => {
      const label = escapeHtml(d.label);
      const value = escapeHtml(d.value);
      return `
        <tr>
          <td style="padding:10px 0;font-family:Arial, sans-serif;font-size:13px;color:#1d4ed8;font-weight:700;white-space:nowrap;">${label}</td>
          <td style="padding:10px 0 10px 12px;font-family:Arial, sans-serif;font-size:13px;color:#0f172a;">${value}</td>
        </tr>
        <tr>
          <td colspan="2" style="border-top:1px solid #dbeafe;line-height:0;font-size:0;">&nbsp;</td>
        </tr>`;
    })
    .join("\n");

  return rows;
}

function renderCheckList(items) {
  const safeItems = (Array.isArray(items) ? items : [])
    .map((it) => compact(it))
    .filter(Boolean);
  if (safeItems.length === 0) return "";
  return safeItems
    .map(
      (it) =>
        `<div style="margin:6px 0;font-family:Arial, sans-serif;font-size:13px;line-height:1.5;color:#0f172a;">✓ ${escapeHtml(
          it
        )}</div>`
    )
    .join("\n");
}

/**
 * Minimal, email-client-friendly template (Gmail/Outlook) using table layout + inline CSS.
 *
 * @param {Object} params
 * @param {string} params.title
 * @param {string} [params.preheader] 
 * @param {string[]} [params.lines] 
 * @param {string} [params.appName] 
 * @param {string} [params.footer] 
 */
export function renderNotificationEmail({
  title,
  preheader,
  lines = [],
  appName = "Plataforma de Derecho",
  appSubtitle = "Sistema de Gestión de Certámenes",
  badgeText,
  instructorName,
  instructorEmail,
  courseName,
  platformTextName,
  metaRightLines = [],
  subtitle,
  detailsTitle,
  details,
  recommendations,
  footer = "Este es un mensaje automático, por favor no responder.",
}) {
  const safeTitle = escapeHtml(title);
  const safeAppName = escapeHtml(appName);
  const safeAppSubtitle = escapeHtml(appSubtitle);
  const safeFooter = escapeHtml(footer);
  const safePreheader = escapeHtml(preheader || lines?.[0] || "");

  const safeSubtitle = escapeHtml(subtitle || preheader || "Se ha publicado un nuevo certamen en su curso");

  const safeInstructorName = instructorName ? escapeHtml(instructorName) : "";
  const safeInstructorEmail = instructorEmail ? escapeHtml(instructorEmail) : "";
  const safeCourseName = courseName ? escapeHtml(courseName) : "";
  const safePlatformTextName = escapeHtml(platformTextName || process.env.EMAIL_PLATFORM_NAME || "Plataforma Adecca");

  const safeBadgeText = badgeText ? escapeHtml(badgeText) : "";
  const bulletItems = [];
  if (safeBadgeText) bulletItems.push(safeBadgeText);
  (lines || []).filter(Boolean).forEach((l) => bulletItems.push(escapeHtml(l)));

  const initials = escapeHtml(toInitials(appName) || "PD");
  const metaLines = (Array.isArray(metaRightLines) ? metaRightLines : [])
    .map((l) => compact(l))
    .filter(Boolean)
    .slice(0, 3)
    .map((l) => `<div style="font-family:Arial, sans-serif;font-size:11px;line-height:1.35;color:#e0e7ff;">${escapeHtml(l)}</div>`)
    .join("\n");

  const effectiveDetailsTitle = escapeHtml(detailsTitle || "Detalles del Certamen");
  const detailsRowsHtml = renderKeyValueRows(details);

  const fallbackListHtml = bulletItems.length
    ? bulletItems
        .map(
          (it) =>
            `<div style="margin:6px 0;font-family:Arial, sans-serif;font-size:13px;line-height:1.5;color:#0f172a;">${it}</div>`
        )
        .join("\n")
    : "";

  const actionsHtml = renderCheckList(recommendations);

  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;">
    <!-- Preheader (hidden) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${safePreheader}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f3f4f6;margin:0;padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;width:100%;">
            <tr>
              <td style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                <!-- Blue Header -->
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#1d4ed8;">
                  <tr>
                    <td style="padding:16px 18px 18px 18px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td valign="top" style="padding-right:10px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                              <tr>
                                <td valign="top" style="padding-right:10px;">
                                  <div style="width:34px;height:34px;border-radius:999px;background-color:#0b2f89;display:inline-block;text-align:center;line-height:34px;font-family:Arial, sans-serif;font-weight:800;color:#ffffff;font-size:13px;">
                                    ${initials}
                                  </div>
                                </td>
                                <td valign="top">
                                  <div style="font-family:Arial, sans-serif;font-size:13px;font-weight:800;color:#ffffff;line-height:1.25;">${safeAppName}</div>
                                  <div style="font-family:Arial, sans-serif;font-size:11px;color:#c7d2fe;line-height:1.25;">${safeAppSubtitle}</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td valign="top" align="right">
                            ${metaLines}
                          </td>
                        </tr>
                      </table>

                      <div style="margin-top:14px;font-family:Arial, sans-serif;font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;">${safeTitle}</div>
                      <div style="margin-top:6px;font-family:Arial, sans-serif;font-size:12px;color:#e0e7ff;line-height:1.35;">${safeSubtitle}</div>
                    </td>
                  </tr>
                </table>

                <!-- Body -->
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:22px 18px;font-family:Arial, sans-serif;">
                      <div style="font-size:14px;line-height:1.6;color:#0f172a;margin:0 0 12px 0;">
                        Estimado(a),
                      </div>

                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;">
                        <tr>
                          <td style="padding:14px 14px;">
                            <div style="font-family:Arial, sans-serif;font-size:13px;line-height:1.6;color:#0f172a;margin:0 0 10px 0;">
                              Le informamos que el/la profesor(a)${safeInstructorName ? ` <strong>${safeInstructorName}</strong>` : ""} ha publicado una nueva nota de evaluación${safeCourseName ? ` en su curso <strong>&quot;${safeCourseName}&quot;</strong>` : ""} a través de la ${safeAppName}.
                            </div>
                            <div style="font-family:Arial, sans-serif;font-size:13px;line-height:1.6;color:#0f172a;margin:0;">
                              Le recomendamos revisar la información detallada a continuación para asegurar su cumplimiento con los plazos y requisitos establecidos.
                            </div>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
                        <tr>
                          <td style="padding:14px 14px;">
                            <div style="font-family:Arial, sans-serif;font-size:13px;font-weight:800;color:#0f172a;margin-bottom:10px;">
                              📋 ${effectiveDetailsTitle}
                            </div>
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                              ${detailsRowsHtml || `
                                <tr>
                                  <td style="font-family:Arial, sans-serif;font-size:13px;line-height:1.6;color:#0f172a;">${fallbackListHtml || escapeHtml("Información disponible en el sistema.")}</td>
                                </tr>
                              `}
                            </table>
                          </td>
                        </tr>
                      </table>

                      ${actionsHtml ? `
                      <div style="margin-top:16px;font-family:Arial, sans-serif;font-size:13px;font-weight:800;color:#0f172a;">Acciones recomendadas:</div>
                      <div style="margin-top:6px;">${actionsHtml}</div>
                      ` : ""}

                      <div style="margin-top:16px;font-family:Arial, sans-serif;font-size:12px;line-height:1.6;color:#334155;">
                        Puede revisarlo en el sistema. ${safeInstructorEmail ? `Si tiene dudas, puede contactarse al correo <a href="mailto:${safeInstructorEmail}" style="color:#1d4ed8;text-decoration:none;">${safeInstructorEmail}</a>.` : ""}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Footer -->
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="padding:14px 18px 18px 18px;background-color:#ffffff;border-top:1px solid #e5e7eb;">
                      <div style="font-family:Arial, sans-serif;color:#6b7280;font-size:12px;line-height:1.4;">
                        ${safeFooter}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}
