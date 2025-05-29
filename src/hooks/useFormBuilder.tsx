
// Update import for toast
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@/contexts/form';
import { Form, FormField } from '@/types/form';
import { toast } from '@/hooks/toast';

interface UseFormBuilderParams {
  id?: string;
}

export const useFormBuilder = (id?: string) => {
  const params = useParams<{ id: string }>();
  const formId = id || params.id;
  const navigate = useNavigate();
  const { forms, createForm, updateForm, getForm } = useForm();
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Form>({
    id: '',
    title: '',
    description: '',
    fields: [],
    isPrivate: false,
    allowedUsers: [],
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
  const [allowedUserEmail, setAllowedUserEmail] = useState('');
  const [allowedUserName, setAllowedUserName] = useState('');

  // Initialize form data from existing form or defaults
  useEffect(() => {
    console.log("useFormBuilder - Initializing form data for formId:", formId);
    
    if (formId) {
      setIsLoading(true);
      const existingForm = getForm(formId);
      
      if (existingForm) {
        console.log("useFormBuilder - Found existing form:", existingForm.title);
        console.log("useFormBuilder - Form showTotalScore:", existingForm.showTotalScore);
        console.log("useFormBuilder - Form scoreRanges:", JSON.stringify(existingForm.scoreRanges));
        
        setForm(existingForm);
        setFormData(existingForm);
      } else {
        console.log("useFormBuilder - Form not found, redirecting to forms list");
        toast({
          title: 'Form not found',
          description: 'The form you are trying to edit does not exist.',
          variant: 'destructive',
        });
        navigate('/forms');
      }
      setIsLoading(false);
    } else {
      console.log("useFormBuilder - Initializing new form");
      const newFormData = {
        id: '',
        title: '',
        description: '',
        fields: [],
        isPrivate: false,
        allowedUsers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessLink: '',
        ownerId: '',
        formColor: '#3b82f6',
        allowViewOwnResponses: false,
        allowEditOwnResponses: false,
        showTotalScore: false,
        scoreRanges: []
      };
      
      setFormData(newFormData);
      setIsLoading(false);
    }
  }, [formId, getForm, navigate]);

  const isEditMode = Boolean(formId);

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({ ...prev, title }));
  };

  const handleDescriptionChange = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
  };

  const handlePrivateChange = (isPrivate: boolean) => {
    setFormData(prev => ({ ...prev, isPrivate }));
  };

  const handleToggleFormScoring = (enabled: boolean) => {
    console.log("useFormBuilder - handleToggleFormScoring called with:", enabled);
    
    setFormData(prev => {
      const updated = { 
        ...prev, 
        showTotalScore: enabled,
        // Clear score ranges when disabling scoring
        scoreRanges: enabled ? prev.scoreRanges : []
      };
      console.log("useFormBuilder - Updated formData showTotalScore to:", updated.showTotalScore);
      console.log("useFormBuilder - Updated formData scoreRanges to:", JSON.stringify(updated.scoreRanges));
      return updated;
    });
  };

  const handleSaveScoreRanges = (ranges: any[]) => {
    console.log("useFormBuilder - handleSaveScoreRanges called with:", JSON.stringify(ranges));
    
    setFormData(prev => {
      const updated = { ...prev, scoreRanges: ranges };
      console.log("useFormBuilder - Updated formData scoreRanges to:", JSON.stringify(updated.scoreRanges));
      return updated;
    });
  };

  const updateField = (id: string, updatedField: FormField) => {
    setFormData(prev => ({
      ...prev,
      fields: (prev.fields || []).map(field =>
        field.id === id ? updatedField : field
      ),
    }));
  };

  const removeField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      fields: (prev.fields || []).filter(field => field.id !== id),
    }));
  };

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: fieldType as any,
      label: '',
      required: false,
      options: fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox' ? [
        { id: crypto.randomUUID(), label: 'Option 1', value: 'option_1' },
        { id: crypto.randomUUID(), label: 'Option 2', value: 'option_2' }
      ] : undefined
    };

    setFormData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
    }));
  };

  const addAllowedUser = () => {
    if (!allowedUserEmail) return;

    setFormData(prev => ({
      ...prev,
      allowedUsers: [...(prev.allowedUsers || []), allowedUserEmail],
    }));
    setAllowedUserEmail('');
    setAllowedUserName('');
  };

  const removeAllowedUser = (email: string) => {
    setFormData(prev => ({
      ...prev,
      allowedUsers: (prev.allowedUsers || []).filter(user => user !== email),
    }));
  };

  const handleAllowViewOwnResponsesChange = (allow: boolean) => {
    setFormData(prev => ({ ...prev, allowViewOwnResponses: allow }));
  };

  const handleAllowEditOwnResponsesChange = (allow: boolean) => {
    setFormData(prev => ({ ...prev, allowEditOwnResponses: allow }));
  };

  const handleFormColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, formColor: color }));
  };

  const handleHttpConfigChange = (config: any) => {
    setFormData(prev => ({ ...prev, httpConfig: config }));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedFields = Array.from(formData.fields || []);
    const [movedField] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, movedField);

    setFormData(prev => ({
      ...prev,
      fields: reorderedFields,
    }));
  };

  const handleSubmit = async () => {
    console.log("useFormBuilder - handleSubmit called");
    console.log("useFormBuilder - Current formData showTotalScore:", formData.showTotalScore);
    console.log("useFormBuilder - Current formData scoreRanges:", JSON.stringify(formData.scoreRanges));
    
    setIsSaving(true);
    
    try {
      if (isEditMode && formId) {
        await handleUpdateForm(formId, formData);
      } else {
        await handleCreateForm(formData);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateForm = async (formData: Partial<Form>) => {
    try {
      setIsSaving(true);
      const newForm = await createForm(formData);
      navigate(`/form/${newForm.id}`);
      toast({
        title: 'Form created',
        description: `"${newForm.title}" has been created successfully`,
      });
    } catch (error) {
      console.error("Error creating form:", error);
      toast({
        title: 'Error creating form',
        description: 'Something went wrong while creating the form.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateForm = async (id: string, formData: Partial<Form>) => {
    try {
      setIsSaving(true);
      console.log("useFormBuilder - Updating form with data:", JSON.stringify({
        showTotalScore: formData.showTotalScore,
        scoreRanges: formData.scoreRanges
      }));
      
      await updateForm(id, formData);
      toast({
        title: 'Form updated',
        description: `"${formData.title}" has been updated successfully`,
      });
    } catch (error) {
      console.error("Error updating form:", error);
      toast({
        title: 'Error updating form',
        description: 'Something went wrong while updating the form.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    isLoading,
    isSaving,
    formData,
    isEditMode,
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
    handleSubmit,
    handleCreateForm,
    handleUpdateForm
  };
};
