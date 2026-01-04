import { useState, useRef, useEffect } from 'react';

export default function CustomDatePicker({ value, onChange, min = null, disabled = false, className = "", bloqueos = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(new Date());
  const containerRef = useRef(null);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  // Inicializar fecha mostrada si hay un valor
  useEffect(() => {
    if (value) {
      // Parsear string YYYY-MM-DD para crear fecha local correcta
      const parts = value.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        setDisplayDate(date);
      }
    }
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Convertir domingo (0) a 6, y los demás días correr uno hacia atrás (lunes = 0)
    return day === 0 ? 6 : day - 1;
  };

  const isDateBlocked = (day) => {
    if (!day) return false;
    const checkDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    
    return bloqueos.some(bloqueo => {
      const inicioStr = bloqueo.fechaInicio || bloqueo.fecha_inicio;
      const finStr = bloqueo.fechaFin || bloqueo.fecha_fin;
      
      const inicioParts = inicioStr.split('-');
      const finParts = finStr.split('-');
      
      const inicio = new Date(parseInt(inicioParts[0], 10), parseInt(inicioParts[1], 10) - 1, parseInt(inicioParts[2], 10));
      const fin = new Date(parseInt(finParts[0], 10), parseInt(finParts[1], 10) - 1, parseInt(finParts[2], 10));
      
      return checkDate >= inicio && checkDate <= fin;
    });
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(displayDate);
    const firstDay = getFirstDayOfMonth(displayDate);
    const days = [];

    // Días del mes anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handlePrevMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1));
  };

  const handleDayClick = (day) => {
    if (day === null) return;
    if (isDateBlocked(day)) return;

    const selectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    selectedDate.setHours(12, 0, 0, 0); // Mediodía para evitar problemas de zona horaria
    
    // Validar si la fecha es menor que la mínima
    if (min) {
      const minDate = new Date(min);
      minDate.setHours(0, 0, 0, 0);
      if (selectedDate < minDate) return;
    }

    // Crear string de fecha sin problemas de zona horaria
    const year = displayDate.getFullYear();
    const month = String(displayDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    onChange(dateString);
    setIsOpen(false);
  };

  const days = generateCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formattedValue = (() => {
    if (!value) return 'Seleccionar fecha';
    const parts = value.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
  })();

  const isDateBeforeMin = (day) => {
    if (!min || day === null) return false;
    // Construir fecha local
    const selectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    
    // Parsear min date
    const parts = min.split('-');
    const minDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    
    return selectedDate < minDate;
  };

  const isToday = (day) => {
    if (day === null) return false;
    const today = new Date();
    const selectedDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    
    return selectedDate.getFullYear() === today.getFullYear() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getDate() === today.getDate();
  };

  const isSelected = (day) => {
    if (day === null || !value) return false;
    const parts = value.split('-');
    const selectedYear = parseInt(parts[0], 10);
    const selectedMonth = parseInt(parts[1], 10) - 1;
    const selectedDay = parseInt(parts[2], 10);
    
    return displayDate.getFullYear() === selectedYear &&
           displayDate.getMonth() === selectedMonth &&
           day === selectedDay;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-left flex items-center justify-between transition ${
          disabled 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
            : 'hover:border-[#143A80] focus:border-[#143A80] focus:ring-2 focus:ring-blue-200 cursor-pointer'
        } ${className}`}
      >
        <span className={disabled ? 'text-gray-500' : 'text-gray-700'}>{formattedValue}</span>
        <svg className={`w-5 h-5 transition ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-[#143A80] rounded-lg shadow-2xl z-50 p-4 w-80">
          {/* Header con mes y año */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-[#143A80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h3 className="font-bold text-[#143A80] text-lg">
                {meses[displayDate.getMonth()]} {displayDate.getFullYear()}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-[#143A80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {diasSemana.map(dia => (
              <div key={dia} className="text-center font-bold text-sm text-[#143A80] py-2">
                {dia}
              </div>
            ))}
          </div>

          {/* Días del calendario */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const isDisabled = isDateBeforeMin(day) || isDateBlocked(day);
              const isBlocked = isDateBlocked(day);
              const isTodayDate = isToday(day);
              const isSelectedDate = isSelected(day);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  disabled={day === null || isDisabled}
                  className={`
                    py-2 rounded-lg font-semibold text-sm transition
                    ${day === null
                      ? 'cursor-default'
                      : isBlocked
                      ? 'text-white bg-red-500 cursor-not-allowed border-2 border-red-600 line-through'
                      : isDisabled
                      ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                      : isSelectedDate
                      ? 'bg-[#143A80] text-white shadow-md hover:shadow-lg'
                      : isTodayDate
                      ? 'bg-blue-100 text-[#143A80] border-2 border-[#143A80] hover:bg-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 border-2 border-transparent hover:border-[#143A80]'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer con botones */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
