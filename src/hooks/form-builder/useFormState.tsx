
import { useState, useCallback } from 'react';
import { Form } from '@/types/form';

const createInitialFormData = (): Form => ({
  id: '',
  title: '',
  description: '',
  fields: [],
  isPrivate: false,
  allowedUsers: [],
  collaborators: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  accessLink: '',
  ownerId: '',
  formColor: '#3b82f6',
  allowViewOwnResponses: false,
  allowEditOwnResponses: false,
  showTotalScore: false,
  scoreRanges: []
});

export const useFormState = () => {
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Form>(createInitialFormData());
  const [allowedUserEmail, setAllowedUserEmail] = useState('');
  const [allowedUserName, setAllowedUserName] = useState('');

  const updateFormData = useCallback((updater: (prev: Form) => Form) => {
    setFormData(prev => {
      const updated = updater(prev);
      
      console.log("useFormState - Form data updated:", {
        fieldsCount: updated.fields?.length || 0,
        showTotalScore: updated.showTotalScore,
        collaboratorsCount: updated.collaborators?.length || 0,
        fieldIds: updated.fields?.map(f => f.id) || []
      });
      
      // Force re-render by creating a completely new object
      return {
        ...updated,
        fields: updated.fields ? [...updated.fields] : [],
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const syncFormData = useCallback((sourceForm: Form) => {
    console.log("useFormState - Syncing form data:", {
      formId: sourceForm.id,
      title: sourceForm.title,
      showTotalScore: sourceForm.showTotalScore,
      scoreRangesCount: sourceForm.scoreRanges?.length || 0,
      collaborators: sourceForm.collaborators || [],
      collaboratorsCount: sourceForm.collaborators?.length || 0,
      fieldsCount: sourceForm.fields?.length || 0
    });
    
    setFormData(prevData => {
      const newData = { 
        ...sourceForm,
        fields: Array.isArray(sourceForm.fields) ? [...sourceForm.fields] : []
      };
      
      // Ensure scoreRanges is always an array
      if (!Array.isArray(newData.scoreRanges)) {
        newData.scoreRanges = [];
      }
      
      // Enhanced collaborators handling with validation
      if (!Array.isArray(newData.collaborators)) {
        console.warn("useFormState - Invalid collaborators data, converting to array:", newData.collaborators);
        newData.collaborators = [];
      } else {
        // Filter and validate collaborators
        newData.collaborators = newData.collaborators.filter(email => 
          typeof email === 'string' && email.trim().length > 0
        );
      }
      
      // Only update if data has actually changed (deep comparison for collaborators)
      const hasChanged = JSON.stringify(prevData) !== JSON.stringify(newData);
      
      if (hasChanged) {
        console.log("useFormState - Form data updated with collaborators:", {
          collaborators: newData.collaborators,
          collaboratorsCount: newData.collaborators.length,
          fieldsCount: newData.fields.length
        });
        return newData;
      }
      
      return prevData;
    });
    
    setForm(sourceForm);
  }, []);

  return {
    form,
    setForm,
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
    formData,
    setFormData,
    updateFormData,
    syncFormData,
    allowedUserEmail,
    setAllowedUserEmail,
    allowedUserName,
    setAllowedUserName,
    createInitialFormData
  };
};
