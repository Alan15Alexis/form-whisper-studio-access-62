
import { FormFieldType } from "@/types/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FieldBasicPropertiesProps {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder: string;
  description: string;
  required: boolean;
  onLabelChange: (value: string) => void;
  onTypeChange: (value: FormFieldType) => void;
  onPlaceholderChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onRequiredChange: (value: boolean) => void;
}

const FieldBasicProperties = ({
  id,
  label,
  type,
  placeholder,
  description,
  required,
  onLabelChange,
  onTypeChange,
  onPlaceholderChange,
  onDescriptionChange,
  onRequiredChange,
}: FieldBasicPropertiesProps) => {
  return (
    <>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={`field-${id}-label`}>Field Label</Label>
        <Input
          id={`field-${id}-label`}
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Field Label"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`field-${id}-type`}>Field Type</Label>
          <Select
            value={type}
            onValueChange={(value: FormFieldType) => onTypeChange(value)}
          >
            <SelectTrigger id={`field-${id}-type`}>
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
          <Label htmlFor={`field-${id}-placeholder`}>Placeholder</Label>
          <Input
            id={`field-${id}-placeholder`}
            value={placeholder || ''}
            onChange={(e) => onPlaceholderChange(e.target.value)}
            placeholder="Placeholder text"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor={`field-${id}-desc`}>Description (Optional)</Label>
        <Textarea
          id={`field-${id}-desc`}
          value={description || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter a description to help users understand this field"
          className="resize-none"
          rows={2}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id={`field-${id}-required`}
          checked={required}
          onCheckedChange={onRequiredChange}
        />
        <Label htmlFor={`field-${id}-required`}>Required Field</Label>
      </div>
    </>
  );
};

export default FieldBasicProperties;
