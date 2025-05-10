
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "@/contexts/form"; // Import with original name
import { Form, FormField, HttpConfig, ScoreRange } from "@/types/form";
import { toast } from "@/components/ui/use-toast";
import { useFormFields } from "./form-builder/useFormFields";
import { useDragAndDrop } from "./form-builder/useDragAndDrop";
import { addInvitedUser, checkInvitedUserExists } from "@/integrations/supabase/client";

export const useFormBuilder = (formId?: string) => {
  const navigate = useNavigate();
  const { getForm, createForm, updateForm } = useForm(); // Use the original imported name
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
  // Store score ranges separately to ensure they're preserved even when toggling scoring
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>([]);

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
        
        // Extract score ranges from either the scoreConfig or from fields
        if (form.scoreConfig && form.scoreConfig.ranges && form.scoreConfig.ranges.length > 0) {
          console.log("Loading score ranges from scoreConfig:", form.scoreConfig.ranges);
          setScoreRanges(form.scoreConfig.ranges);
        } else {
          const fieldWithRanges = form.fields?.find(f => f.scoreRanges?.length > 0);
          if (fieldWithRanges && fieldWithRanges.scoreRanges) {
            console.log("Loading score ranges from fields:", fieldWithRanges.scoreRanges);
            setScoreRanges(fieldWithRanges.scoreRanges);
          } else {
            // Default empty array if no ranges found
            setScoreRanges([]);
          }
        }
        
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

  // Toggle form scoring function - only updates state locally, doesn't save immediately
  const handleToggleFormScoring = (enabled: boolean) => {
    console.log("Toggle form scoring called with:", enabled);
    
    setFormData(prev => {
      // Create a copy of fields to update
      const updatedFields = prev.fields?.map(field => {
        if (field.hasNumericValues && enabled) {
          // For fields with numeric values, apply scoreRanges
          return { ...field, scoreRanges: [...scoreRanges] };
        } 
        else if (!enabled) {
          // If disabling scoring, remove score ranges
          const { scoreRanges, ...fieldWithoutRanges } = field;
          return fieldWithoutRanges;
        }
        return field;
      });
      
      return { 
        ...prev, 
        showTotalScore: enabled,
        fields: updatedFields,
        // Also update scoreConfig for consistency
        scoreConfig: enabled ? {
          enabled: true,
          ranges: scoreRanges
        } : undefined
      };
    });
  };

  // Enhanced function to explicitly save score ranges
  const handleSaveScoreRanges = (newScoreRanges: ScoreRange[]) => {
    console.log("Saving score ranges:", JSON.stringify(newScoreRanges));
    
    // Store the ranges locally for future use
    setScoreRanges(newScoreRanges);
    
    // Update all fields with numeric values to include these score ranges
    setFormData(prev => {
      // First ensure showTotalScore is set to true
      const updatedFormData = { 
        ...prev, 
        showTotalScore: true,
        // Update scoreConfig to ensure it's saved to the database
        scoreConfig: {
          enabled: true,
          ranges: newScoreRanges
        }
      };
      
      // Then update fields with numeric values
      const updatedFields = prev.fields?.map(field => {
        if (field.hasNumericValues) {
          console.log(`Adding score ranges to field ${field.id}`);
          return { ...field, scoreRanges: [...newScoreRanges] };
        }
        return field;
      });
      
      // Return updated form data with modified fields
      return {
        ...updatedFormData,
        fields: updatedFields
      };
    });
    
    // Save the form with updated score ranges - this is the ONLY place we save when modifying scores
    setTimeout(() => {
      handleSubmit(true);
    }, 200);
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

  const handleSubmit = async (skipValidation = false) => {
    // Skip validation if explicitly requested (e.g., when saving score ranges)
    if (!skipValidation) {
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
    }

    setIsSaving(true);

    try {
      // Ensure the scoreConfig is properly set with the current state
      const formToSave = {
        ...formData,
        scoreConfig: formData.showTotalScore ? {
          enabled: true,
          ranges: scoreRanges
        } : undefined
      };
      
      console.log("Saving form with scoreConfig:", formToSave.scoreConfig);
      console.log("Form showTotalScore:", formToSave.showTotalScore);
      console.log("Score ranges being saved:", JSON.stringify(scoreRanges));
      
      // Apply score ranges to fields that have numeric values
      if (formToSave.showTotalScore && scoreRanges.length > 0) {
        const updatedFields = formToSave.fields?.map(field => {
          if (field.hasNumericValues) {
            return { ...field, scoreRanges: [...scoreRanges] };
          }
          return field;
        });
        
        formToSave.fields = updatedFields;
      }
      
      if (isEditMode && formId) {
        console.log("Updating form with showTotalScore:", formToSave.showTotalScore);
        console.log("Updating form with scoreRanges:", JSON.stringify(scoreRanges));
        
        await updateForm(formId, formToSave);
        
        if (!skipValidation) {
          toast({
            title: 'Form updated',
            description: 'Your form has been updated successfully',
          });
        }
      } else {
        const newForm = await createForm(formToSave);
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
    handleSaveScoreRanges,
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
    handleHttpConfigChange,
    scoreRanges // Expose score ranges to components
  };
};
