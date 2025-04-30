
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { FormField } from '@/types/form';
import { BodyField } from '@/hooks/useHttpConfig';
import { getFieldTypeName } from '@/utils/http-utils';

interface HttpBodyEditorProps {
  bodyFields: BodyField[];
  formFields: FormField[];
  onAddField: () => void;
  onRemoveField: (id: number) => void;
  onFieldChange: (id: number, key: string, fieldId: string) => void;
  enabled?: boolean;
}

const HttpBodyEditor: React.FC<HttpBodyEditorProps> = ({
  bodyFields,
  formFields,
  onAddField,
  onRemoveField,
  onFieldChange,
  enabled = true,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-md font-medium">Campos del Body</Label>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          onClick={onAddField}
          disabled={!enabled}
          className="flex items-center gap-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar campo
        </Button>
      </div>
      
      <div className="space-y-3">
        {bodyFields.map((field) => (
          <div key={field.id} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Nombre del campo (ej: nombre)"
                value={field.key}
                onChange={(e) => onFieldChange(field.id, e.target.value, field.fieldId)}
                disabled={!enabled}
                className="text-sm"
              />
            </div>
            
            <div className="flex-1">
              <Select
                value={field.fieldId}
                onValueChange={(value) => onFieldChange(field.id, field.key, value)}
                disabled={!enabled}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Seleccionar campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Valor personalizado</SelectItem>
                  {formFields.map((formField) => (
                    <SelectItem key={formField.id} value={formField.id}>
                      {formField.label} ({getFieldTypeName(formField.type)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveField(field.id)}
              disabled={!enabled || bodyFields.length <= 1}
              className="flex-none"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HttpBodyEditor;
