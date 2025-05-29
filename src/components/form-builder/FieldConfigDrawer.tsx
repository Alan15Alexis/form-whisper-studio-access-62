
import { useState, useEffect } from "react";
import { FormField, FormFieldOption } from "@/types/form";
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

  // Update local state when the field prop changes
  useEffect(() => {
    setLocalField({ ...field });
  }, [field]);

  const handleClose = () => {
    // Apply changes before closing
    onUpdate({
      ...localField
    });
    onClose();
  };

  const handleToggleNumericValues = (enabled: boolean) => {
    const updatedField = { ...localField, hasNumericValues: enabled };

    // If we're enabling numeric values for the first time, initialize them
    if (enabled && localField.options && !localField.options.some(opt => opt.numericValue !== undefined)) {
      if (localField.type === 'yesno') {
        // For Yes/No fields, create default options with customizable values
        const updatedOptions = [
          { id: 'yes', label: 'Sí', value: 'yes', numericValue: 1 },
          { id: 'no', label: 'No', value: 'no', numericValue: 0 }
        ];
        updatedField.options = updatedOptions;
      } else {
        // For other field types, use existing logic
        const updatedOptions = localField.options.map((option, index) => ({
          ...option,
          numericValue: index + 1
        }));
        updatedField.options = updatedOptions;
      }
    } else if (enabled && localField.type === 'yesno' && !localField.options) {
      // If Yes/No field doesn't have options yet, create them
      const updatedOptions = [
        { id: 'yes', label: 'Sí', value: 'yes', numericValue: 1 },
        { id: 'no', label: 'No', value: 'no', numericValue: 0 }
      ];
      updatedField.options = updatedOptions;
    }

    // Update local field state
    setLocalField(updatedField);
    
    // If enabling numeric values and scoring is not enabled yet, suggest enabling scoring
    if (enabled && !formHasScoring) {
      console.log("Numeric values enabled but form scoring is off - user should enable it manually");
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

  // Check if this field type has options that can be scored
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
                <div>
                  <Label htmlFor="numeric-values" className="text-base font-medium">Habilitar valores numéricos</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Asigna puntuaciones numéricas a las opciones de este campo
                  </p>
                </div>
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
                          placeholder="Valor para Sí"
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
                          placeholder="Valor para No"
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
          
          <div className="p-3 bg-primary/5 border rounded-md text-sm">
            <p className="font-medium">¿Dónde configurar los rangos de puntuación?</p>
            <p className="mt-2">
              Los rangos de puntuación y mensajes personalizados se configuran en la pestaña "Configuración" del formulario,
              en la sección "Puntuación y Resultados". Recuerde hacer clic en "Guardar rangos" para aplicar sus cambios.
            </p>
          </div>
        </div>
        
        <SheetFooter>
          <Button onClick={handleClose}>Guardar configuración</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FieldConfigDrawer;
