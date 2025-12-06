import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PautaPage from './pages/PautaPage.jsx';
import Login from './pages/Login.jsx'; // 👈 puedes agregar tu login también

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/pautas" element={<PautaPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
