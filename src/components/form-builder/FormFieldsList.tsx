
import { FormField, Form } from "@/types/form";
import FormFieldEditor from "@/components/FormFieldEditor";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";

interface FormFieldsListProps {
  formData: Partial<Form>;
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
}

const FormFieldsList = ({ formData, updateField, removeField }: FormFieldsListProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Campos del Formulario</h3>
      
      <Droppable droppableId="FORM_FIELDS">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "space-y-4 min-h-[200px] p-4 rounded-lg",
              snapshot.isDraggingOver && "bg-primary/5"
            )}
          >
            {formData.fields && formData.fields.length > 0 ? (
              formData.fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <FormFieldEditor
                        field={field}
                        onChange={(updatedField) => updateField(field.id, updatedField)}
                        onDelete={() => removeField(field.id)}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            ) : (
              <div className="text-center py-8 border rounded-lg border-dashed">
                <p className="text-gray-500">Arrastra campos desde la barra lateral para comenzar</p>
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
