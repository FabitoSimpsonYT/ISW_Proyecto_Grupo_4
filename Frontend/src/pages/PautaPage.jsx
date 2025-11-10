import { useState } from "react";
import PautaList from "../components/PautaList";
import PautaForm from "../components/PautaForm";

export default function PautaPage(){
    const [selectedPauta, setSelectedPauta] = useState(null);
    const [reload, setReload] = useState(false);
    
    const handleSaved = () => {
        setSelectedPauta(null);
        setReload(!reload);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold text-center mb-6">Gestión de Pautas</h1>
            
            <PautaForm pautaEdit={selectedPauta} onSaved={handleSaved}/> 
            <PautaList onEdit={setSelectedPauta} key={reload}/>
        </div>
    );
}