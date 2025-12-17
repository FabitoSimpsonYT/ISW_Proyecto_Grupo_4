import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from '@pages/Login';
import Home from '@pages/Home';
import ApelacionesPage from '@pages/ApelacionesPage';
import VerApelacionCompleta from '@pages/VerApelacionCompleta';
import Apelaciones from '@pages/apelaciones';
import MisApelaciones from '@pages/MisApelaciones';
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

      { path: "/profesor/apelacion/:id", element: <VerApelacionCompleta /> }

    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
