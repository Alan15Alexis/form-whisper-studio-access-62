
import { FormField, Form } from "@/types/form";
import FormFieldEditor from "@/components/FormFieldEditor";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";
import FieldsSidebar from "./FieldsSidebar";
import { useFormPermissions } from "@/hooks/useFormPermissions";
import { AlertCircle, Lock } from "lucide-react";

interface FormFieldsListProps {
  formData: Partial<Form>;
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
  onToggleFormScoring?: (enabled: boolean) => void;
  formShowTotalScore?: boolean;
  addField: (fieldType: string) => void;
}

const FormFieldsList = ({ 
  formData, 
  updateField, 
  removeField,
  onToggleFormScoring,
  formShowTotalScore,
  addField
}: FormFieldsListProps) => {
  const { canEditForm, getUserRole, getPermissionSummary } = useFormPermissions();
  
  console.log("FormFieldsList - Rendering with:", {
    formId: formData.id,
    formShowTotalScore,
    fieldsCount: formData.fields?.length || 0,
    fieldsData: formData.fields?.map(f => ({ id: f.id, type: f.type, label: f.label })) || []
  });

  // Get permission details for debugging and UI
  const permissionSummary = formData.id ? getPermissionSummary(formData.id) : null;
  const canEdit = canEditForm(formData as Form);
  const userRole = getUserRole(formData as Form);

  console.log("FormFieldsList - Permission summary:", permissionSummary);

  // Enhanced addField wrapper with permission check and debugging
  const handleAddField = (fieldType: string) => {
    console.log("FormFieldsList - handleAddField called:", {
      fieldType,
      canEdit,
      userRole,
      formId: formData.id,
      currentFieldsCount: formData.fields?.length || 0
    });

    if (!canEdit) {
      console.warn("FormFieldsList - Field addition blocked: insufficient permissions");
      return;
    }

    console.log("FormFieldsList - Proceeding with field addition");
    addField(fieldType);
  };
  
  // Ensure we have a valid fields array
  const fieldsArray = Array.isArray(formData.fields) ? formData.fields : [];
  
  return (
    <div className="flex gap-6">
      {/* Sidebar with draggable field types */}
      <div className="w-80 flex-shrink-0">
        {canEdit ? (
          <FieldsSidebar onAddField={handleAddField} />
        ) : (
          <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-5 w-5 text-gray-500" />
              <h3 className="font-medium text-gray-700">Campos Disponibles</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Solo {userRole === 'owner' ? 'el propietario' : 'los colaboradores'} pueden añadir campos
            </p>
            {userRole === 'viewer' && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                <AlertCircle className="h-4 w-4" />
                Modo solo lectura
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Main form fields area */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Campos del Formulario</h3>
          {permissionSummary && (
            <div className="text-sm text-gray-500">
              Rol: <span className="font-medium capitalize">{userRole}</span>
              {permissionSummary.debugInfo.collaboratorCount > 0 && (
                <span className="ml-2">
                  • {permissionSummary.debugInfo.collaboratorCount} colaborador(es)
                </span>
              )}
            </div>
          )}
        </div>
        
        <Droppable droppableId="FORM_FIELDS" isDropDisabled={!canEdit}>
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
                  <Draggable key={field.id} draggableId={field.id} index={index} isDragDisabled={!canEdit}>
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
                  {canEdit ? (
                    <>
                      <p className="text-gray-500 mb-2">Arrastra campos desde la barra lateral para comenzar</p>
                      <p className="text-sm text-gray-400">Los campos aparecerán aquí y podrás reordenarlos arrastrándolos</p>
                    </>
                  ) : (
                    <>
                      <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 mb-2">Este formulario no tiene campos</p>
                      <p className="text-sm text-gray-400">
                        Solo {userRole === 'owner' ? 'el propietario' : 'los colaboradores'} pueden añadir campos
                      </p>
                    </>
                  )}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        
        {formShowTotalScore && fieldsArray.some(f => f.hasNumericValues) && (
          <div className="mt-4 p-4 border rounded-lg bg-secondary/10">
            <h3 className="font-medium">Puntuación Total</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Este formulario mostrará la puntuación total y los mensajes personalizados 
              según las respuestas seleccionadas.
            </p>
          </div>
        )}

        {/* Permission debugging info (only in development) */}
        {process.env.NODE_ENV === 'development' && permissionSummary && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
            <strong>Debug Info:</strong><br />
            Can Edit: {canEdit ? 'Yes' : 'No'}<br />
            Role: {userRole}<br />
            Owner: {permissionSummary.debugInfo.formOwner}<br />
            Collaborators: {JSON.stringify(permissionSummary.debugInfo.collaborators)}<br />
            Current User: {permissionSummary.userEmail}<br />
            Fields Count: {fieldsArray.length}<br />
            Fields: {JSON.stringify(fieldsArray.map(f => ({ id: f.id, type: f.type })))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormFieldsList;
