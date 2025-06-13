
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Plus, AlertCircle, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { ScoreRange, FormField } from "@/types/form";

interface ScoreRangesManagerProps {
  formFields: FormField[];
  showTotalScore: boolean;
  scoreRanges: ScoreRange[];
  onToggleScoring: (enabled: boolean) => void;
  onSaveScoreRanges: (ranges: ScoreRange[]) => void;
}

const ScoreRangesManager = ({
  formFields = [],
  showTotalScore,
  scoreRanges = [],
  onToggleScoring,
  onSaveScoreRanges
}: ScoreRangesManagerProps) => {
  const [localRanges, setLocalRanges] = useState<ScoreRange[]>([]);
  const [isEditingRanges, setIsEditingRanges] = useState(false);

  // Check if fields have numeric values configured
  const hasFieldsWithNumericValues = formFields.some(field => field.hasNumericValues === true);
  
  // Check if there are existing ranges in the database
  const hasExistingRanges = scoreRanges && scoreRanges.length > 0;

  console.log("ScoreRangesManager - Simple form mode:", {
    showTotalScore,
    hasExistingRanges,
    scoreRangesCount: scoreRanges.length,
    isEditingRanges
  });

  // Initialize local ranges when starting to edit or when props change
  useEffect(() => {
    if (isEditingRanges) {
      setLocalRanges([...scoreRanges]);
    }
  }, [isEditingRanges, scoreRanges]);

  // Sync changes back to parent component immediately (for form saving)
  useEffect(() => {
    if (isEditingRanges) {
      onSaveScoreRanges(localRanges);
    }
  }, [localRanges, isEditingRanges, onSaveScoreRanges]);

  const addRange = useCallback(() => {
    let newRanges;
    if (localRanges.length === 0) {
      newRanges = [{
        min: 0,
        max: 10,
        message: "Mensaje para puntuación 0-10"
      }];
    } else {
      const lastRange = localRanges[localRanges.length - 1];
      const newMin = lastRange.max + 1;
      const newMax = newMin + 10;
      newRanges = [...localRanges, {
        min: newMin,
        max: newMax,
        message: `Mensaje para puntuación ${newMin}-${newMax}`
      }];
    }
    
    setLocalRanges(newRanges);
  }, [localRanges]);

  const updateRange = useCallback((index: number, field: keyof ScoreRange, value: string | number) => {
    if (!localRanges[index]) return;
    
    const updatedRanges = [...localRanges];
    updatedRanges[index] = {
      ...updatedRanges[index],
      [field]: typeof value === 'string' ? value : Number(value)
    };
    
    setLocalRanges(updatedRanges);
  }, [localRanges]);

  const removeRange = useCallback((index: number) => {
    const updatedRanges = localRanges.filter((_, i) => i !== index);
    setLocalRanges(updatedRanges);
  }, [localRanges]);

  const handleToggleScoring = useCallback((enabled: boolean) => {
    if (enabled && !hasFieldsWithNumericValues) {
      toast({
        title: "No se puede habilitar puntuación",
        description: "Configura valores numéricos en al menos un campo primero.",
        variant: "destructive"
      });
      return;
    }

    onToggleScoring(enabled);

    if (!enabled) {
      setLocalRanges([]);
      setIsEditingRanges(false);
    }
  }, [hasFieldsWithNumericValues, onToggleScoring]);

  const startEditingRanges = () => {
    setLocalRanges([...scoreRanges]);
    setIsEditingRanges(true);
  };

  const cancelEditingRanges = () => {
    setLocalRanges([]);
    setIsEditingRanges(false);
  };

  return (
    <Card className="p-6 shadow-sm border border-gray-100">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-medium">Puntuación y Rangos</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="space-y-6">
          {/* Toggle Switch */}
          <div className="flex items-center space-x-4">
            <Switch 
              id="enable-scoring" 
              checked={showTotalScore} 
              onCheckedChange={handleToggleScoring} 
              disabled={!hasFieldsWithNumericValues} 
              className="data-[state=checked]:bg-[#686df3]" 
            />
            <div>
              <Label htmlFor="enable-scoring" className="text-lg font-medium">
                Habilitar puntuación total
              </Label>
              <p className="text-sm text-gray-500">
                {hasFieldsWithNumericValues ? 
                  "Muestra la puntuación total y mensajes personalizados" : 
                  "Configura valores numéricos en campos para activar"}
              </p>
            </div>
          </div>

          {/* Help message when no numeric fields */}
          {!hasFieldsWithNumericValues && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="font-medium text-amber-800">Para habilitar la puntuación:</p>
              </div>
              <ol className="list-decimal ml-5 mt-2 space-y-1 text-amber-700">
                <li>Ve a la pestaña "Campos"</li>
                <li>Configura un campo y activa "Habilitar valores numéricos"</li>
                <li>Asigna valores numéricos a las opciones</li>
              </ol>
            </div>
          )}
          
          {/* Show existing ranges or edit button */}
          {showTotalScore && hasFieldsWithNumericValues && (
            <div className="space-y-4 p-3 bg-primary/5 border rounded-md">
              {!isEditingRanges ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">
                      Rangos de puntuación
                    </Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={startEditingRanges}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" /> 
                      {hasExistingRanges ? 'Editar rangos' : 'Configurar rangos'}
                    </Button>
                  </div>

                  {hasExistingRanges ? (
                    <div className="space-y-2">
                      {scoreRanges.map((range, index) => (
                        <div key={index} className="p-3 border rounded-md bg-background">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {range.min} - {range.max} puntos
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{range.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-sm text-muted-foreground italic">
                        No hay rangos configurados. Haz clic en "Configurar rangos" para añadir.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">
                      Configurar rangos de puntuación
                    </Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addRange} 
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" /> Añadir rango
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={cancelEditingRanges}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {localRanges.map((range, index) => (
                      <div key={`range-${index}-${range.min}-${range.max}`} className="p-3 border rounded-md bg-background">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label htmlFor={`min-${index}`}>Mínimo</Label>
                            <Input 
                              id={`min-${index}`} 
                              type="number" 
                              value={range.min} 
                              onChange={(e) => updateRange(index, 'min', Number(e.target.value))} 
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`max-${index}`}>Máximo</Label>
                            <Input 
                              id={`max-${index}`} 
                              type="number" 
                              value={range.max} 
                              onChange={(e) => updateRange(index, 'max', Number(e.target.value))} 
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`message-${index}`}>Mensaje</Label>
                          <Input 
                            id={`message-${index}`} 
                            value={range.message} 
                            onChange={(e) => updateRange(index, 'message', e.target.value)} 
                            className="mt-1" 
                            placeholder="Mensaje para este rango de puntuación"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-red-500 hover:text-red-700" 
                          onClick={() => removeRange(index)}
                        >
                          <Trash className="h-4 w-4 mr-1" /> Eliminar
                        </Button>
                      </div>
                    ))}

                    {localRanges.length === 0 && (
                      <div className="text-center p-4">
                        <p className="text-sm text-muted-foreground italic mb-3">
                          No hay rangos configurados. Añade rangos para mostrar mensajes personalizados.
                        </p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={addRange} 
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Añadir primer rango
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Nota:</strong> Los rangos se guardarán cuando presiones "Guardar" en el formulario principal.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Information when scoring is disabled */}
          {!showTotalScore && hasFieldsWithNumericValues && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm">
              <p className="font-medium text-gray-700">La puntuación está deshabilitada</p>
              <p className="text-gray-600 mt-1">
                Activa el switch arriba para configurar rangos de puntuación.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreRangesManager;
