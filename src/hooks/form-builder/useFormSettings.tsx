
import { useCallback } from 'react';
import { toast } from '@/hooks/toast';

interface UseFormSettingsProps {
  updateFormData: (updater: (prev: any) => any) => void;
  handleUpdateForm?: (formId: string, formData: any) => Promise<any>;
  formId?: string;
}

export const useFormSettings = ({ 
  updateFormData, 
  handleUpdateForm,
  formId 
}: UseFormSettingsProps) => {
  const handleAllowViewOwnResponsesChange = useCallback((allow: boolean) => {
    updateFormData(prev => ({ ...prev, allowViewOwnResponses: allow }));
  }, [updateFormData]);

  const handleAllowEditOwnResponsesChange = useCallback((allow: boolean) => {
    updateFormData(prev => ({ ...prev, allowEditOwnResponses: allow }));
  }, [updateFormData]);

  const handleFormColorChange = useCallback((color: string) => {
    updateFormData(prev => ({ ...prev, formColor: color }));
  }, [updateFormData]);

  const handleHttpConfigChange = useCallback((config: any) => {
    updateFormData(prev => ({ ...prev, httpConfig: config }));
  }, [updateFormData]);

  const handleCollaboratorsChange = useCallback(async (collaborators: string[]) => {
    console.log("useFormSettings - handleCollaboratorsChange called:", {
      newCollaborators: collaborators,
      newCount: collaborators.length,
      formId
    });
    
    const validCollaborators = Array.isArray(collaborators) 
      ? collaborators.filter(email => typeof email === 'string' && email.trim().length > 0)
      : [];
    
    console.log("useFormSettings - Setting valid collaborators:", {
      originalInput: collaborators,
      validatedOutput: validCollaborators,
      removedCount: collaborators.length - validCollaborators.length
    });
    
    updateFormData(prev => ({ 
      ...prev, 
      collaborators: validCollaborators 
    }));

    // Auto-save collaborators changes if we have a form ID and update function
    if (formId && handleUpdateForm && validCollaborators !== undefined) {
      try {
        console.log("useFormSettings - Auto-saving collaborators to database:", {
          formId,
          collaboratorsCount: validCollaborators.length
        });
        
        // Get the current form data to merge with collaborators
        updateFormData(prev => {
          const updatedFormData = {
            ...prev,
            collaborators: validCollaborators
          };
          
          // Save to database asynchronously
          handleUpdateForm(formId, updatedFormData).then(() => {
            console.log("useFormSettings - Collaborators auto-saved successfully");
          }).catch(error => {
            console.error("useFormSettings - Error auto-saving collaborators:", error);
            toast({
              title: "Error al guardar",
              description: "No se pudieron guardar los colaboradores automáticamente",
              variant: "destructive",
            });
          });
          
          return updatedFormData;
        });
        
      } catch (error) {
        console.error("useFormSettings - Error in auto-save:", error);
      }
    }
  }, [updateFormData, handleUpdateForm, formId]);

  return {
    handleAllowViewOwnResponsesChange,
    handleAllowEditOwnResponsesChange,
    handleFormColorChange,
    handleHttpConfigChange,
    handleCollaboratorsChange
  };
};
