import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from '@pages/Login';
import Home from '@pages/Home';
import VerApelacionCompleta from '@pages/VerApelacionCompleta';
import Apelaciones from '@pages/apelaciones';
import MisApelaciones from '@pages/MisApelaciones';
import MiAgenda from '@pages/MiAgenda';
import InscribirEvaluaciones from '@pages/InscribirEvaluaciones';
import MisRamosNotasPage from '@pages/MisRamosNotasPage';
import MiPerfil from '@pages/MiPerfil';
import GestionRamosPage from '@pages/GestionRamosPage';
import GestionSeccionesPage from '@pages/GestionSeccionesPage';
import GestionUsuariosPage from '@pages/GestionUsuariosPage';
import EvaluacionPage from '@pages/EvaluacionPage';
import CrearEditarPautaPage from '@pages/CrearEditarPautaPage';
import EvaluarPage from '@pages/EvaluarPage';
import NotificacionesPage from '@pages/NotificacionesPage';
import Error404 from '@pages/Error404';
import Root from '@pages/Root';
import BloqueoPage from '@pages/BloqueoPage';
import '@styles/styles.css';
import ApelacionesProfesor from './pages/ApelacionesProfesor';
import EditarApelacion from './pages/EditarApelacion';

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
      { path: '/bloqueos', element: <BloqueoPage /> },
      { path: '/mis-ramos-notas', element: <MisRamosNotasPage /> },

      // EVALUACIONES
      { path: '/evaluaciones', element: <EvaluacionPage /> },

      // PAUTA DE EVALUACIÓN
      { path: '/evaluacion/:codigoRamo/:idEvaluacion/pauta', element: <CrearEditarPautaPage /> },
      { path: '/evaluacion/:codigoRamo/:idEvaluacion/pauta/:pautaId', element: <CrearEditarPautaPage /> },

      // EVALUAR ESTUDIANTES
      { path: '/evaluacion/:codigoRamo/:idEvaluacion/evaluar', element: <EvaluarPage /> },

      // MI PERFIL
      { path: '/mi-perfil', element: <MiPerfil /> },

      // NOTIFICACIONES
      { path: '/notificaciones', element: <NotificacionesPage /> },

      // GESTIÓN DE RAMOS (solo admin y jefe de carrera)
      { path: '/ramos', element: <GestionRamosPage /> },
      { path: '/ramos/:codigoRamo/secciones', element: <GestionSeccionesPage /> },

      // GESTIÓN DE USUARIOS (solo admin)
      { path: '/usuarios', element: <GestionUsuariosPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
