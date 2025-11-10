import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "@pages/Login";
import Home from "@pages/Home";
import Error404 from "@pages/Error404";
import Root from "@pages/Root";
import ProtectedRoute from "@components/ProtectedRoute";
import PautaPage from "@pages/PautaPage";
import EvaluacionPage from "@pages/EvaluacionPage";
import "@styles/styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <Error404 />,
    children: [
      {
        path: "/",
        element: <Login />,
      },
      {
        path: "/auth",
        element: <Login />,
      },
      {
        path: "/home",
        element: (
          <ProtectedRoute roles={["profesor", "alumno"]}>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "/pautas",
        element: (
          <ProtectedRoute roles={["profesor"]}>
            <PautaPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/evaluaciones",
        element: (
          <ProtectedRoute roles={["profesor"]}>
            <EvaluacionPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
