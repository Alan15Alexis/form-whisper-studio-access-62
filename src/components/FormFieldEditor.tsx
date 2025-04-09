
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, FormFieldType } from "@/types/form";
import { Trash, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import FieldBasicProperties from "./form-builder/FieldBasicProperties";
import FieldOptionsEditor from "./form-builder/FieldOptionsEditor";

interface FormFieldEditorProps {
  field: FormField;
  onChange: (updatedField: FormField) => void;
  onDelete: () => void;
  isDragging?: boolean;
}

const FormFieldEditor = ({ field, onChange, onDelete, isDragging }: FormFieldEditorProps) => {
  const [showOptions, setShowOptions] = useState(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox');

  const handleTypeChange = (type: FormFieldType) => {
    const needsOptions = type === 'select' || type === 'radio' || type === 'checkbox';
    setShowOptions(needsOptions);
    
    // Initialize options array if needed
    let updatedField = { ...field, type };
    if (needsOptions && (!field.options || field.options.length === 0)) {
      updatedField.options = [
        { id: '1', label: 'Option 1', value: 'option_1' },
        { id: '2', label: 'Option 2', value: 'option_2' }
      ];
    }
    
    onChange(updatedField);
  };

  const handleOptionsChange = (options: FormFieldType[]) => {
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
      <CardHeader className="p-4 pb-0 flex flex-row items-start">
        <div className="cursor-grab mr-2">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <FieldBasicProperties
          id={field.id}
          label={field.label}
          type={field.type}
          placeholder={field.placeholder || ''}
          description={field.description || ''}
          required={field.required}
          onLabelChange={(label) => onChange({ ...field, label })}
          onTypeChange={handleTypeChange}
          onPlaceholderChange={(placeholder) => onChange({ ...field, placeholder })}
          onDescriptionChange={(description) => onChange({ ...field, description })}
          onRequiredChange={(required) => onChange({ ...field, required })}
        />
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {showOptions && (
          <FieldOptionsEditor
            options={field.options || []}
            onChange={handleOptionsChange}
          />
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" onClick={onDelete} className="ml-auto text-red-600 border-red-200 hover:bg-red-50">
          <Trash className="h-4 w-4 mr-2" /> Remove Field
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FormFieldEditor;
