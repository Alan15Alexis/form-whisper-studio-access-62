
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Plus, AlertCircle, Save } from "lucide-react";
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if fields have numeric values configured
  const hasFieldsWithNumericValues = formFields.some(field => field.hasNumericValues === true);

  console.log("ScoreRangesManager - Rendered with:", {
    showTotalScore,
    scoreRangesCount: scoreRanges.length,
    hasFieldsWithNumericValues,
    localRangesCount: localRanges.length
  });

  // Enhanced sync with deep comparison and proper validation
  const syncRanges = useCallback((incomingRanges: ScoreRange[]) => {
    const validatedRanges = Array.isArray(incomingRanges) ? 
      incomingRanges.filter(range => 
        range && 
        typeof range.min === 'number' && 
        typeof range.max === 'number' && 
        typeof range.message === 'string' &&
        range.min <= range.max
      ) : [];
    
    const currentJson = JSON.stringify(localRanges);
    const incomingJson = JSON.stringify(validatedRanges);
    
    if (currentJson !== incomingJson) {
      console.log("ScoreRangesManager - Syncing ranges:", validatedRanges.length);
      setLocalRanges([...validatedRanges]);
      setHasUnsavedChanges(false);
      return true;
    }
    
    return false;
  }, [localRanges]);

  // Sync local state with prop changes
  useEffect(() => {
    syncRanges(scoreRanges);
  }, [scoreRanges, syncRanges]);

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
    setHasUnsavedChanges(true);
    
    toast({
      title: "Rango añadido",
      description: "Se añadió un nuevo rango. Guarda los cambios."
    });
  }, [localRanges]);

  const updateRange = useCallback((index: number, field: keyof ScoreRange, value: string | number) => {
    if (!localRanges[index]) return;
    
    const updatedRanges = [...localRanges];
    updatedRanges[index] = {
      ...updatedRanges[index],
      [field]: typeof value === 'string' ? value : Number(value)
    };
    
    setLocalRanges(updatedRanges);
    setHasUnsavedChanges(true);
  }, [localRanges]);

  const removeRange = useCallback((index: number) => {
    const updatedRanges = localRanges.filter((_, i) => i !== index);
    setLocalRanges(updatedRanges);
    setHasUnsavedChanges(true);
    
    toast({
      title: "Rango eliminado",
      description: "El rango ha sido eliminado. Guarda los cambios."
    });
  }, [localRanges]);

  const saveRanges = useCallback(() => {
    // Validate ranges before saving
    const validRanges = localRanges.filter(range => 
      range && 
      typeof range.min === 'number' && 
      typeof range.max === 'number' && 
      typeof range.message === 'string' &&
      range.min <= range.max
    );
    
    if (validRanges.length !== localRanges.length) {
      toast({
        title: "Advertencia",
        description: "Algunos rangos tenían datos inválidos y fueron omitidos.",
        variant: "destructive"
      });
    }
    
    console.log("ScoreRangesManager - Saving ranges:", validRanges.length);
    onSaveScoreRanges(validRanges);
    setHasUnsavedChanges(false);
    
    toast({
      title: "Rangos guardados",
      description: "Los rangos han sido guardados correctamente."
    });
  }, [localRanges, onSaveScoreRanges]);

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
      setHasUnsavedChanges(true);
    }
  }, [hasFieldsWithNumericValues, onToggleScoring]);

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
          
          {/* Score Ranges Configuration */}
          {showTotalScore && hasFieldsWithNumericValues && (
            <div className="space-y-4 p-3 bg-primary/5 border rounded-md">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Rangos de puntuación
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
                  {hasUnsavedChanges && (
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={saveRanges} 
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" /> Guardar
                    </Button>
                  )}
                </div>
              </div>

              {hasUnsavedChanges && (
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tienes cambios sin guardar. Haz clic en "Guardar" para aplicarlos.
                  </AlertDescription>
                </Alert>
              )}
              
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
                  💡 <strong>Configuración de rangos:</strong>
                </p>
                <ul className="text-sm text-blue-700 list-disc ml-4 mt-2">
                  <li>Define mensajes según la puntuación obtenida</li>
                  <li>Los rangos no deben solaparse</li>
                  <li>Guarda los cambios antes de guardar el formulario</li>
                </ul>
              </div>
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
