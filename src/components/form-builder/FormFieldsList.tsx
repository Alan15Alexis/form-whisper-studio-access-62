
import { FormField, Form } from "@/types/form";
import FormFieldEditor from "@/components/FormFieldEditor";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";
import FieldsSidebar from "./FieldsSidebar";

interface FormFieldsListProps {
  formData: Partial<Form>;
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
  onToggleFormScoring?: (enabled: boolean) => void;
  formShowTotalScore?: boolean;
  addField?: (fieldType: string) => void;
}

const FormFieldsList = ({ 
  formData, 
  updateField, 
  removeField,
  onToggleFormScoring,
  formShowTotalScore,
  addField
}: FormFieldsListProps) => {
  console.log("FormFieldsList - formShowTotalScore:", formShowTotalScore);
  
  return (
    <div className="flex gap-6">
      {/* Sidebar with draggable field types */}
      <div className="w-80 flex-shrink-0">
        <FieldsSidebar />
      </div>
      
      {/* Main form fields area */}
      <div className="flex-1 space-y-4">
        <h3 className="text-lg font-medium">Campos del Formulario</h3>
        
        <Droppable droppableId="FORM_FIELDS">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                "space-y-4 min-h-[200px] p-4 rounded-lg border-2 border-dashed",
                snapshot.isDraggingOver ? "border-primary bg-primary/5" : "border-gray-300"
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
                        className={cn(
                          "transition-all duration-200",
                          snapshot.isDragging && "rotate-2 scale-105 shadow-lg"
                        )}
                      >
                        <FormFieldEditor
                          field={field}
                          onChange={(updatedField) => updateField(field.id, updatedField)}
                          onDelete={() => removeField(field.id)}
                          isDragging={snapshot.isDragging}
                          formShowTotalScore={formShowTotalScore}
                          onToggleFormScoring={onToggleFormScoring}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">Arrastra campos desde la barra lateral para comenzar</p>
                  <p className="text-sm text-gray-400">Los campos aparecerán aquí y podrás reordenarlos arrastrándolos</p>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        
        {formShowTotalScore && formData.fields && formData.fields.some(f => f.hasNumericValues) && (
          <div className="mt-4 p-4 border rounded-lg bg-secondary/10">
            <h3 className="font-medium">Puntuación Total</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Este formulario mostrará la puntuación total y los mensajes personalizados 
              según las respuestas seleccionadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormFieldsList;
