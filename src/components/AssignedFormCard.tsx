
import { Card } from "@/components/ui/card";
import { Form } from "@/types/form";
import { useNavigate } from "react-router-dom";
import { useForm } from "@/contexts/form";
import { useState } from "react";
import ViewResponseDialog from "./ViewResponseDialog";
import AssignedFormCardHeader from "./assigned-forms/AssignedFormCardHeader";
import AssignedFormCardContent from "./assigned-forms/AssignedFormCardContent";
import AssignedFormCardActions from "./assigned-forms/AssignedFormCardActions";
import CompletionInfoDialog from "./assigned-forms/CompletionInfoDialog";

interface AssignedFormCardProps {
  form: Form;
  onRemove?: (formId: string) => void;
  isCompleted?: boolean;
  isCollaborator?: boolean;
}

const AssignedFormCard = ({ form, onRemove, isCompleted = false, isCollaborator = false }: AssignedFormCardProps) => {
  const { getFormResponses } = useForm();
  const navigate = useNavigate();
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showCompletionInfo, setShowCompletionInfo] = useState(false);
  
  // Check if form has local responses or if it's completed in the database for this user
  const hasResponded = getFormResponses(form.id).length > 0 || isCompleted;
  
  // Get form configuration for viewing and editing responses
  const canViewOwnResponses = form.allowViewOwnResponses;
  const canEditOwnResponses = form.allowEditOwnResponses;
  
  const cardStyle = form.formColor ? {
    backgroundColor: `${form.formColor}05`,
    borderLeft: `4px solid ${form.formColor}`,
    boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px ${form.formColor}20`
  } : {};

  // Handle view completion info
  const handleViewCompletionInfo = () => {
    setShowCompletionInfo(true);
  };
  
  // Handle view form response
  const handleViewResponse = () => {
    setShowResponseDialog(true);
  };
  
  // Handle edit form response
  const handleEditResponse = () => {
    if (canEditOwnResponses) {
      // Navigate to form view with edit mode param
      navigate(`/forms/${form.id}?edit=true`, { 
        state: { 
          formData: form,
          editMode: true
        } 
      });
    }
  };

  return (
    <>
      <Card 
        className="overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col h-full" 
        style={cardStyle}
      >
        <AssignedFormCardHeader form={form} isCompleted={isCompleted} />
        <AssignedFormCardContent form={form} />
        <AssignedFormCardActions 
          form={form}
          isCompleted={isCompleted}
          onRemove={onRemove}
          onViewCompletionInfo={handleViewCompletionInfo}
          onViewResponse={handleViewResponse}
          onEditResponse={handleEditResponse}
        />
      </Card>

      <CompletionInfoDialog 
        form={form}
        open={showCompletionInfo} 
        onClose={() => setShowCompletionInfo(false)} 
      />

      {showResponseDialog && (
        <ViewResponseDialog 
          formId={form.id} 
          formTitle={form.title}
          fields={form.fields}
          open={showResponseDialog} 
          onClose={() => setShowResponseDialog(false)} 
        />
      )}
    </>
  );
};

export default AssignedFormCard;
