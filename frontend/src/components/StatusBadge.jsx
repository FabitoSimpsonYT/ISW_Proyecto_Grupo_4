import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiClock, FiX } from 'react-icons/fi';

export const StatusBadge = ({ status, label }) => {
  const variants = {
    pending: {
      icon: FiClock,
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      dotColor: 'bg-yellow-500',
    },
    completed: {
      icon: FiCheckCircle,
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      dotColor: 'bg-green-500',
    },
    failed: {
      icon: FiX,
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dotColor: 'bg-red-500',
    },
    warning: {
      icon: FiAlertCircle,
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dotColor: 'bg-orange-500',
    },
  };

  const config = variants[status] || variants.pending;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <motion.div className={`w-2 h-2 rounded-full ${config.dotColor}`} animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </motion.div>
  );
};

export default StatusBadge;
