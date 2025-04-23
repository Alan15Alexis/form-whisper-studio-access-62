
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useForm } from '@/contexts/FormContext';
import { Form, FormField, HttpConfig } from '@/types/form';
import { v4 as uuidv4 } from 'uuid';
import { useDragAndDrop } from './form-builder/useDragAndDrop';

export const useFormBuilder = (formId?: string) => {
  const navigate = useNavigate();
  const { getForm, createForm, updateForm } = useForm();
  const isEditMode = !!formId;

  const [formData, setFormData] = useState<Partial<Form>>({
    title: '',
    description: '',
    fields: [],
    isPrivate: false,
    allowedUsers: []
  });

  const [allowedUserEmail, setAllowedUserEmail] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const { handleDragEnd } = useDragAndDrop({
    formData,
    setFormData
  });

  // Load existing form if in edit mode
  useEffect(() => {
    if (isEditMode && formId) {
      const form = getForm(formId);
      if (form) {
        setFormData(form);
      } else {
        toast({
          title: 'Form not found',
          description: 'The requested form could not be found',
          variant: 'destructive'
        });
        navigate('/dashboard');
      }
    }
  }, [formId, isEditMode, getForm, navigate]);

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
    setFormData(prev => ({ ...prev, showTotalScore: enabled }));
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

  const handleHttpConfigChange = (config: HttpConfig) => {
    setFormData(prev => ({ ...prev, httpConfig: config }));
  };

  const updateField = (id: string, updatedField: FormField) => {
    const updatedFields = formData.fields?.map(field => 
      field.id === id ? { ...updatedField } : field
    ) || [];
    
    setFormData(prev => ({
      ...prev,
      fields: updatedFields
    }));
  };

  const removeField = (id: string) => {
    const updatedFields = formData.fields?.filter(field => field.id !== id) || [];
    setFormData(prev => ({
      ...prev,
      fields: updatedFields
    }));
  };

  const addAllowedUser = () => {
    if (!allowedUserEmail || allowedUserEmail.trim() === '') {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        variant: 'destructive'
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(allowedUserEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    // Check if already in the list
    if (formData.allowedUsers?.includes(allowedUserEmail)) {
      toast({
        title: 'Already added',
        description: 'This email is already in the allowed users list',
        variant: 'destructive'
      });
      return;
    }

    // Add to the list
    const updatedAllowedUsers = [...(formData.allowedUsers || []), allowedUserEmail];
    setFormData(prev => ({ 
      ...prev, 
      allowedUsers: updatedAllowedUsers 
    }));
    
    // Clear input
    setAllowedUserEmail('');
    
    toast({
      title: 'User added',
      description: `${allowedUserEmail} has been added to allowed users`,
    });
  };

  const removeAllowedUser = (email: string) => {
    const updatedAllowedUsers = formData.allowedUsers?.filter(user => user !== email) || [];
    setFormData(prev => ({ 
      ...prev, 
      allowedUsers: updatedAllowedUsers 
    }));
    
    toast({
      title: 'User removed',
      description: `${email} has been removed from allowed users`,
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || formData.title.trim() === '') {
      toast({
        title: 'Title required',
        description: 'Please provide a title for your form',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.fields || formData.fields.length === 0) {
      toast({
        title: 'Fields required',
        description: 'Please add at least one field to your form',
        variant: 'destructive'
      });
      return;
    }

    // If private, ensure there's at least one allowed user
    if (formData.isPrivate && (!formData.allowedUsers || formData.allowedUsers.length === 0)) {
      toast({
        title: 'Allowed users required',
        description: 'Please add at least one allowed user for a private form',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isEditMode && formId) {
        await updateForm(formId, formData);
        toast({
          title: 'Form updated',
          description: 'Your form has been updated successfully',
        });
      } else {
        const newForm = await createForm(formData);
        toast({
          title: 'Form created',
          description: 'Your form has been created successfully',
        });
        navigate(`/forms/${newForm.id}/edit`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    allowedUserEmail,
    isSaving,
    isEditMode,
    handleTitleChange,
    handleDescriptionChange,
    handlePrivateChange,
    handleToggleFormScoring,
    updateField,
    removeField,
    addAllowedUser,
    removeAllowedUser,
    handleSubmit,
    setAllowedUserEmail,
    handleDragEnd,
    handleAllowViewOwnResponsesChange,
    handleAllowEditOwnResponsesChange,
    handleFormColorChange,
    handleHttpConfigChange
  };
};
