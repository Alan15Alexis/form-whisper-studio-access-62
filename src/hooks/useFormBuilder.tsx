
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "@/contexts/form"; // Keep the original import name
import { Form, FormField, HttpConfig, ScoreRange } from "@/types/form";
import { toast } from "@/hooks/use-toast";
import { useFormFields } from "./form-builder/useFormFields";
import { useDragAndDrop } from "./form-builder/useDragAndDrop";
import { addInvitedUser, checkInvitedUserExists, supabase } from "@/integrations/supabase/client";

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
    showTotalScore: false,
    scoreConfig: {
      enabled: false,
      ranges: []
    },
    scoreRanges: [] // Initialize the property
  });

  const [allowedUserEmail, setAllowedUserEmail] = useState<string>('');
  const [allowedUserName, setAllowedUserName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // Store score ranges separately to ensure they're preserved even when toggling scoring
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>([]);
  // Add state to track scoring being enabled
  const [isScoringEnabled, setIsScoringEnabled] = useState<boolean>(false);

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
        
        // Update our local state for scoring enabled - Fix: Use boolean conversion to ensure proper type
        setIsScoringEnabled(form.showTotalScore === true);
        
        // Extract score ranges from the form's scoreConfig
        if (form.scoreConfig && form.scoreConfig.ranges && form.scoreConfig.ranges.length > 0) {
          console.log("Loading score ranges from scoreConfig:", form.scoreConfig.ranges);
          setScoreRanges(form.scoreConfig.ranges);
        } else if (form.scoreRanges && form.scoreRanges.length > 0) {
          // Backward compatibility: check for direct scoreRanges property
          console.log("Loading score ranges from direct scoreRanges property:", form.scoreRanges);
          setScoreRanges(form.scoreRanges);
        } else {
          // Default empty array if no ranges found
          setScoreRanges([]);
        }
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

  // New function: direct Supabase update to ensure settings are saved
  const saveSettingsDirectlyToSupabase = async (formTitle: string, showTotalScore: boolean, scoreRangesData: ScoreRange[]) => {
    try {
      // Find the form by title
      const { data: existingForm, error: findError } = await supabase
        .from('formulario_construccion')
        .select('id, configuracion, preguntas')
        .eq('titulo', formTitle)
        .maybeSingle();
        
      if (findError) {
        console.error("Error finding form:", findError);
        return false;
      }
      
      if (!existingForm) {
        console.error("Form not found:", formTitle);
        return false;
      }
      
      // Get current configuration or create new one
      let currentConfig = existingForm.configuracion || {};
      
      // CRITICAL FIX: Make sure we set the showTotalScore as true/false explicitly
      // FIXED: Create a deep copy of scoreRangesData to avoid reference issues
      const scoreRangesCopy = JSON.parse(JSON.stringify(scoreRangesData));
      
      const updatedConfig = {
        ...currentConfig,
        showTotalScore: showTotalScore === true, // Ensure it's a boolean
        scoreRanges: scoreRangesCopy // Use the deep copy
      };
      
      console.log("Saving directly to Supabase - updatedConfig:", JSON.stringify(updatedConfig));
      console.log("showTotalScore value being saved:", showTotalScore === true);
      console.log("scoreRanges being saved:", JSON.stringify(scoreRangesCopy));
      
      // Get current fields and ensure scoreRanges are removed before saving
      const currentFields = existingForm.preguntas || [];
      const fieldsWithoutRanges = currentFields.map(field => {
        // Use destructuring to remove scoreRanges property
        const { scoreRanges, ...fieldWithoutRanges } = field;
        return fieldWithoutRanges;
      });
      
      // Update the database record
      const { error: updateError } = await supabase
        .from('formulario_construccion')
        .update({
          configuracion: updatedConfig,
          preguntas: fieldsWithoutRanges
        })
        .eq('id', existingForm.id);
        
      if (updateError) {
        console.error("Error updating form:", updateError);
        return false;
      }
      
      console.log("Form settings saved successfully!");
      return true;
    } catch (error) {
      console.error("Error saving form settings:", error);
      return false;
    }
  };

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
  const handleToggleFormScoring = async (enabled: boolean) => {
    console.log("Toggle form scoring called with:", enabled);
    
    // Update local tracking state
    setIsScoringEnabled(enabled);
    
    setFormData(prev => {
      // Create a copy of fields to update
      const updatedFields = prev.fields?.map(field => {
        if (field.hasNumericValues && enabled) {
          // For fields with numeric values, apply scoreRanges
          // FIXED: Create a deep copy of scoreRanges to avoid reference issues
          return { ...field, scoreRanges: JSON.parse(JSON.stringify(scoreRanges)) };
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
        scoreConfig: {
          enabled: enabled,
          // FIXED: Create a deep copy of scoreRanges to avoid reference issues
          ranges: enabled ? JSON.parse(JSON.stringify(scoreRanges)) : []
        },
        // FIXED: Create a deep copy of scoreRanges to avoid reference issues
        scoreRanges: enabled ? JSON.parse(JSON.stringify(scoreRanges)) : [] // Also update the direct scoreRanges property
      };
    });
    
    // CRITICAL FIX: Also save the toggle state directly to Supabase immediately
    if (formData.title) {
      console.log("Saving toggle state directly to Supabase:", enabled);
      // FIXED: Create a deep copy of scoreRanges to avoid reference issues
      const scoreRangesCopy = JSON.parse(JSON.stringify(scoreRanges));
      await saveSettingsDirectlyToSupabase(formData.title, enabled, scoreRangesCopy);
    }
  };

  // Enhanced function to explicitly save score ranges
  const handleSaveScoreRanges = async (newScoreRanges: ScoreRange[]) => {
    console.log("Saving score ranges:", JSON.stringify(newScoreRanges));
    
    // FIXED: Create a deep copy of newScoreRanges to avoid reference issues
    const newScoreRangesCopy = JSON.parse(JSON.stringify(newScoreRanges));
    
    // Store the ranges locally for future use
    setScoreRanges(newScoreRangesCopy);
    
    // Update all fields with numeric values to include these score ranges
    setFormData(prev => {
      // First ensure showTotalScore is set to true
      const updatedFormData = { 
        ...prev, 
        showTotalScore: isScoringEnabled, // Use our tracked state instead of hardcoded true
        // Update scoreConfig to ensure it's saved to the database
        scoreConfig: {
          enabled: isScoringEnabled, // Use our tracked state instead of hardcoded true
          ranges: [...newScoreRangesCopy]
        },
        // Also set the direct scoreRanges property
        scoreRanges: [...newScoreRangesCopy]
      };
      
      // Then update fields with numeric values
      const updatedFields = prev.fields?.map(field => {
        if (field.hasNumericValues && isScoringEnabled) {
          console.log(`Adding score ranges to field ${field.id}`);
          return { ...field, scoreRanges: [...newScoreRangesCopy] };
        }
        return field;
      });
      
      // Return updated form data with modified fields
      return {
        ...updatedFormData,
        fields: updatedFields
      };
    });
    
    // CRITICAL FIX: Save the form with updated score ranges directly to Supabase first
    if (formData.title) {
      console.log("Saving score ranges directly to Supabase before general save");
      const success = await saveSettingsDirectlyToSupabase(
        formData.title,
        isScoringEnabled, // Use tracked state for showTotalScore
        newScoreRangesCopy
      );
      
      if (success) {
        toast({
          title: 'Rangos de puntuación guardados',
          description: 'Los rangos de puntuación se han guardado correctamente',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron guardar los rangos de puntuación',
          variant: 'destructive'
        });
      }
    }
    
    // Also use the regular save mechanism
    try {
      await handleSubmit(true);
    } catch (error) {
      console.error("Error in regular save mechanism:", error);
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
      // CRITICAL FIX: Ensure scoreRanges and showTotalScore are properly set before saving
      // Make an explicit copy to avoid reference issues
      const formToSave: Partial<Form> = {
        ...formData,
        // Explicitly set the showTotalScore as a boolean with our tracking state
        showTotalScore: isScoringEnabled,
        scoreConfig: {
          enabled: isScoringEnabled,
          ranges: [...scoreRanges]
        },
        scoreRanges: [...scoreRanges] // Also save direct scoreRanges property
      };
      
      console.log("Final form saving, showTotalScore:", formToSave.showTotalScore);
      console.log("Final form saving, scoreConfig:", JSON.stringify(formToSave.scoreConfig));
      console.log("Final form saving, scoreRanges:", JSON.stringify(formToSave.scoreRanges));
      
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
      
      // CRITICAL FIX: Before using the update/create operations, save directly to Supabase
      // to ensure the configuration is properly saved
      if (formData.title) {
        await saveSettingsDirectlyToSupabase(
          formData.title,
          isScoringEnabled,
          scoreRanges
        );
      }
      
      if (isEditMode && formId) {
        await updateForm(formId, formToSave);
        
        // Update local states after successful save to maintain consistency
        setIsScoringEnabled(formToSave.showTotalScore === true);
        
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
    scoreRanges, // Expose score ranges to components
    isScoringEnabled // Expose scoring enabled state
  };
};

export default useFormBuilder;
