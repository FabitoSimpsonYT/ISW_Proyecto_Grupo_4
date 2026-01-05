import { useAuth } from "../context/AuthContext.jsx";
import { useNavbar } from "../context/NavbarContext.jsx";
import { useNavigate } from "react-router-dom";
import { logout as logoutService } from "../services/auth.service.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiCalendar,
  FiFileText,
  FiBarChart2,
  FiBell,
  FiBook,
  FiLock,
  FiUsers,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiMessageCircle,
  FiSettings,
  FiClock,
  FiPlus,
} from "react-icons/fi";

const Navbar = () => {
  const { user, setUser } = useAuth();
  const { isNavbarOpen: isOpen, setIsNavbarOpen: setIsOpen } = useNavbar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutService();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }

    try { sessionStorage.removeItem("usuario"); } catch (e) {}
    try { localStorage.removeItem("token"); } catch (e) {}
    try { localStorage.removeItem("user"); } catch (e) {}
    try { setUser(null); } catch (e) {}

    navigate("/");
  };

  const menuItems = [
    { icon: FiHome, label: "Inicio", path: "/home", roles: ["alumno", "profesor", "admin", "jefecarrera"] },
    { icon: FiCalendar, label: "Mi Agenda", path: "/mi-agenda", roles: ["alumno", "profesor", "admin", "jefecarrera"] },
    { icon: FiBarChart2, label: "Gestión de Ramos", path: "/ramos", roles: ["admin", "jefecarrera"] },
    { icon: FiUsers, label: "Gestión de Usuarios", path: "/usuarios", roles: ["admin", "jefecarrera"] },
    // OPCIONES ALUMNO
    { icon: FiPlus, label: "Inscribir Slots", path: "/inscribir-slots", roles: ["alumno"] },
    { icon: FiFileText, label: "Mis Ramos", path: "/mis-ramos-notas", roles: ["alumno"] },
    { icon: FiMessageCircle, label: "Mis Apelaciones", path: "/apelaciones/mis", roles: ["alumno"] },
    // OPCIONES PROFESOR
    { icon: FiFileText, label: "Evaluaciones", path: "/evaluaciones", roles: ["profesor", "jefecarrera"] },
    { icon: FiMessageCircle, label: "Apelaciones", path: "/apelaciones-profesor", roles: ["profesor", "jefecarrera"] },
    { icon: FiClock, label: "Gestionar Slots", path: "/gestionar-slots", roles: ["profesor", "jefecarrera"] },
    // OPCIONES JEFE DE CARRERA
    { icon: FiLock, label: "Bloquear Días", path: "/bloqueos", roles: ["jefecarrera"] },
    // OPCIONES ADMIN/JEFE
    { icon: FiSettings, label: "Tipos de Eventos", path: "/tipos-eventos", roles: ["admin", "jefecarrera"] },
    // COMUNES
    { icon: FiBell, label: "Notificaciones", path: "/notificaciones", roles: ["alumno", "profesor", "admin", "jefecarrera"] },
    { icon: FiUser, label: "Ver Perfil", path: "/mi-perfil", roles: ["alumno", "profesor", "admin", "jefecarrera"] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  const navVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { x: -300, opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05 } }),
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <>
      {/* NAVBAR */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            variants={navVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed left-0 top-0 h-screen w-64 md:w-72 bg-gradient-to-b from-[#0E2C66] to-[#1a3f8f] text-white shadow-2xl flex flex-col p-4 md:p-6 z-40 text-sm md:text-base"
          >
            {/* CABECERA */}
            <motion.div
              className="flex items-center justify-between mb-8 shrink-0"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
                  <FiBook className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Plataforma
                </h1>
              </div>

              <motion.button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Ocultar menú"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiX className="w-6 h-6" />
              </motion.button>
            </motion.div>

            {/* USER INFO */}
            {user && (
              <motion.div
                className="mb-6 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex-shrink-0">
                    <FiUser className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{user.nombre || user.nombres}</p>
                    <p className="text-xs text-blue-200 capitalize">{user.role}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MENÚ SCROLLEABLE */}
            <motion.div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 -mr-1 no-scrollbar">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    className="px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-400/20 hover:to-blue-500/20 transition-all flex items-center gap-3 group text-left font-medium text-sm truncate border border-transparent hover:border-blue-300/30"
                    whileHover={{ x: 6 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 text-blue-200 group-hover:text-blue-100 transition-colors" />
                    <span className="group-hover:translate-x-0.5 transition-transform truncate text-blue-100 group-hover:text-white">{item.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* LOGOUT */}
            <motion.button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-semibold border border-red-500/30 mt-6 shrink-0 flex items-center justify-center gap-2 group"
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(220, 38, 38, 0.5)" }}
              whileTap={{ scale: 0.98 }}
            >
              <FiLogOut className="w-5 h-5 group-hover:animate-bounce" />
              <span>Cerrar Sesión</span>
            </motion.button>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* BOTÓN ABRIR */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="fixed left-4 top-4 z-30 p-3 bg-gradient-to-br from-[#0E2C66] to-[#1a3f8f] text-white rounded-xl hover:shadow-xl transition-all shadow-lg"
            aria-label="Abrir menú"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiMenu className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
