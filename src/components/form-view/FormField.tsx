
import { type FormField as FormFieldType } from "@/types/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  field: FormFieldType;
  value: any;
  onChange: (value: any) => void;
}

const FormField = ({ field, value, onChange }: FormFieldProps) => {
  return (
    <div className="space-y-4 form-field animate-fadeIn">
      <Label htmlFor={field.id} className="font-medium text-lg">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {field.description && (
        <p className="text-sm text-gray-500 mb-2">{field.description}</p>
      )}
      
      {field.type === 'text' && (
        <Input
          id={field.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'Escriba su respuesta aquí'}
          required={field.required}
          className="w-full"
        />
      )}
      
      {field.type === 'textarea' && (
        <Textarea
          id={field.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'Escriba su respuesta aquí'}
          required={field.required}
          className="w-full min-h-[120px]"
          rows={5}
        />
      )}
      
      {field.type === 'email' && (
        <Input
          id={field.id}
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || 'correo@ejemplo.com'}
          required={field.required}
          className="w-full"
        />
      )}
      
      {field.type === 'number' && (
        <Input
          id={field.id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || '0'}
          required={field.required}
          className="w-full"
        />
      )}
      
      {field.type === 'date' && (
        <Input
          id={field.id}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full"
        />
      )}
      
      {field.type === 'select' && field.options && (
        <Select
          value={value || ''}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.placeholder || 'Seleccione una opción'} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {field.type === 'checkbox' && field.options && (
        <div className="space-y-3">
          {field.options.map((option) => {
            const isChecked = Array.isArray(value) ? value?.includes(option.value) : false;
            
            return (
              <div key={option.id} className="flex items-start space-x-2">
                <Checkbox
                  id={`${field.id}-${option.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? [...value] : [];
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v) => v !== option.value);
                    onChange(newValues);
                  }}
                  className="mt-1"
                />
                <Label 
                  htmlFor={`${field.id}-${option.id}`} 
                  className="font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>
      )}
      
      {field.type === 'radio' && field.options && (
        <RadioGroup
          value={value || ''}
          onValueChange={onChange}
          className="space-y-3"
        >
          {field.options.map((option) => (
            <div key={option.id} className="flex items-start space-x-2">
              <RadioGroupItem 
                value={option.value} 
                id={`${field.id}-${option.id}`}
                className="mt-1"
              />
              <Label 
                htmlFor={`${field.id}-${option.id}`} 
                className="font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
      
      {field.type === 'yesno' && (
        <RadioGroup
          value={value || ''}
          onValueChange={onChange}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id={`${field.id}-yes`} />
            <Label htmlFor={`${field.id}-yes`} className="font-normal cursor-pointer">
              Sí
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id={`${field.id}-no`} />
            <Label htmlFor={`${field.id}-no`} className="font-normal cursor-pointer">
              No
            </Label>
          </div>
        </RadioGroup>
      )}
    </div>
  );
};

export default FormField;
