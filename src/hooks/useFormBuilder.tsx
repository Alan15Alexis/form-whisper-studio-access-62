
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from '@/hooks/toast';
import { useDragAndDrop } from './form-builder/useDragAndDrop';
import { useFormState } from './form-builder/useFormState';
import { useFormFields } from './form-builder/useFormFields';
import { useFormOperations } from './form-builder/useFormOperations';
import { useFormProperties } from './form-builder/useFormProperties';
import { useUserManagement } from './form-builder/useUserManagement';
import { useFormSettings } from './form-builder/useFormSettings';
import { useFormInitialization } from './form-builder/useFormInitialization';

interface UseFormBuilderParams {
  id?: string;
}

export const useFormBuilder = (id?: string) => {
  const params = useParams<{ id: string }>();
  const formId = id || params.id;
  
  // Use focused state management
  const {
    form,
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
    formData,
    updateFormData,
    syncFormData,
    updateTrigger,
    allowedUserEmail,
    setAllowedUserEmail,
    allowedUserName,
    setAllowedUserName,
    createInitialFormData
  } = useFormState();

  // Use focused form operations
  const { handleCreateForm, handleUpdateForm } = useFormOperations();

  // Use focused field management - pass handleUpdateForm for auto-saving
  const { addField, updateField, removeField } = useFormFields({
    formData: { ...formData, id: formId || formData.id },
    updateFormData,
    handleUpdateForm: formId ? handleUpdateForm : undefined // Only enable auto-save for existing forms
  });

  const {
    handleTitleChange,
    handleDescriptionChange,
    handlePrivateChange,
    handleToggleFormScoring,
    handleSaveScoreRanges
  } = useFormProperties({ 
    formData, 
    updateFormData,
    handleUpdateForm: formId ? handleUpdateForm : undefined // Pass handleUpdateForm for auto-save
  });

  const { addAllowedUser, removeAllowedUser } = useUserManagement({
    formData,
    updateFormData,
    allowedUserEmail,
    allowedUserName,
    setAllowedUserEmail,
    setAllowedUserName
  });

  const {
    handleAllowViewOwnResponsesChange,
    handleAllowEditOwnResponsesChange,
    handleFormColorChange,
    handleHttpConfigChange,
    handleCollaboratorsChange
  } = useFormSettings({ 
    updateFormData,
    handleUpdateForm,
    formId 
  });

  useFormInitialization({
    formId,
    syncFormData,
    setIsLoading,
    createInitialFormData,
    updateFormData
  });

  const { handleDragEnd } = useDragAndDrop({
    formData,
    setFormData: updateFormData,
    addField
  });

  const isEditMode = Boolean(formId);

  const handleSubmit = useCallback(async () => {
    console.log("useFormBuilder - handleSubmit with collaborators:", {
      collaborators: formData.collaborators,
      collaboratorsCount: formData.collaborators?.length || 0
    });
    
    // Validate scoring configuration
    if (formData.showTotalScore) {
      const hasFieldsWithNumericValues = (formData.fields || []).some(field => field.hasNumericValues === true);
      
      if (!hasFieldsWithNumericValues) {
        toast({
          title: 'Error de configuración',
          description: 'No se puede guardar con puntuación habilitada sin campos con valores numéricos.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setIsSaving(true);
    
    try {
      if (isEditMode && formId) {
        await handleUpdateForm(formId, formData);
        toast({
          title: 'Formulario guardado',
          description: 'Los cambios se han guardado correctamente.',
        });
      } else {
        await handleCreateForm(formData);
      }
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditMode, formId, handleCreateForm, handleUpdateForm, setIsSaving]);

  return {
    form,
    isLoading,
    isSaving,
    formData,
    isEditMode,
    updateTrigger,
    allowedUserEmail,
    allowedUserName,
    setAllowedUserEmail,
    setAllowedUserName,
    handleTitleChange,
    handleDescriptionChange,
    handlePrivateChange,
    handleToggleFormScoring,
    handleSaveScoreRanges,
    updateField,
    removeField,
    addField,
    addAllowedUser,
    removeAllowedUser,
    handleDragEnd,
    handleAllowViewOwnResponsesChange,
    handleAllowEditOwnResponsesChange,
    handleFormColorChange,
    handleHttpConfigChange,
    handleCollaboratorsChange,
    handleSubmit,
    handleCreateForm,
    handleUpdateForm
  };
};
