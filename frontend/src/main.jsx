import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from '@pages/Login';
import Home from '@pages/Home';
import ApelacionesPage from '@pages/ApelacionesPage';
import VerApelacionCompleta from '@pages/VerApelacionCompleta';
import Apelaciones from '@pages/apelaciones';
import MisApelaciones from '@pages/MisApelaciones';
import MiAgenda from '@pages/MiAgenda';
import GestionRamosPage from '@pages/GestionRamosPage';
import GestionUsuariosPage from '@pages/GestionUsuariosPage';
import Error404 from '@pages/Error404';
import Root from '@pages/Root';
import '@styles/styles.css';
import ApelacionesProfesor from './pages/ApelacionesProfesor';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <Error404 />,
    children: [
      // LOGIN
      { path: '/', element: <Login /> },
      { path: '/auth', element: <Login /> },

      // HOME
      { path: '/home', element: <Home /> },

      // APELACIONES (esta es la página principal de apelaciones)
      { path: '/apelaciones', element: <Apelaciones /> },

      // MIS APELACIONES (esta se muestra dentro de ApelacionesPage)
      { path: '/apelaciones/mis', element: <MisApelaciones /> },

      { path: "/apelaciones-profesor", element: <ApelacionesProfesor /> },

      { path: "/profesor/apelacion/:id", element: <VerApelacionCompleta /> },

      // MI AGENDA
      { path: '/mi-agenda', element: <MiAgenda /> },

      // GESTIÓN DE RAMOS (solo admin y jefe de carrera)
      { path: '/ramos', element: <GestionRamosPage /> },

      // GESTIÓN DE USUARIOS (solo admin)
      { path: '/usuarios', element: <GestionUsuariosPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
