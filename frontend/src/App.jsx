import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PautaPage from './pages/PautaPage.jsx';
import Login from './pages/Login.jsx'; // 👈 puedes agregar tu login también
import Apelaciones from "./pages/apelaciones.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/pautas" element={<PautaPage />} />
         <Route path="/apelaciones" element={<Apelaciones />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
