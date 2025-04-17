
import { FormField, Form } from "@/types/form";
import { Button } from "@/components/ui/button";
import FormFieldEditor from "@/components/FormFieldEditor";
import { Plus } from "lucide-react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";

interface FormFieldsListProps {
  formData: Partial<Form>;
  addField: (type: string) => void;
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
}

const FormFieldsList = ({ formData, addField, updateField, removeField }: FormFieldsListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Campos del Formulario</h3>
        <Button 
          type="button" 
          onClick={() => addField("text")} 
          variant="outline" 
          className="btn-minimal btn-outline"
        >
          <Plus className="mr-2 h-4 w-4" /> Añadir Campo
        </Button>
      </div>
      
      <Droppable droppableId="FORM_FIELDS">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "space-y-4 min-h-[200px] p-4 rounded-lg transition-colors",
              snapshot.isDraggingOver ? "bg-primary/5 border-2 border-dashed border-primary/20" : ""
            )}
          >
            {formData.fields && formData.fields.length > 0 ? (
              formData.fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
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
                <p className="text-gray-500 mb-4">Arrastra campos desde la barra lateral o haz clic para añadir</p>
                <Button 
                  type="button" 
                  onClick={() => addField("text")} 
                  variant="outline" 
                  className="btn-minimal btn-outline"
                >
                  <Plus className="mr-2 h-4 w-4" /> Añadir Tu Primer Campo
                </Button>
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
