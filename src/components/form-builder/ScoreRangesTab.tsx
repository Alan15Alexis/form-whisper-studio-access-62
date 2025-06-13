
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Plus, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ScoreRange, FormField } from "@/types/form";

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
  const [localScoreRanges, setLocalScoreRanges] = useState<ScoreRange[]>([]);

  // Improved check for fields with numeric values
  const hasFieldsWithNumericValues = formFields.some(field => field.hasNumericValues === true);

  console.log("ScoreRangesTab - Component Rendered:", {
    showTotalScore,
    scoreRanges: scoreRanges?.length || 0,
    hasFieldsWithNumericValues,
    localScoreRangesCount: localScoreRanges.length,
    fieldsWithNumericValues: formFields.filter(f => f.hasNumericValues).map(f => ({ id: f.id, label: f.label }))
  });

  // Sync with external scoreRanges - immediate updates
  useEffect(() => {
    console.log("ScoreRangesTab - Syncing with external scoreRanges:", scoreRanges);
    
    const incomingRanges = Array.isArray(scoreRanges) ? scoreRanges : [];
    setLocalScoreRanges([...incomingRanges]); // Always sync, simple deep copy
  }, [scoreRanges]);

  // Immediate update function - no pending state
  const updateParentRanges = (newRanges: ScoreRange[]) => {
    console.log("ScoreRangesTab - Immediate update to parent:", newRanges.length);
    onSaveScoreRanges(newRanges);
  };

  const addScoreRange = () => {
    console.log("ScoreRangesTab - Adding new score range");
    let newRanges;
    if (localScoreRanges.length === 0) {
      newRanges = [{
        min: 0,
        max: 10,
        message: "Mensaje para puntuación 0-10"
      }];
    } else {
      const lastRange = localScoreRanges[localScoreRanges.length - 1];
      const newMin = lastRange ? lastRange.max + 1 : 0;
      const newMax = newMin + 10;
      newRanges = [...localScoreRanges, {
        min: newMin,
        max: newMax,
        message: `Mensaje para puntuación ${newMin}-${newMax}`
      }];
    }
    
    console.log("ScoreRangesTab - New score ranges:", newRanges);
    setLocalScoreRanges(newRanges);
    updateParentRanges(newRanges);
    
    toast({
      title: "Rango añadido",
      description: "Se añadió un nuevo rango de puntuación."
    });
  };

  const updateScoreRange = (index: number, field: keyof ScoreRange, value: string | number) => {
    console.log(`ScoreRangesTab - Updating score range at index ${index}, field ${String(field)} to value ${value}`);
    
    if (!localScoreRanges[index]) {
      console.error(`ScoreRangesTab - Score range at index ${index} does not exist`);
      return;
    }
    
    const updatedRanges = [...localScoreRanges];
    updatedRanges[index] = {
      ...updatedRanges[index],
      [field]: typeof value === 'string' ? value : Number(value)
    };
    
    console.log("ScoreRangesTab - Updated score ranges:", updatedRanges);
    setLocalScoreRanges(updatedRanges);
    updateParentRanges(updatedRanges);
  };

  const removeScoreRange = (index: number) => {
    console.log(`ScoreRangesTab - Removing score range at index ${index}`);
    const updatedRanges = localScoreRanges.filter((_, i) => i !== index);
    
    console.log("ScoreRangesTab - Updated score ranges after removal:", updatedRanges);
    setLocalScoreRanges(updatedRanges);
    updateParentRanges(updatedRanges);
    
    toast({
      title: "Rango eliminado",
      description: "El rango de puntuación ha sido eliminado."
    });
  };

  const handleToggleScoringFeature = async (enabled: boolean) => {
    console.log("ScoreRangesTab - handleToggleScoringFeature called with:", enabled);

    // Validate that fields have numeric values if enabling scoring
    if (enabled && !hasFieldsWithNumericValues) {
      console.warn("ScoreRangesTab - Cannot enable scoring: no fields with numeric values");
      toast({
        title: "No se puede habilitar puntuación",
        description: "Primero configura valores numéricos en al menos un campo desde la pestaña 'Campos'.",
        variant: "destructive"
      });
      return;
    }

    // Call the parent handler
    if (onToggleFormScoring) {
      onToggleFormScoring(enabled);
    }

    // When disabling scoring, clear ranges immediately
    if (!enabled) {
      console.log("ScoreRangesTab - Clearing score ranges when disabling scoring");
      setLocalScoreRanges([]);
      updateParentRanges([]);
    }
  };

  // Only show ranges if scoring is enabled AND there are fields with numeric values
  const shouldShowRanges = showTotalScore && hasFieldsWithNumericValues;

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
                onCheckedChange={handleToggleScoringFeature} 
                disabled={!hasFieldsWithNumericValues} 
                className="data-[state=checked]:bg-[#686df3]" 
              />
              <div>
                <Label htmlFor="show-total-score" className="text-lg font-medium">
                  Habilitar puntuación total y rangos
                </Label>
                <p className="text-sm text-gray-500">
                  {hasFieldsWithNumericValues ? 
                    "Muestra la puntuación total y mensajes personalizados al finalizar el formulario" : 
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
            
            {/* Score Ranges Configuration - Only show if scoring is enabled */}
            {shouldShowRanges && (
              <div className="space-y-4 p-3 bg-primary/5 border rounded-md">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Rangos de puntuación y mensajes
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addScoreRange} 
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Añadir rango
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {localScoreRanges.map((range, index) => (
                    <div key={`range-${index}-${range.min}-${range.max}`} className="p-3 border rounded-md bg-background">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <Label htmlFor={`min-${index}`}>Mínimo</Label>
                          <Input 
                            id={`min-${index}`} 
                            type="number" 
                            value={range.min} 
                            onChange={(e) => updateScoreRange(index, 'min', Number(e.target.value))} 
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`max-${index}`}>Máximo</Label>
                          <Input 
                            id={`max-${index}`} 
                            type="number" 
                            value={range.max} 
                            onChange={(e) => updateScoreRange(index, 'max', Number(e.target.value))} 
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`message-${index}`}>Mensaje</Label>
                        <Input 
                          id={`message-${index}`} 
                          value={range.message} 
                          onChange={(e) => updateScoreRange(index, 'message', e.target.value)} 
                          className="mt-1" 
                          placeholder="Mensaje que se mostrará para este rango de puntuación"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-red-500 hover:text-red-700" 
                        onClick={() => removeScoreRange(index)}
                      >
                        <Trash className="h-4 w-4 mr-1" /> Eliminar
                      </Button>
                    </div>
                  ))}

                  {localScoreRanges.length === 0 && (
                    <div className="text-center p-4">
                      <p className="text-sm text-muted-foreground italic mb-3">
                        No hay rangos configurados. Añade rangos para mostrar mensajes personalizados según la puntuación.
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addScoreRange} 
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Añadir primer rango
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Configuración de rangos:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 list-disc ml-4 mt-2">
                    <li>Cada rango define un mensaje que se mostrará cuando la puntuación esté en ese rango</li>
                    <li>Los rangos no deben solaparse para evitar ambigüedad</li>
                    <li>Los cambios se aplican automáticamente y se guardan con el formulario</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Information when scoring is disabled but fields have numeric values */}
            {!showTotalScore && hasFieldsWithNumericValues && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm">
                <p className="font-medium text-gray-700">La puntuación está deshabilitada</p>
                <p className="text-gray-600 mt-1">
                  Activa el switch arriba para configurar rangos de puntuación y mensajes personalizados.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoreRangesTab;
