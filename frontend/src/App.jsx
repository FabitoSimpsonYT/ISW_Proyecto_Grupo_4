import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PautaPage from './pages/PautaPage.jsx';
import CrearEditarPautaPage from './pages/CrearEditarPautaPage.jsx';
import Login from './pages/Login.jsx';
import Apelaciones from "./pages/apelaciones.jsx";
import GestionRamosPage from './pages/GestionRamosPage.jsx';
import EvaluacionPage from './pages/EvaluacionPage.jsx';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/evaluacion/:evaluacionId/pauta/:pautaId" element={<CrearEditarPautaPage />} />
        <Route path="/evaluacion/:evaluacionId/pauta" element={<CrearEditarPautaPage />} />
        <Route path="/pautas/:evaluacionId" element={<PautaPage />} />
        <Route path="/pautas" element={<PautaPage />} />
        <Route path="/apelaciones" element={<Apelaciones />} />
        <Route path="/ramos" element={<GestionRamosPage />} />
        <Route path="/evaluaciones" element={<EvaluacionPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
