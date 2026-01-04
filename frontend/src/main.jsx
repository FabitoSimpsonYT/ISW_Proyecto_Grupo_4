import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from '@pages/Login';
import Home from '@pages/HomeV2';
import VerApelacionCompleta from '@pages/VerApelacionCompleta';
import Apelaciones from '@pages/apelaciones';
import MisApelaciones from '@pages/MisApelaciones';
import MiAgenda from '@pages/MiAgenda';
import InscribirEvaluaciones from '@pages/InscribirEvaluaciones';
import InscribirSlotAlumno from '@pages/InscribirSlotAlumno';
import MisRamosNotasPage from '@pages/MisRamosNotasPage';
import MiPerfil from '@pages/MiPerfil';
import GestionRamosPage from '@pages/GestionRamosPage';
import GestionSeccionesPage from '@pages/GestionSeccionesPage';
import GestionUsuariosPage from '@pages/GestionUsuariosPage';
import EvaluacionPage from '@pages/EvaluacionPage';
import CrearEditarPautaPage from '@pages/CrearEditarPautaPage';
import CrearIntegradoraPage from '@pages/CrearIntegradoraPage';
import EvaluarPage from '@pages/EvaluarPage';
import NotificacionesPage from '@pages/NotificacionesPage';
import Error404 from '@pages/Error404';
import Root from '@pages/Root';
import BloqueoPage from '@pages/BloqueoPage';
import '@styles/styles.css';
import ApelacionesProfesor from './pages/ApelacionesProfesor';
import EditarApelacion from './pages/EditarApelacion';
import GestionarTiposEventos from './components/GestionarTiposEventos';
import GestionarSlotsProfesor from './components/GestionarSlotsProfesor';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <Error404 />,
    children: [

      { path: '/', element: <Login /> },
      { path: '/auth', element: <Login /> },

      { path: '/home', element: <Home /> },

      { path: '/apelaciones', element: <Apelaciones /> },
      { path: '/apelaciones/mis', element: <MisApelaciones /> },
      { path: '/apelaciones/:id/editar', element: <EditarApelacion /> },

      { path: "/apelaciones-profesor", element: <ApelacionesProfesor /> },
      { path: "/profesor/apelacion/:id", element: <VerApelacionCompleta /> },

      // MI AGENDA
      { path: '/mi-agenda', element: <MiAgenda /> },
      { path: '/inscribir-evaluaciones', element: <InscribirEvaluaciones /> },
      { path: '/inscribir-slots', element: <InscribirSlotAlumno /> },
      { path: '/bloqueos', element: <BloqueoPage /> },
      { path: '/mis-ramos-notas', element: <MisRamosNotasPage /> },

      // EVALUACIONES
      { path: '/evaluaciones', element: <EvaluacionPage /> },
      { path: '/evaluacion/:codigoRamo/crear-integradora', element: <CrearIntegradoraPage /> },
      { path: '/evaluacion/:codigoRamo/:idEvaluacion/pauta', element: <CrearEditarPautaPage /> },
      { path: '/evaluacion/:codigoRamo/:idEvaluacion/pauta/:pautaId', element: <CrearEditarPautaPage /> },
      { path: '/evaluacion/:codigoRamo/:idEvaluacion/evaluar', element: <EvaluarPage /> },
      { path: '/evaluacion/:codigoRamo/evaluar-integradora/:idEvaluacion', element: <EvaluarPage /> },

      // RETROALIMENTACIÓN

      // MI PERFIL
      { path: '/mi-perfil', element: <MiPerfil /> },

      // NOTIFICACIONES
      { path: '/notificaciones', element: <NotificacionesPage /> },

      // GESTIÓN DE RAMOS (solo admin y jefe de carrera)
      { path: '/ramos', element: <GestionRamosPage /> },
      { path: '/ramos/:codigoRamo/secciones', element: <GestionSeccionesPage /> },

      // GESTIÓN DE SLOTS (solo profesor y jefe de carrera)
      { path: '/gestionar-slots', element: <GestionarSlotsProfesor /> },
      { path: '/slots', element: <GestionarSlotsProfesor /> },

      // GESTIÓN DE TIPOS DE EVENTOS (solo admin)
      { path: '/tipos-eventos', element: <GestionarTiposEventos /> },

      // GESTIÓN DE USUARIOS (solo admin)
      { path: '/usuarios', element: <GestionUsuariosPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
