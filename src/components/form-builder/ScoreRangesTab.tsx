
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Plus, AlertCircle, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { ScoreRange, FormField } from "@/types/form";

interface ScoreRangesTabProps {
  formFields: FormField[];
  showTotalScore: boolean;
  onToggleFormScoring: (enabled: boolean) => void;
  onSaveScoreRanges: (ranges: ScoreRange[]) => void;
  scoreRanges: ScoreRange[];
}

// Static example score ranges that will always be displayed
const EXAMPLE_SCORE_RANGES: ScoreRange[] = [
  {
    min: 0,
    max: 25,
    message: "Resultado bajo: Necesitas mejorar en varias áreas"
  },
  {
    min: 26,
    max: 50,
    message: "Resultado medio: Vas por buen camino, pero hay espacio para mejorar"
  },
  {
    min: 51,
    max: 75,
    message: "Resultado bueno: Tienes un buen desempeño general"
  },
  {
    min: 76,
    max: 100,
    message: "Resultado excelente: ¡Felicidades! Tienes un desempeño excepcional"
  }
];

const ScoreRangesTab = ({
  formFields = [],
  showTotalScore,
  onToggleFormScoring = () => {},
  onSaveScoreRanges = () => {},
  scoreRanges
}: ScoreRangesTabProps) => {
  const [localScoreRanges, setLocalScoreRanges] = useState<ScoreRange[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const hasFieldsWithNumericValues = formFields.some(field => field.hasNumericValues);

  console.log("ScoreRangesTab - Component Rendered with props:", {
    showTotalScore,
    scoreRanges: scoreRanges?.length || 0,
    hasFieldsWithNumericValues,
    localScoreRangesCount: localScoreRanges.length,
    hasUnsavedChanges
  });

  // Initialize with example ranges if no ranges exist and always show them
  useEffect(() => {
    console.log("ScoreRangesTab - Syncing with external scoreRanges:", scoreRanges);
    
    // Ensure we always have a valid array
    const incomingRanges = Array.isArray(scoreRanges) ? scoreRanges : [];
    
    // If no external ranges exist, use example ranges
    const rangesToUse = incomingRanges.length > 0 ? incomingRanges : EXAMPLE_SCORE_RANGES;
    
    // Only update if there's actually a difference to prevent unnecessary re-renders
    const currentRangesJson = JSON.stringify(localScoreRanges);
    const rangesToUseJson = JSON.stringify(rangesToUse);
    
    if (currentRangesJson !== rangesToUseJson) {
      console.log("ScoreRangesTab - Score ranges changed, updating local state from", localScoreRanges.length, "to", rangesToUse.length);
      setLocalScoreRanges(JSON.parse(JSON.stringify(rangesToUse))); // Deep copy
      setHasUnsavedChanges(false);
    }
  }, [scoreRanges]); // Remove localScoreRanges from dependencies to avoid infinite loops

  // Score range management functions
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
    setHasUnsavedChanges(true);
    
    toast({
      title: "Rango añadido",
      description: `Se añadió un nuevo rango de puntuación. No olvides guardar los cambios.`
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
    setHasUnsavedChanges(true);
  };

  const removeScoreRange = (index: number) => {
    console.log(`ScoreRangesTab - Removing score range at index ${index}`);
    const updatedRanges = localScoreRanges.filter((_, i) => i !== index);
    
    console.log("ScoreRangesTab - Updated score ranges after removal:", updatedRanges);
    setLocalScoreRanges(updatedRanges);
    setHasUnsavedChanges(true);
    
    toast({
      title: "Rango eliminado",
      description: "El rango de puntuación ha sido eliminado. No olvides guardar los cambios."
    });
  };

  const saveScoreRanges = () => {
    console.log("ScoreRangesTab - Saving score ranges:", localScoreRanges);
    
    // Validate ranges before saving
    const validRanges = localScoreRanges.filter(range => 
      range && 
      typeof range.min === 'number' && 
      typeof range.max === 'number' && 
      typeof range.message === 'string' &&
      range.min <= range.max
    );
    
    if (validRanges.length !== localScoreRanges.length) {
      console.warn("ScoreRangesTab - Some invalid ranges were filtered out");
      toast({
        title: "Advertencia",
        description: "Algunos rangos tenían datos inválidos y fueron omitidos.",
        variant: "destructive"
      });
    }
    
    // Call parent save handler with validated ranges
    onSaveScoreRanges(validRanges);
    setHasUnsavedChanges(false);
    
    toast({
      title: "Rangos guardados",
      description: "Los rangos de puntuación han sido guardados correctamente."
    });
  };

  const handleToggleScoringFeature = async (enabled: boolean) => {
    console.log("ScoreRangesTab - handleToggleScoringFeature called with:", enabled);

    // Call the parent handler first
    if (onToggleFormScoring) {
      onToggleFormScoring(enabled);
    }

    // If enabling scoring and no ranges exist yet, add example ranges
    if (enabled && localScoreRanges.length === 0) {
      console.log("ScoreRangesTab - Adding example score ranges when enabling scoring");
      setTimeout(() => {
        setLocalScoreRanges([...EXAMPLE_SCORE_RANGES]);
        setHasUnsavedChanges(true);
      }, 100);
    }
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
              <div className="p-4 bg-primary/5 rounded-md text-sm">
                <p className="font-medium">Para habilitar la puntuación total:</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li>Ve a la pestaña "Campos"</li>
                  <li>Selecciona un campo y haz clic en el ícono de configuración</li>
                  <li>Activa "Habilitar valores numéricos"</li>
                  <li>Asigna valores numéricos a las opciones</li>
                </ol>
              </div>
            )}
            
            {/* Score Ranges Configuration - Always show now */}
            <div className="space-y-4 p-3 bg-primary/5 border rounded-md">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Rangos de puntuación y mensajes
                  {!hasFieldsWithNumericValues && (
                    <span className="text-sm text-gray-500 ml-2">(Vista previa - configura campos numéricos para activar)</span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addScoreRange} 
                    className="flex items-center gap-1"
                    disabled={!hasFieldsWithNumericValues}
                  >
                    <Plus className="h-4 w-4" /> Añadir rango
                  </Button>
                  {hasUnsavedChanges && hasFieldsWithNumericValues && (
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={saveScoreRanges} 
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" /> Guardar cambios
                    </Button>
                  )}
                </div>
              </div>

              {hasUnsavedChanges && hasFieldsWithNumericValues && (
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tienes cambios sin guardar. Haz clic en "Guardar cambios" para aplicarlos.
                  </AlertDescription>
                </Alert>
              )}
              
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
                          disabled={!hasFieldsWithNumericValues}
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
                          disabled={!hasFieldsWithNumericValues}
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
                        disabled={!hasFieldsWithNumericValues}
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-red-500 hover:text-red-700" 
                      onClick={() => removeScoreRange(index)}
                      disabled={!hasFieldsWithNumericValues}
                    >
                      <Trash className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                  </div>
                ))}

                {localScoreRanges.length === 0 && (
                  <div className="text-center p-4">
                    <p className="text-sm text-muted-foreground italic mb-3">
                      No hay rangos definidos. Añade rangos para mostrar mensajes personalizados según la puntuación.
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addScoreRange} 
                      className="mt-2"
                      disabled={!hasFieldsWithNumericValues}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Añadir primer rango
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 <strong>Pasos para usar los rangos:</strong>
                </p>
                <ol className="text-sm text-blue-700 list-decimal ml-4 mt-2">
                  <li>Configura campos con valores numéricos en la pestaña "Campos"</li>
                  <li>Activa el switch "Habilitar puntuación total y rangos" arriba</li>
                  <li>Personaliza los rangos de puntuación y sus mensajes</li>
                  <li>Haz clic en "Guardar cambios" para aplicar los rangos</li>
                  <li>Guarda el formulario con "Guardar Formulario"</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoreRangesTab;
