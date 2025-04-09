
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
        <Label htmlFor={`field-${id}-label`}>Etiqueta del Campo</Label>
        <Input
          id={`field-${id}-label`}
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Etiqueta del Campo"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`field-${id}-type`}>Tipo de Campo</Label>
          <Select
            value={type}
            onValueChange={(value: FormFieldType) => onTypeChange(value)}
          >
            <SelectTrigger id={`field-${id}-type`}>
              <SelectValue placeholder="Selecciona un tipo de campo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="textarea">Área de Texto</SelectItem>
              <SelectItem value="email">Correo electrónico</SelectItem>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="date">Fecha</SelectItem>
              <SelectItem value="select">Desplegable</SelectItem>
              <SelectItem value="checkbox">Casillas de verificación</SelectItem>
              <SelectItem value="radio">Botones de radio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor={`field-${id}-placeholder`}>Placeholder</Label>
          <Input
            id={`field-${id}-placeholder`}
            value={placeholder || ''}
            onChange={(e) => onPlaceholderChange(e.target.value)}
            placeholder="Texto de ayuda"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor={`field-${id}-desc`}>Descripción (Opcional)</Label>
        <Textarea
          id={`field-${id}-desc`}
          value={description || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Introduce una descripción para ayudar a los usuarios a entender este campo"
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
        <Label htmlFor={`field-${id}-required`}>Campo Obligatorio</Label>
      </div>
    </>
  );
};

export default FieldBasicProperties;
