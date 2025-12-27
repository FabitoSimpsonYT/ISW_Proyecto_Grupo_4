export const formatDate = (date) => {
  return new Date(date).toLocaleString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start;
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
};

export const isWithinTimeWindow = (dateToCheck, windowStart, windowEnd) => {
  const check = new Date(dateToCheck);
  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  
  return check >= start && check <= end;
};

export const generateBookingReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `BK-${timestamp}-${random}`.toUpperCase();
};

export const validateRUT = (rut) => {
  const rutRegex = /^[0-9]{7,8}-[0-9Kk]{1}$/;
  if (!rutRegex.test(rut)) return false;
  
  const [num, dv] = rut.split('-');
  
  // Validar que no sea RUT de empresa (> 50 millones)
  if (parseInt(num) > 50000000) return false;
  
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = num.length - 1; i >= 0; i--) {
    suma += parseInt(num[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  
  return dv.toUpperCase() === dvCalculado;
};

export const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit, offset };
};

export const buildPaginationMeta = (total, page, limit) => {
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  };
};
