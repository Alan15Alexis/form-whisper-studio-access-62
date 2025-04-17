
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, FormFieldType, FormFieldOption } from "@/types/form";
import { Trash, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import FieldOptionsEditor from "./form-builder/FieldOptionsEditor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FormFieldEditorProps {
  field: FormField;
  onChange: (updatedField: FormField) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

const FormFieldEditor = ({ field, onChange, onDelete, isDragging }: FormFieldEditorProps) => {
  const [showOptions, setShowOptions] = useState(
    field.type === 'select' || 
    field.type === 'radio' || 
    field.type === 'checkbox' || 
    field.type === 'image-select' || 
    field.type === 'matrix' || 
    field.type === 'opinion-scale' || 
    field.type === 'star-rating' || 
    field.type === 'ranking'
  );

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...field,
      label: e.target.value
    });
  };

  const handleRequiredChange = (checked: boolean) => {
    onChange({
      ...field,
      required: checked
    });
  };

  const handleOptionsChange = (options: FormFieldOption[]) => {
    onChange({
      ...field,
      options
    });
  };

  return (
    <Card className={cn(
      "mb-4 border transition-all duration-300", 
      isDragging ? "shadow-md border-primary" : "shadow-sm hover:shadow",
    )}>
      <div className="p-4 flex items-center gap-3">
        <div className="cursor-grab">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <input
          type="text"
          value={field.label}
          onChange={handleLabelChange}
          className="flex-1 text-lg font-medium bg-transparent border-none p-0 focus:outline-none focus:ring-0"
          placeholder="Campo sin título"
        />

        <div className="flex items-center space-x-2">
          <Switch
            id={`field-${field.id}-required`}
            checked={field.required}
            onCheckedChange={handleRequiredChange}
          />
          <Label htmlFor={`field-${field.id}-required`}>Obligatorio</Label>
        </div>
      </div>
      
      <CardContent className="p-4 pt-0 space-y-4">
        {showOptions && (
          <FieldOptionsEditor
            options={field.options || []}
            onChange={handleOptionsChange}
          />
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" onClick={onDelete} className="ml-auto text-red-600 border-red-200 hover:bg-red-50">
          <Trash className="h-4 w-4 mr-2" /> Eliminar Campo
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FormFieldEditor;
