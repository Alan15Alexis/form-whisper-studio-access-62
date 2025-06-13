
import { AlertCircle } from "lucide-react";

const ScoreRangesWarning = () => {
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <p className="font-medium text-amber-800">Para habilitar la puntuación total:</p>
      </div>
      <ol className="list-decimal ml-5 mt-2 space-y-1 text-amber-700">
        <li>Ve a la pestaña "Campos"</li>
        <li>Selecciona un campo y haz clic en el ícono de configuración</li>
        <li>Activa "Habilitar valores numéricos"</li>
        <li>Asigna valores numéricos a las opciones</li>
      </ol>
    </div>
  );
};

export default ScoreRangesWarning;
