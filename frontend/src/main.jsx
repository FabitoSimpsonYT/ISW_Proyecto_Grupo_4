import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from '@pages/Login';
import Home from '@pages/Home';
import ApelacionesPage from '@pages/ApelacionesPage';
import Apelaciones from '@pages/apelaciones';
import MisApelaciones from '@pages/MisApelaciones';
import MiAgenda from '@pages/MiAgenda';
import Error404 from '@pages/Error404';
import Root from '@pages/Root';
import '@styles/styles.css';

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

      // MI AGENDA
      { path: '/mi-agenda', element: <MiAgenda /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
