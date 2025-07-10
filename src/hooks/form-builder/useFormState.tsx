
import { useState, useCallback, useMemo } from 'react';
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
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [allowedUserEmail, setAllowedUserEmail] = useState('');
  const [allowedUserName, setAllowedUserName] = useState('');

  // Memoize field IDs to detect actual changes
  const fieldIds = useMemo(() => 
    formData.fields?.map(f => f.id).join(',') || '', 
    [formData.fields]
  );

  const updateFormData = useCallback((updater: (prev: Form) => Form) => {
    setFormData(prev => {
      const updated = updater(prev);
      
      console.log("useFormState - Form data updated:", {
        fieldsCount: updated.fields?.length || 0,
        showTotalScore: updated.showTotalScore,
        collaboratorsCount: updated.collaborators?.length || 0,
        fieldIds: updated.fields?.map(f => f.id) || [],
        timestamp: new Date().toISOString()
      });
      
      // Create stable form data without unnecessary re-renders
      const newFormData = {
        ...updated,
        fields: updated.fields ? updated.fields.map(field => ({ ...field })) : [],
        collaborators: updated.collaborators ? [...updated.collaborators] : [],
        updatedAt: new Date().toISOString()
      };
      
      // Check if fields structure actually changed
      const newFieldIds = newFormData.fields?.map(f => f.id).join(',') || '';
      const fieldsStructureChanged = fieldIds !== newFieldIds;
      
      // Only trigger re-render when fields structure actually changes or significant data changes
      if (fieldsStructureChanged || 
          prev.showTotalScore !== newFormData.showTotalScore ||
          prev.collaborators?.length !== newFormData.collaborators?.length) {
        setUpdateTrigger(prev => prev + 1);
      }
      
      return newFormData;
    });
  }, [fieldIds]);

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
        fields: Array.isArray(sourceForm.fields) ? sourceForm.fields.map(field => ({ ...field })) : []
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
      
      // Check if sync actually brings changes
      const prevFieldIds = prevData.fields?.map(f => f.id).join(',') || '';
      const newFieldIds = newData.fields?.map(f => f.id).join(',') || '';
      
      const dataChanged = 
        prevFieldIds !== newFieldIds ||
        prevData.collaborators?.length !== newData.collaborators?.length ||
        prevData.showTotalScore !== newData.showTotalScore;
        
      if (dataChanged) {
        setUpdateTrigger(prev => prev + 1);
      }
      
      return newData;
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
    updateTrigger,
    allowedUserEmail,
    setAllowedUserEmail,
    allowedUserName,
    setAllowedUserName,
    createInitialFormData
  };
};
