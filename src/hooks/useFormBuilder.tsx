
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "@/contexts/form";
import { Form, FormField, HttpConfig, ScoreRange } from "@/types/form";
import { toast } from "@/components/ui/use-toast";
import { useFormFields } from "./form-builder/useFormFields";
import { useDragAndDrop } from "./form-builder/useDragAndDrop";
import { addInvitedUser, checkInvitedUserExists } from "@/integrations/supabase/client";

export const useFormBuilder = (formId?: string) => {
  const navigate = useNavigate();
  const { getForm, createForm, updateForm } = useForm();
  const isEditMode = !!formId;

  const [formData, setFormData] = useState<Partial<Form>>({
    title: '',
    description: '',
    fields: [],
    isPrivate: false,
    allowedUsers: [],
    showTotalScore: false
  });

  const [allowedUserEmail, setAllowedUserEmail] = useState<string>('');
  const [allowedUserName, setAllowedUserName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Add new field function
  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: uuidv4(),
      type: fieldType as any,
      label: 'Nueva pregunta',
      required: false
    };

    setFormData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const { handleDragEnd: handleDragDropEnd } = useDragAndDrop({
    formData,
    setFormData,
    addField
  });

  // Handle drag and drop end
  const handleDragEnd = (result: any) => {
    handleDragDropEnd(result);
  };

  // Load existing form if in edit mode
  useEffect(() => {
    if (isEditMode && formId) {
      const form = getForm(formId);
      if (form) {
        setFormData(form);
        console.log("Loaded form data:", form);
        console.log("Form has showTotalScore:", form.showTotalScore);
        console.log("Fields with score ranges:", form.fields?.filter(f => f.scoreRanges?.length > 0));
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
    console.log("Toggling form scoring to:", enabled);
    
    // Get current score ranges (if any)
    let scoreRanges: ScoreRange[] = [];
    
    // Find a field with existing score ranges
    const fieldWithRanges = formData.fields?.find(f => f.scoreRanges && f.scoreRanges.length > 0);
    
    if (fieldWithRanges?.scoreRanges) {
      scoreRanges = [...fieldWithRanges.scoreRanges];
      console.log("Using existing score ranges:", JSON.stringify(scoreRanges));
    }
    
    // Update form data with scoring enabled/disabled
    setFormData(prev => {
      // Create a copy of fields to update
      const updatedFields = prev.fields?.map(field => {
        if (field.hasNumericValues) {
          // For fields with numeric values, update score ranges accordingly
          return enabled ? { ...field, scoreRanges } : { ...field, scoreRanges: [] };
        }
        return field;
      });
      
      return { 
        ...prev, 
        showTotalScore: enabled,
        fields: updatedFields 
      };
    });
    
    // If we're in edit mode, save the form to update the database immediately
    if (isEditMode && formId) {
      setTimeout(() => {
        handleSubmit();
      }, 200);
    }
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
    
    if (updatedField.scoreRanges && updatedField.scoreRanges.length > 0 && formData.showTotalScore) {
      // When updating a field with score ranges, sync these ranges to all fields with numeric values
      const fieldsWithScoreRanges = updatedFields.map(field => {
        if (field.hasNumericValues) {
          return { ...field, scoreRanges: updatedField.scoreRanges };
        }
        return field;
      });
      
      setFormData(prev => ({
        ...prev,
        fields: fieldsWithScoreRanges
      }));
      
      // Log the score ranges for debugging
      console.log("Updated score ranges for all fields:", JSON.stringify(updatedField.scoreRanges));
      
      // Save the form if in edit mode
      if (isEditMode && formId) {
        setTimeout(() => {
          handleSubmit();
        }, 200);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        fields: updatedFields
      }));
    }
  };

  const removeField = (id: string) => {
    const updatedFields = formData.fields?.filter(field => field.id !== id) || [];
    setFormData(prev => ({
      ...prev,
      fields: updatedFields
    }));
  };

  const addAllowedUser = async () => {
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

    // Check if already in the form's allowed users list
    if (formData.allowedUsers?.includes(allowedUserEmail.toLowerCase())) {
      toast({
        title: 'Already added',
        description: 'This email is already in this form\'s allowed users list',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Add to the form's allowed users list
      const updatedAllowedUsers = [...(formData.allowedUsers || []), allowedUserEmail.toLowerCase()];
      setFormData(prev => ({ 
        ...prev, 
        allowedUsers: updatedAllowedUsers 
      }));
      
      // Add to Supabase usuario_invitado table if not already exists
      // The updated addInvitedUser function will handle checking if the user already exists
      const nombre = allowedUserName.trim() || 'Usuario Invitado';
      await addInvitedUser(nombre, allowedUserEmail.toLowerCase());
      
      // Clear inputs
      setAllowedUserEmail('');
      setAllowedUserName('');
      
      toast({
        title: 'User added',
        description: `${allowedUserEmail} has been added to allowed users`,
      });
    } catch (error) {
      console.error('Error adding invited user:', error);
      toast({
        title: 'Error',
        description: 'Could not add user to the database',
        variant: 'destructive'
      });
    }
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
      // Log the form data before saving to check score ranges
      console.log("Form data before saving:", {
        showTotalScore: formData.showTotalScore,
        fieldsWithScoreRanges: formData.fields?.filter(f => f.scoreRanges && f.scoreRanges.length > 0).map(f => ({
          fieldId: f.id,
          scoreRanges: f.scoreRanges
        }))
      });
      
      // Ensure score ranges consistency for all numeric fields
      const formDataToSave = { ...formData };
      if (formDataToSave.showTotalScore) {
        const scoreRanges = formDataToSave.fields?.find(f => f.scoreRanges && f.scoreRanges.length > 0)?.scoreRanges || [];
        if (scoreRanges.length > 0) {
          formDataToSave.fields = formDataToSave.fields?.map(field => {
            if (field.hasNumericValues) {
              return { ...field, scoreRanges };
            }
            return field;
          });
        }
        console.log("Saving form with score ranges:", JSON.stringify(scoreRanges));
      }
      
      if (isEditMode && formId) {
        await updateForm(formId, formDataToSave);
        toast({
          title: 'Form updated',
          description: 'Your form has been updated successfully',
        });
      } else {
        const newForm = await createForm(formDataToSave);
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
    allowedUserName,
    isSaving,
    isEditMode,
    handleTitleChange,
    handleDescriptionChange,
    handlePrivateChange,
    handleToggleFormScoring,
    updateField,
    removeField,
    addField,
    addAllowedUser,
    removeAllowedUser,
    handleSubmit,
    setAllowedUserEmail,
    setAllowedUserName,
    handleDragEnd,
    handleAllowViewOwnResponsesChange,
    handleAllowEditOwnResponsesChange,
    handleFormColorChange,
    handleHttpConfigChange
  };
};
