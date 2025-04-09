
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldOption } from "@/types/form";
import { Plus, Minus } from "lucide-react";

interface FieldOptionsEditorProps {
  options: FormFieldOption[];
  onChange: (options: FormFieldOption[]) => void;
}

const FieldOptionsEditor = ({ options, onChange }: FieldOptionsEditorProps) => {
  const addOption = () => {
    const newOptionId = String(options ? options.length + 1 : 1);
    const newOption: FormFieldOption = {
      id: newOptionId,
      label: `Opción ${newOptionId}`,
      value: `option_${newOptionId}`
    };
    
    onChange([...(options || []), newOption]);
  };

  const updateOption = (index: number, updatedOption: FormFieldOption) => {
    if (!options) return;
    
    const newOptions = [...options];
    newOptions[index] = updatedOption;
    
    onChange(newOptions);
  };

  const removeOption = (index: number) => {
    if (!options) return;
    
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Label>Opciones</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addOption} 
          className="h-8 px-2"
        >
          <Plus className="h-4 w-4 mr-1" /> Añadir Opción
        </Button>
      </div>
      
      <div className="space-y-2">
        {options?.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2">
            <Input
              value={option.label}
              onChange={(e) => updateOption(index, { 
                ...option, 
                label: e.target.value, 
                value: e.target.value.toLowerCase().replace(/\s+/g, '_') 
              })}
              placeholder={`Opción ${index + 1}`}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => removeOption(index)}
              disabled={options?.length === 1}
              className="px-2 h-8"
            >
              <Minus className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldOptionsEditor;
