
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormField, FormFieldType, FormFieldOption } from "@/types/form";
import { Trash, GripVertical, Plus, Minus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

  const addOption = () => {
    const newOptionId = String(field.options ? field.options.length + 1 : 1);
    const newOption: FormFieldOption = {
      id: newOptionId,
      label: `Option ${newOptionId}`,
      value: `option_${newOptionId}`
    };
    
    onChange({
      ...field,
      options: [...(field.options || []), newOption]
    });
  };

  const updateOption = (index: number, updatedOption: FormFieldOption) => {
    if (!field.options) return;
    
    const newOptions = [...field.options];
    newOptions[index] = updatedOption;
    
    onChange({
      ...field,
      options: newOptions
    });
  };

  const removeOption = (index: number) => {
    if (!field.options) return;
    
    onChange({
      ...field,
      options: field.options.filter((_, i) => i !== index)
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
        
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`field-${field.id}-label`}>Field Label</Label>
          <Input
            id={`field-${field.id}-label`}
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            placeholder="Field Label"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`field-${field.id}-type`}>Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value: FormFieldType) => handleTypeChange(value)}
            >
              <SelectTrigger id={`field-${field.id}-type`}>
                <SelectValue placeholder="Select a field type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="checkbox">Checkboxes</SelectItem>
                <SelectItem value="radio">Radio Buttons</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor={`field-${field.id}-placeholder`}>Placeholder</Label>
            <Input
              id={`field-${field.id}-placeholder`}
              value={field.placeholder || ''}
              onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
              placeholder="Placeholder text"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor={`field-${field.id}-desc`}>Description (Optional)</Label>
          <Textarea
            id={`field-${field.id}-desc`}
            value={field.description || ''}
            onChange={(e) => onChange({ ...field, description: e.target.value })}
            placeholder="Enter a description to help users understand this field"
            className="resize-none"
            rows={2}
          />
        </div>
        
        {showOptions && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addOption} 
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Option
              </Button>
            </div>
            
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => updateOption(index, { ...option, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeOption(index)}
                    disabled={field.options?.length === 1}
                    className="px-2 h-8"
                  >
                    <Minus className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch
            id={`field-${field.id}-required`}
            checked={field.required}
            onCheckedChange={(checked) => onChange({ ...field, required: checked })}
          />
          <Label htmlFor={`field-${field.id}-required`}>Required Field</Label>
        </div>
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
