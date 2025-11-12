export const sanitizeResponse = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeItem(item));
  }
  return sanitizeItem(data);
};

const sanitizeItem = (item) => {
  if (!item || typeof item !== 'object') {
    return item;
  }

  const cleaned = { ...item };

  delete cleaned.id;
  delete cleaned.professor_id;
  delete cleaned.student_id;
  delete cleaned.user_id;
  delete cleaned.password;
  delete cleaned.reset_token;


  if (!cleaned.code && item.id) {
    cleaned.code = generateCodeFromType(item);
  }

  return cleaned;
};

const generateCodeFromType = (item) => {
  if (item.event_type) return `EVT${item.id.substring(0, 6)}`;
  if (item.booking_status) return `RES${item.id.substring(0, 6)}`;
  if (item.notification_type) return `NOT${item.id.substring(0, 6)}`;
  return `CODE${item.id.substring(0, 6)}`;
};

export const sendSuccess = (res, data = null, message = 'Operación exitosa', statusCode = 200) => {
  const response = {
    success: true,
    message,
    data: data ? sanitizeResponse(data) : null
  };

  res.status(statusCode).json(response);
};

export const sendError = (res, message = 'Error en la operación', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    errors
  };

  res.status(statusCode).json(response);
};