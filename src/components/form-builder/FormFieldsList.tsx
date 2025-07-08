
import { FormField, Form } from "@/types/form";
import { useFormPermissions } from "@/hooks/useFormPermissions";
import FieldsSidebar from "./FieldsSidebar";
import FormFieldsHeader from "./FormFieldsHeader";
import FormFieldsContainer from "./FormFieldsContainer";
import FormCollaboratorsCard from "./FormCollaboratorsCard";
import FormScoringIndicator from "./FormScoringIndicator";
import FormFieldsDebugInfo from "./FormFieldsDebugInfo";

interface FormFieldsListProps {
  formData: Partial<Form>;
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
  onToggleFormScoring?: (enabled: boolean) => void;
  formShowTotalScore?: boolean;
  addField: (fieldType: string) => void;
  updateTrigger?: number;
}

const FormFieldsList = ({ 
  formData, 
  updateField, 
  removeField,
  onToggleFormScoring,
  formShowTotalScore,
  addField,
  updateTrigger = 0
}: FormFieldsListProps) => {
  const { canEditForm } = useFormPermissions();
  
  console.log("FormFieldsList - Rendering with:", {
    formId: formData.id,
    formShowTotalScore,
    fieldsCount: formData.fields?.length || 0,
    fieldsData: formData.fields?.map(f => ({ id: f.id, type: f.type, label: f.label })) || [],
    collaboratorsCount: formData.collaborators?.length || 0,
    collaborators: formData.collaborators || [],
    timestamp: new Date().toISOString()
  });

  const canEdit = canEditForm(formData as Form);

  // Enhanced addField wrapper with permission check and debugging
  const handleAddField = (fieldType: string) => {
    console.log("FormFieldsList - handleAddField called:", {
      fieldType,
      canEdit,
      formId: formData.id,
      currentFieldsCount: formData.fields?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!canEdit) {
      console.warn("FormFieldsList - Field addition blocked: insufficient permissions");
      return;
    }

    console.log("FormFieldsList - Proceeding with field addition");
    addField(fieldType);
  };
  
  // Ensure we have a valid fields array with stable keys
  const fieldsArray = Array.isArray(formData.fields) ? formData.fields : [];
  
  return (
    <div className="flex gap-6">
      {/* Sidebar with draggable field types */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <FieldsSidebar onAddField={handleAddField} />
        <FormCollaboratorsCard collaborators={formData.collaborators || []} />
      </div>
      
      {/* Main form fields area */}
      <div className="flex-1 space-y-4">
        <FormFieldsHeader 
          fieldsCount={fieldsArray.length} 
          formData={formData} 
        />
        
        <FormFieldsContainer
          formData={formData}
          fieldsArray={fieldsArray}
          updateField={updateField}
          removeField={removeField}
          formShowTotalScore={formShowTotalScore}
          onToggleFormScoring={onToggleFormScoring}
        />
        
        <FormScoringIndicator 
          formShowTotalScore={formShowTotalScore}
          fieldsArray={fieldsArray}
        />

        <FormFieldsDebugInfo 
          formData={formData}
          fieldsArray={fieldsArray}
        />
      </div>
    </div>
  );
};

export default FormFieldsList;
