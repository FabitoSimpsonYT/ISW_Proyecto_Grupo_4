import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PautaPage from './pages/PautaPage.jsx';
import Login from './pages/Login.jsx';
import Apelaciones from "./pages/apelaciones.jsx";
import GestionRamosPage from './pages/GestionRamosPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/pautas" element={<PautaPage />} />
        <Route path="/apelaciones" element={<Apelaciones />} />
        <Route path="/ramos" element={<GestionRamosPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
