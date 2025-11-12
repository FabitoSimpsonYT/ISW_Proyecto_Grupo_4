export const parseCustomDateFormat = (dateString) => {
  const normalized = dateString.replace(/\//g, '-');
  const [datePart, timePart] = normalized.split(' ');
  const [day, month, year] = datePart.split('-');
  const [hours, minutes] = timePart.split(':');
  
  const fullYear = 2000 + parseInt(year);
  
  return new Date(fullYear, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
};


export const formatToCustomDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};