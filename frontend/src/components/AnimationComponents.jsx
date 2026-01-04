import { motion } from 'framer-motion';
import React from 'react';

/**
 * Componente para animar entrada de página
 */
export const PageTransition = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Contenedor animado para cards
 */
export const AnimatedCard = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={`rounded-xl shadow-lg p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * Botón animado
 */
export const AnimatedButton = ({ children, onClick, variant = 'primary', className = "" }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-semibold transition-all ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
};

/**
 * Lista animada con stagger
 */
export const AnimatedList = ({ items, renderItem, className = "" }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {items.map((item, i) => (
        <motion.div key={i} variants={itemVariants}>
          {renderItem(item, i)}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Modal animado
 */
export const AnimatedModal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
        {children}
      </motion.div>
    </motion.div>
  );
};

/**
 * Badge animado para estados
 */
export const AnimatedBadge = ({ label, variant = 'success', className = "" }) => {
  const variants = {
    success: 'bg-green-100 text-green-800 border border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    danger: 'bg-red-100 text-red-800 border border-red-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-300',
  };

  return (
    <motion.span
      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${variants[variant]} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {label}
    </motion.span>
  );
};

/**
 * Tooltip con animación
 */
export const AnimatedTooltip = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      {showTooltip && (
        <motion.div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white rounded-lg whitespace-nowrap text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          {text}
        </motion.div>
      )}
    </div>
  );
};

/**
 * Componente para cargar datos con skeleton
 */
export const LoadingState = ({ isLoading, children, skeletonComponent }) => {
  return isLoading ? skeletonComponent : children;
};

export default {
  PageTransition,
  AnimatedCard,
  AnimatedButton,
  AnimatedList,
  AnimatedModal,
  AnimatedBadge,
  AnimatedTooltip,
  LoadingState,
};
