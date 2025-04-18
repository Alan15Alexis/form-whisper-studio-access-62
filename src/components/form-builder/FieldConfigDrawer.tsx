
import { useState, useEffect } from "react";
import { FormField, FormFieldOption, ScoreRange } from "@/types/form";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Trash, Plus } from "lucide-react";

interface FieldConfigDrawerProps {
  field: FormField;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedField: FormField) => void;
  formHasScoring: boolean;
  onToggleFormScoring: (enabled: boolean) => void;
}

const FieldConfigDrawer = ({
  field,
  isOpen,
  onClose,
  onUpdate,
  formHasScoring,
  onToggleFormScoring
}: FieldConfigDrawerProps) => {
  const [localField, setLocalField] = useState<FormField>({ ...field });
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>(field.scoreRanges || []);

  // Update local state when the field prop changes
  useEffect(() => {
    setLocalField({ ...field });
    setScoreRanges(field.scoreRanges || []);
  }, [field]);

  const handleClose = () => {
    // Apply changes before closing
    onUpdate({
      ...localField,
      scoreRanges: scoreRanges
    });
    onClose();
  };

  const handleToggleNumericValues = (enabled: boolean) => {
    setLocalField({
      ...localField,
      hasNumericValues: enabled
    });

    // If we're enabling numeric values for the first time, initialize them
    if (enabled && localField.options && !localField.options.some(opt => opt.numericValue !== undefined)) {
      const updatedOptions = localField.options.map((option, index) => ({
        ...option,
        numericValue: index + 1
      }));

      setLocalField({
        ...localField,
        hasNumericValues: enabled,
        options: updatedOptions
      });
    }
  };

  const handleOptionNumericValueChange = (index: number, value: number) => {
    if (!localField.options) return;

    const updatedOptions = [...localField.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      numericValue: value
    };

    setLocalField({
      ...localField,
      options: updatedOptions
    });
  };

  const addScoreRange = () => {
    const lastRange = scoreRanges[scoreRanges.length - 1];
    const newMin = lastRange ? lastRange.max + 1 : 0;
    const newMax = newMin + 10;
    
    setScoreRanges([
      ...scoreRanges, 
      { min: newMin, max: newMax, message: `Mensaje para puntuación ${newMin}-${newMax}` }
    ]);
  };

  const updateScoreRange = (index: number, field: keyof ScoreRange, value: string | number) => {
    const updatedRanges = [...scoreRanges];
    updatedRanges[index] = { 
      ...updatedRanges[index], 
      [field]: typeof value === 'string' ? value : Number(value)
    };
    setScoreRanges(updatedRanges);
  };

  const removeScoreRange = (index: number) => {
    setScoreRanges(scoreRanges.filter((_, i) => i !== index));
  };

  const hasOptionsToScore = localField.options && localField.options.length > 0;
  const isYesNoField = localField.type === 'yesno';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configuración del campo</SheetTitle>
          <SheetDescription>
            Configure opciones adicionales para este campo
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          {/* Numeric Values Configuration */}
          {(hasOptionsToScore || isYesNoField) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="numeric-values">Habilitar valores numéricos</Label>
                <Switch
                  id="numeric-values"
                  checked={!!localField.hasNumericValues}
                  onCheckedChange={handleToggleNumericValues}
                />
              </div>
              
              {localField.hasNumericValues && (
                <div className="space-y-3 pl-1 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Asigne un valor numérico a cada opción:
                  </p>
                  
                  {isYesNoField ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="yes-value">Sí</Label>
                        <Input
                          id="yes-value"
                          type="number"
                          value={localField.options?.[0]?.numericValue || 1}
                          onChange={(e) => handleOptionNumericValueChange(0, Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="no-value">No</Label>
                        <Input
                          id="no-value"
                          type="number"
                          value={localField.options?.[1]?.numericValue || 0}
                          onChange={(e) => handleOptionNumericValueChange(1, Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {localField.options?.map((option, index) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <div className="flex-grow">{option.label}</div>
                          <Input 
                            type="number"
                            value={option.numericValue || 0}
                            onChange={(e) => handleOptionNumericValueChange(index, Number(e.target.value))}
                            className="w-24"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Separator />
          
          {/* Form Scoring Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-total-score">Mostrar puntuación total</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Suma los valores de todas las respuestas seleccionadas
              </p>
            </div>
            <Switch
              id="show-total-score"
              checked={formHasScoring}
              onCheckedChange={onToggleFormScoring}
            />
          </div>

          {/* Score Ranges Configuration */}
          {formHasScoring && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Rangos de puntuación y mensajes</Label>
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
                {scoreRanges.map((range, index) => (
                  <div key={index} className="p-3 border rounded-md">
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

                {scoreRanges.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No hay rangos definidos. Añada rangos para mostrar mensajes personalizados según la puntuación.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <SheetFooter>
          <Button onClick={handleClose}>Guardar configuración</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FieldConfigDrawer;
