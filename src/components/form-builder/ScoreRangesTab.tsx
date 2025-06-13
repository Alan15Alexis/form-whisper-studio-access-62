
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, AlertCircle, Trash, Edit } from "lucide-react";
import { ScoreRange, FormField } from "@/types/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ScoreRangesModal from "./ScoreRangesModal";

interface ScoreRangesTabProps {
  formFields: FormField[];
  showTotalScore: boolean;
  onToggleFormScoring: (enabled: boolean) => void;
  onSaveScoreRanges: (ranges: ScoreRange[]) => void;
  scoreRanges: ScoreRange[];
}

const ScoreRangesTab = ({
  formFields = [],
  showTotalScore,
  onToggleFormScoring = () => {},
  onSaveScoreRanges = () => {},
  scoreRanges
}: ScoreRangesTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Improved check for fields with numeric values
  const hasFieldsWithNumericValues = formFields.some(field => field.hasNumericValues === true);

  console.log("ScoreRangesTab - Component Rendered:", {
    showTotalScore,
    scoreRanges: scoreRanges?.length || 0,
    hasFieldsWithNumericValues,
    fieldsWithNumericValues: formFields.filter(f => f.hasNumericValues).map(f => ({ id: f.id, label: f.label }))
  });

  const validScoreRanges = Array.isArray(scoreRanges) ? scoreRanges : [];

  const handleOpenModal = () => {
    if (!hasFieldsWithNumericValues) {
      return;
    }
    setIsModalOpen(true);
  };

  const handleSaveRanges = (newRanges: ScoreRange[]) => {
    onSaveScoreRanges(newRanges);
    
    // If ranges are being saved and scoring is not enabled, enable it
    if (newRanges.length > 0 && !showTotalScore) {
      onToggleFormScoring(true);
    }
  };

  const clearAllRanges = () => {
    onSaveScoreRanges([]);
  };

  return (
    <div className="space-y-8">
      {/* Score Ranges Configuration Card */}
      <Card className="p-6 shadow-sm border border-gray-100">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-medium">Puntuación y Rangos de Mensajes</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Switch 
                id="show-total-score" 
                checked={!!showTotalScore} 
                onCheckedChange={onToggleFormScoring} 
                disabled={!hasFieldsWithNumericValues} 
                className="data-[state=checked]:bg-[#686df3]" 
              />
              <div>
                <Label htmlFor="show-total-score" className="text-lg font-medium">
                  Habilitar puntuación total
                </Label>
                <p className="text-sm text-gray-500">
                  {hasFieldsWithNumericValues ? 
                    "Muestra la puntuación total al finalizar el formulario" : 
                    "Para activar, configura valores numéricos en al menos un campo"}
                </p>
              </div>
            </div>

            {!hasFieldsWithNumericValues && (
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
            )}

            {/* Configuration Button */}
            {hasFieldsWithNumericValues && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      Configurar rangos de puntuación
                    </Label>
                    <p className="text-sm text-gray-500">
                      Define mensajes personalizados según la puntuación obtenida
                    </p>
                  </div>
                  <Button 
                    onClick={handleOpenModal}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Configurar Rangos
                  </Button>
                </div>

                {/* Ranges Table */}
                <div className="border rounded-md">
                  {validScoreRanges.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <h4 className="font-medium">Rangos Configurados</h4>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleOpenModal}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={clearAllRanges}
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
                          {validScoreRanges.map((range, index) => (
                            <TableRow key={`range-display-${index}`}>
                              <TableCell className="font-medium">
                                {range.min} - {range.max}
                              </TableCell>
                              <TableCell className="max-w-md">
                                {range.message}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
                        onClick={handleOpenModal}
                        className="flex items-center gap-1"
                      >
                        <Settings className="h-4 w-4" />
                        Configurar Rangos
                      </Button>
                    </div>
                  )}
                </div>

                {/* Information when scoring is disabled but fields have numeric values */}
                {!showTotalScore && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    <p className="font-medium text-gray-700">La puntuación está deshabilitada</p>
                    <p className="text-gray-600 mt-1">
                      Activa el switch arriba para usar los rangos configurados.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal for configuring ranges */}
      <ScoreRangesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scoreRanges={validScoreRanges}
        onSaveRanges={handleSaveRanges}
      />
    </div>
  );
};

export default ScoreRangesTab;
