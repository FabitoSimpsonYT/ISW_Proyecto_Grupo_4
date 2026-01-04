import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ value, onChange, options = [], disabled = false, className = "", label = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

  const handleSelectOption = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedLabel = options.find(opt => opt.value === value)?.label || (value || 'Seleccionar');

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
        <span className={disabled ? 'text-gray-500' : 'text-gray-700'}>{selectedLabel}</span>
        <svg className={`w-5 h-5 transition ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-[#143A80] rounded-lg shadow-2xl z-50 w-full">
          <div className="max-h-64 overflow-y-auto">
            {options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(option.value)}
                className={`
                  w-full px-4 py-3 text-left font-semibold text-sm transition border-b border-gray-100 last:border-b-0
                  ${value === option.value
                    ? 'bg-[#143A80] text-white'
                    : 'text-gray-700 hover:bg-blue-50'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
