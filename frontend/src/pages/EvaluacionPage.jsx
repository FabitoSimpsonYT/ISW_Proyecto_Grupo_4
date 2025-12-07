import { useState } from "react";
import EvaluacionList from "../components/EvaluacionList.jsx";
import EvaluacionForm from "../components/EvaluacionForm.jsx";

export default function EvaluacionPage() {
  const [selectedEvaluacion, setSelectedEvaluacion] = useState(null);
  const [reload, setReload] = useState(false);

  const handleSaved = () => {
    setSelectedEvaluacion(null);
    setReload(!reload);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">Gestión de Evaluaciones</h1>

      <EvaluacionForm evaluacionEdit={selectedEvaluacion} onSaved={handleSaved} />
      <EvaluacionList onEdit={setSelectedEvaluacion} key={reload} />
    </div>
  );
}
