
import { useCallback } from 'react';

interface UseFormSettingsProps {
  updateFormData: (updater: (prev: any) => any) => void;
}

export const useFormSettings = ({ updateFormData }: UseFormSettingsProps) => {
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

  const handleCollaboratorsChange = useCallback((collaborators: string[]) => {
    console.log("useFormSettings - handleCollaboratorsChange called:", {
      newCollaborators: collaborators,
      newCount: collaborators.length
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
  }, [updateFormData]);

  return {
    handleAllowViewOwnResponsesChange,
    handleAllowEditOwnResponsesChange,
    handleFormColorChange,
    handleHttpConfigChange,
    handleCollaboratorsChange
  };
};
