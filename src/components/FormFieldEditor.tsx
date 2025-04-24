
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, FormFieldType } from "@/types/form";
import { Trash, GripVertical, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FieldOptionsEditor from "./form-builder/FieldOptionsEditor";
import FieldConfigDrawer from "./form-builder/FieldConfigDrawer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { default as FormFieldPreview } from "./form-view/FormField";

const getFieldTypeName = (type: FormFieldType): string => {
  const typeNames: Record<FormFieldType, string> = {
    text: "Texto corto",
    textarea: "Texto largo",
    email: "Correo electrónico",
    number: "Número",
    date: "Fecha",
    time: "Hora",
    select: "Selección única",
    checkbox: "Casillas de verificación",
    radio: "Opciones múltiples",
    yesno: "Sí/No",
    "image-select": "Selección de imagen",
    fullname: "Nombre completo",
    phone: "Teléfono",
    address: "Dirección",
    "image-upload": "Subir imagen",
    "file-upload": "Subir archivo",
    drawing: "Dibujo",
    signature: "Firma",
    "opinion-scale": "Escala de opinión",
    "star-rating": "Calificación con estrellas",
    matrix: "Matriz",
    ranking: "Ranking",
    terms: "Términos y condiciones",
    welcome: "Mensaje de bienvenida",
    timer: "Temporizador"
  };
  
  return typeNames[type] || type;
};

interface FormFieldEditorProps {
  field: FormField;
  onChange: (updatedField: FormField) => void;
  onDelete: () => void;
  isDragging?: boolean;
  formShowTotalScore?: boolean;
  onToggleFormScoring?: (enabled: boolean) => void;
}

const FormFieldEditor = ({ 
  field, 
  onChange, 
  onDelete, 
  isDragging,
  formShowTotalScore = false,
  onToggleFormScoring = () => {}
}: FormFieldEditorProps) => {
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
  
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);

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

  const handleOptionsChange = (options: any[]) => {
    onChange({
      ...field,
      options
    });
  };

  return (
    <>
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
            placeholder={`${getFieldTypeName(field.type)} sin título`}
          />

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{getFieldTypeName(field.type)}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id={`field-${field.id}-required`}
                checked={field.required}
                onCheckedChange={handleRequiredChange}
              />
              <Label htmlFor={`field-${field.id}-required`}>Obligatorio</Label>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setConfigDrawerOpen(true)}
              className="p-0 h-8 w-8"
              title="Configuración avanzada"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CardContent className="p-4 pt-0 space-y-4">
          {showOptions && (
            <FieldOptionsEditor
              options={field.options || []}
              onChange={handleOptionsChange}
            />
          )}
          
          {field.hasNumericValues && (
            <div className="p-2 bg-primary/5 text-sm rounded-md">
              Este campo tiene valores numéricos asignados
            </div>
          )}

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm font-medium mb-2">Vista previa del campo:</div>
            <FormFieldPreview
              field={field}
              value=""
              onChange={() => {}}
            />
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button variant="outline" onClick={onDelete} className="ml-auto text-red-600 border-red-200 hover:bg-red-50">
            <Trash className="h-4 w-4 mr-2" /> Eliminar Campo
          </Button>
        </CardFooter>
      </Card>

      <FieldConfigDrawer
        field={field}
        isOpen={configDrawerOpen}
        onClose={() => setConfigDrawerOpen(false)}
        onUpdate={onChange}
        formHasScoring={formShowTotalScore}
        onToggleFormScoring={onToggleFormScoring}
      />
    </>
  );
};

export default FormFieldEditor;
