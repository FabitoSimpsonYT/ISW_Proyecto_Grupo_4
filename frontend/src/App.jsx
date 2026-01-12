import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DeviceProvider } from './context/DeviceContext';
import { DeviceDebugInfo } from './components/DeviceDebugInfo';
import InscribirSlotsAlumno from './pages/InscribirSlotAlumno.jsx';
import PautaPage from './pages/PautaPage.jsx';
import CrearEditarPautaPage from './pages/CrearEditarPautaPage.jsx';
import Login from './pages/Login.jsx';
import GestionRamosPage from './pages/GestionRamosPage.jsx';
import EvaluacionPage from './pages/EvaluacionPage.jsx';
import BloqueoPage from './pages/BloqueoPage.jsx';
import TiposEventos from './pages/TiposEventos.jsx';
import CrearIntegradoraPage from './pages/CrearIntegradoraPage.jsx';
import NotificationBell from './components/NotificationBell.jsx';

function App() {
  return (
    <DeviceProvider>
      <>
        <Toaster 
          position="top-right" 
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <DeviceDebugInfo />
        <NotificationBell />
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/evaluacion/:codigoRamo/crear-integradora" element={<CrearIntegradoraPage />} />
          <Route path="/evaluacion/:evaluacionId/pauta/:pautaId" element={<CrearEditarPautaPage />} />
          <Route path="/evaluacion/:evaluacionId/pauta" element={<CrearEditarPautaPage />} />
          <Route path="/pautas/:evaluacionId" element={<PautaPage />} />
          <Route path="/pautas" element={<PautaPage />} />
          <Route path="/ramos" element={<GestionRamosPage />} />
          <Route path="/evaluaciones" element={<EvaluacionPage />} />
          <Route path="/bloqueos" element={<BloqueoPage />} />
          <Route path="/tipos-eventos" element={<TiposEventos />} />
          <Route path="/inscribir-slots" element={<InscribirSlotsAlumno />} />
          </Routes>
        </BrowserRouter>
      </>
    </DeviceProvider>
  );
}

export default App;
