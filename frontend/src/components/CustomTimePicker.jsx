import { useState, useRef, useEffect } from 'react';

export default function CustomTimePicker({ value, onChange, disabled = false, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const containerRef = useRef(null);
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);

  const hours = Array.from({ length: 14 }, (_, i) => 8 + i); // 8:00 a 21:00
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55

  // Inicializar valores si hay un valor
  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setSelectedHour(parseInt(h, 10));
      setSelectedMinute(parseInt(m, 10));
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

  // Auto-scroll a la hora/minuto seleccionado
  useEffect(() => {
    if (isOpen && hoursRef.current) {
      const selectedElement = hoursRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [isOpen, selectedHour]);

  useEffect(() => {
    if (isOpen && minutesRef.current) {
      const selectedElement = minutesRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [isOpen, selectedMinute]);

  const handleSelectTime = () => {
    const timeString = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const formattedValue = value || '08:00';

  // Estilos para ocultar scrollbar
  const scrollbarHiddenStyle = {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <style>{`
        .custom-time-picker-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

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
        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-[#143A80] rounded-lg shadow-2xl z-50 p-4">
          <div className="flex items-center gap-4">
            {/* Horas */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#143A80] mb-2 text-center">Hora</label>
              <div
                ref={hoursRef}
                className="custom-time-picker-scroll h-48 w-16 overflow-y-auto border border-gray-300 rounded-lg bg-gray-50 flex flex-col"
                style={scrollbarHiddenStyle}
              >
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => setSelectedHour(hour)}
                    data-selected={selectedHour === hour}
                    className={`
                      py-2 px-2 text-center font-semibold text-sm transition
                      ${selectedHour === hour
                        ? 'bg-[#143A80] text-white'
                        : 'text-gray-700 hover:bg-blue-100'
                      }
                    `}
                  >
                    {String(hour).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Separador */}
            <div className="text-2xl font-bold text-[#143A80] mt-6">:</div>

            {/* Minutos */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-[#143A80] mb-2 text-center">Minuto</label>
              <div
                ref={minutesRef}
                className="custom-time-picker-scroll h-48 w-16 overflow-y-auto border border-gray-300 rounded-lg bg-gray-50 flex flex-col"
                style={scrollbarHiddenStyle}
              >
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => setSelectedMinute(minute)}
                    data-selected={selectedMinute === minute}
                    className={`
                      py-2 px-2 text-center font-semibold text-sm transition
                      ${selectedMinute === minute
                        ? 'bg-[#143A80] text-white'
                        : 'text-gray-700 hover:bg-blue-100'
                      }
                    `}
                  >
                    {String(minute).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSelectTime}
              className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-[#143A80] rounded-lg hover:bg-[#0E2C66] transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
