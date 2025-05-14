
import React from 'react';
import { Form, FormField as FormFieldType } from "@/types/form";
import { Button } from "@/components/ui/button";
import FieldConfigDrawer from "./FieldConfigDrawer";
import { Draggable, Droppable } from "react-beautiful-dnd";
import FormField from "@/components/form-view/FormField";

interface FormFieldsListProps {
  formData: Partial<Form>;
  updateField: (id: string, field: FormFieldType) => void;
  removeField: (id: string) => void;
}

const FormFieldsList = ({ 
  formData, 
  updateField, 
  removeField,
}: FormFieldsListProps) => {
  const [openConfig, setOpenConfig] = React.useState<string | null>(null);

  const handleOpenConfig = (fieldId: string) => {
    setOpenConfig(fieldId);
  };

  const handleCloseConfig = () => {
    setOpenConfig(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Campos del formulario</h2>
      
      <Droppable droppableId="form-fields">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4"
          >
            {formData.fields && formData.fields.length > 0 ? (
              formData.fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="border rounded-md p-4 bg-white relative group"
                    >
                      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenConfig(field.id)}
                          className="text-xs h-7 px-2"
                        >
                          ⚙️ Configurar
                        </Button>
                      </div>
                      
                      <FormField
                        field={field}
                        formValues={{}}
                        onChange={() => {}}
                        errors={{}}
                        isPreview
                      />
                      
                      {/* Field configuration drawer */}
                      <FieldConfigDrawer
                        isOpen={openConfig === field.id}
                        onClose={handleCloseConfig}
                        field={field}
                        updateField={(updatedField) => updateField(field.id, updatedField)}
                        removeField={() => removeField(field.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            ) : (
              <div className="p-8 border border-dashed rounded-md text-center">
                <p className="text-gray-500">No hay campos añadidos aún. Agrega campos desde el panel derecho.</p>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default FormFieldsList;
