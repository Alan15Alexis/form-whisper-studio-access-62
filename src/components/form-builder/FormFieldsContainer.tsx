
import { FormField, Form } from "@/types/form";
import FormFieldEditor from "@/components/FormFieldEditor";
import { Draggable } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";
import { useFormPermissions } from "@/hooks/useFormPermissions";
import { Lock } from "lucide-react";
import StrictModeDroppable from "./StrictModeDroppable";

interface FormFieldsContainerProps {
  formData: Partial<Form>;
  fieldsArray: FormField[];
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
  formShowTotalScore?: boolean;
  onToggleFormScoring?: (enabled: boolean) => void;
}

const FormFieldsContainer = ({
  formData,
  fieldsArray,
  updateField,
  removeField,
  formShowTotalScore,
  onToggleFormScoring
}: FormFieldsContainerProps) => {
  const { canEditForm } = useFormPermissions();
  const canEdit = canEditForm(formData as Form);

  return (
    <StrictModeDroppable droppableId="FORM_FIELDS" isDropDisabled={!canEdit}>
      {(provided, snapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={cn(
            "space-y-4 min-h-[200px] p-4 rounded-lg border-2 border-dashed",
            snapshot.isDraggingOver && canEdit ? "border-primary bg-primary/5" : "border-gray-300",
            !canEdit && "bg-gray-50 opacity-75"
          )}
        >
          {fieldsArray.length > 0 ? (
            fieldsArray.map((field, index) => (
              <Draggable 
                key={field.id} 
                draggableId={field.id} 
                index={index} 
                isDragDisabled={!canEdit}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      "transition-all duration-200",
                      snapshot.isDragging && "rotate-2 scale-105 shadow-lg",
                      !canEdit && "cursor-not-allowed"
                    )}
                  >
                    <FormFieldEditor
                      key={field.id}
                      field={field}
                      onChange={(updatedField) => canEdit && updateField(field.id, updatedField)}
                      onDelete={() => canEdit && removeField(field.id)}
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
              <p className="text-gray-500 mb-2">Haz clic en un campo de la barra lateral para añadirlo</p>
              <p className="text-sm text-gray-400">O arrastra campos aquí para reordenarlos</p>
              {!canEdit && (
                <div className="flex items-center justify-center gap-2 mt-3 p-2 bg-yellow-100 rounded">
                  <Lock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">Sin permisos de edición</span>
                </div>
              )}
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </StrictModeDroppable>
  );
};

export default FormFieldsContainer;
