
import { Button } from "@/components/ui/button";
import { Settings, Edit, Trash } from "lucide-react";
import { ScoreRange } from "@/types/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScoreRangesConfigurationProps {
  scoreRanges: ScoreRange[];
  onOpenModal: () => void;
  onClearRanges: () => void;
}

const ScoreRangesConfiguration = ({
  scoreRanges,
  onOpenModal,
  onClearRanges
}: ScoreRangesConfigurationProps) => {
  
  // Enhanced logging for debugging display issues
  console.log("ScoreRangesConfiguration - Component render:", {
    scoreRanges,
    scoreRangesLength: scoreRanges?.length || 0,
    scoreRangesType: typeof scoreRanges,
    isArray: Array.isArray(scoreRanges),
    hasRanges: scoreRanges && scoreRanges.length > 0,
    stringified: JSON.stringify(scoreRanges)
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium">
            Configurar rangos de puntuación
          </h3>
          <p className="text-sm text-gray-500">
            Define mensajes personalizados según la puntuación obtenida
          </p>
        </div>
        <Button 
          onClick={onOpenModal}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Configurar Rangos
        </Button>
      </div>

      <div className="border rounded-md">
        {scoreRanges && scoreRanges.length > 0 ? (
          <div>
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h4 className="font-medium">Rangos Configurados ({scoreRanges.length})</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onOpenModal}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onClearRanges}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash className="h-4 w-4" />
                  Limpiar
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rango</TableHead>
                  <TableHead>Mensaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoreRanges.map((range, index) => {
                  console.log(`ScoreRangesConfiguration - Rendering range ${index}:`, range);
                  return (
                    <TableRow key={`range-display-${index}`}>
                      <TableCell className="font-medium">
                        {range.min} - {range.max}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {range.message}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Debug information panel - remove this after fixing the issue */}
            <div className="p-3 bg-blue-50 border-t text-xs text-blue-800">
              <strong>Debug Info:</strong> Mostrando {scoreRanges.length} rango(s) | 
              Datos: {JSON.stringify(scoreRanges)}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <Settings className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">
              Aún no se configuran rangos
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Configura rangos de puntuación para mostrar mensajes personalizados
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onOpenModal}
              className="flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              Configurar Rangos
            </Button>
            
            {/* Debug information for empty state */}
            <div className="mt-4 p-3 bg-gray-50 border text-xs text-gray-600">
              <strong>Debug Info:</strong> scoreRanges = {JSON.stringify(scoreRanges)} | 
              Tipo: {typeof scoreRanges} | 
              Es Array: {Array.isArray(scoreRanges) ? 'Sí' : 'No'} | 
              Longitud: {scoreRanges?.length || 'N/A'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreRangesConfiguration;
