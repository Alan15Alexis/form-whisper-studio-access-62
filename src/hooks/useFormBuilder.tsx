import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "@/contexts/form";
import { Form, FormField, HttpConfig, ScoreRange } from "@/types/form";
import { toast } from "@/hooks/use-toast";
import { useFormFields } from "./form-builder/useFormFields";
import { useDragAndDrop } from "./form-builder/useDragAndDrop";
import { addInvitedUser, checkInvitedUserExists, supabase } from "@/integrations/supabase/client";

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
    showTotalScore: false,
    scoreConfig: {
      enabled: false,
      ranges: []
    },
    scoreRanges: []
  });

  const [allowedUserEmail, setAllowedUserEmail] = useState<string>('');
  const [allowedUserName, setAllowedUserName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>([]);
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
        
        setIsScoringEnabled(form.showTotalScore === true);
        
        // Extract score ranges from the most reliable source
        if (form.scoreConfig?.ranges && form.scoreConfig.ranges.length > 0) {
          console.log("Loading score ranges from scoreConfig:", form.scoreConfig.ranges);
          setScoreRanges(JSON.parse(JSON.stringify(form.scoreConfig.ranges)));
        } else if (form.scoreRanges && form.scoreRanges.length > 0) {
          console.log("Loading score ranges from direct scoreRanges property:", form.scoreRanges);
          setScoreRanges(JSON.parse(JSON.stringify(form.scoreRanges)));
        } else {
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

  // Enhanced direct Supabase update function with improved error handling and validation
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
      
      // Deep clone to avoid reference issues
      const scoreRangesCopy = JSON.parse(JSON.stringify(scoreRangesData || []));
      
      // Ensure deep clones for all objects
      let currentConfig = existingForm.configuracion 
        ? JSON.parse(JSON.stringify(existingForm.configuracion)) 
        : {};
      
      const updatedConfig = {
        ...currentConfig,
        showTotalScore: showTotalScore === true,
        scoreRanges: scoreRangesCopy 
      };
      
      console.log("DIRECT UPDATE - saveSettingsDirectlyToSupabase:");
      console.log("Form title:", formTitle);
      console.log("showTotalScore value:", showTotalScore);
      console.log("scoreRanges being saved:", JSON.stringify(scoreRangesCopy));
      console.log("Complete updated config:", JSON.stringify(updatedConfig));
      
      // Ensure fields don't have score ranges directly in them before saving
      const currentFields = existingForm.preguntas || [];
      const fieldsWithoutRanges = currentFields.map(field => {
        const { scoreRanges, ...fieldWithoutRanges } = field;
        return fieldWithoutRanges;
      });
      
      // Update the database record with explicit data
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
      
      console.log("Form settings saved successfully to Supabase!");
      return true;
    } catch (error) {
      console.error("Exception in saveSettingsDirectlyToSupabase:", error);
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

  // Toggle form scoring function with immediate Supabase update
  const handleToggleFormScoring = async (enabled: boolean) => {
    console.log("Toggle form scoring called with:", enabled);
    
    setIsScoringEnabled(enabled);
    
    // Deep clone score ranges for safety
    const scoreRangesCopy = JSON.parse(JSON.stringify(scoreRanges));
    
    setFormData(prev => {
      const updatedFields = prev.fields?.map(field => {
        if (field.hasNumericValues && enabled) {
          return { ...field, scoreRanges: JSON.parse(JSON.stringify(scoreRangesCopy)) };
        } 
        else if (!enabled) {
          const { scoreRanges, ...fieldWithoutRanges } = field;
          return fieldWithoutRanges;
        }
        return field;
      });
      
      return { 
        ...prev, 
        showTotalScore: enabled,
        fields: updatedFields,
        scoreConfig: {
          enabled: enabled,
          ranges: enabled ? JSON.parse(JSON.stringify(scoreRangesCopy)) : []
        },
        scoreRanges: enabled ? JSON.parse(JSON.stringify(scoreRangesCopy)) : []
      };
    });
    
    // Save to Supabase immediately with additional logging
    if (formData.title) {
      console.log("DIRECT ACTION - Saving toggle state to Supabase:", enabled);
      console.log("With score ranges:", JSON.stringify(scoreRangesCopy));
      const success = await saveSettingsDirectlyToSupabase(formData.title, enabled, scoreRangesCopy);
      
      if (success) {
        console.log("Successfully saved scoring toggle state to Supabase");
      } else {
        console.error("Failed to save scoring toggle state to Supabase");
        toast({
          title: 'Error',
          description: 'No se pudo guardar la configuración de puntuación',
          variant: 'destructive'
        });
      }
    }
  };

  // Enhanced function to explicitly save score ranges with better error handling
  const handleSaveScoreRanges = async (newScoreRanges: ScoreRange[]) => {
    console.log("Saving score ranges:", JSON.stringify(newScoreRanges));
    
    if (!newScoreRanges || newScoreRanges.length === 0) {
      console.warn("Attempted to save empty score ranges");
      toast({
        title: 'Advertencia',
        description: 'No hay rangos de puntuación para guardar',
        variant: 'destructive'
      });
      return;
    }
    
    // Deep clone to avoid reference issues
    const newScoreRangesCopy = JSON.parse(JSON.stringify(newScoreRanges));
    
    // Update local state
    setScoreRanges(newScoreRangesCopy);
    
    // Update form data with explicit boolean flag and cloned arrays
    setFormData(prev => {
      // First ensure showTotalScore is set correctly
      const updatedFormData = { 
        ...prev, 
        showTotalScore: isScoringEnabled, 
        scoreConfig: {
          enabled: isScoringEnabled,
          ranges: [...newScoreRangesCopy]
        },
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
      
      return {
        ...updatedFormData,
        fields: updatedFields || []
      };
    });
    
    // CRITICAL: Save directly to Supabase with explicit values before the regular save operation
    if (formData.title) {
      console.log("DIRECT ACTION - Saving score ranges directly to Supabase");
      console.log("Form title:", formData.title);
      console.log("isScoringEnabled:", isScoringEnabled);
      console.log("Score ranges to save:", JSON.stringify(newScoreRangesCopy));
      
      const success = await saveSettingsDirectlyToSupabase(
        formData.title,
        isScoringEnabled,
        newScoreRangesCopy
      );
      
      if (success) {
        toast({
          title: 'Rangos de puntuación guardados',
          description: 'Los rangos de puntuación se han guardado correctamente en la base de datos',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron guardar los rangos de puntuación en la base de datos',
          variant: 'destructive'
        });
        return; // Stop here if direct save failed
      }
    }
    
    // Also use the regular save mechanism
    try {
      await handleSubmit(true);
    } catch (error) {
      console.error("Error in regular save mechanism:", error);
      toast({
        title: 'Error',
        description: 'Se produjo un error al guardar los cambios',
        variant: 'destructive'
      });
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

  const handleSubmit = async (skipValidation = false) => {
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
      // Make an explicit deep copy of all data to prevent any reference issues
      const formToSave: Partial<Form> = JSON.parse(JSON.stringify({
        ...formData,
        showTotalScore: isScoringEnabled,
        scoreConfig: {
          enabled: isScoringEnabled,
          ranges: scoreRanges
        },
        scoreRanges: scoreRanges
      }));
      
      console.log("Final form saving:");
      console.log("- showTotalScore:", formToSave.showTotalScore);
      console.log("- scoreRanges:", JSON.stringify(formToSave.scoreRanges));
      console.log("- scoreConfig:", JSON.stringify(formToSave.scoreConfig));
      
      // Apply score ranges to fields with numeric values using deep clones
      if (formToSave.showTotalScore && scoreRanges.length > 0) {
        formToSave.fields = formToSave.fields?.map(field => {
          if (field.hasNumericValues) {
            return { 
              ...field, 
              scoreRanges: JSON.parse(JSON.stringify(scoreRanges)) 
            };
          }
          return field;
        });
      }
      
      // CRITICAL: Save directly to Supabase before using update/create operations
      if (formData.title) {
        await saveSettingsDirectlyToSupabase(
          formData.title,
          isScoringEnabled,
          scoreRanges
        );
      }
      
      if (isEditMode && formId) {
        await updateForm(formId, formToSave);
        
        // Update local states after successful save
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
    updateField: (id: string, updatedField: FormField) => {
      const updatedFields = formData.fields?.map(field => 
        field.id === id ? { ...updatedField } : field
      ) || [];
      
      setFormData(prev => ({
        ...prev,
        fields: updatedFields
      }));
    },
    removeField: (id: string) => {
      const updatedFields = formData.fields?.filter(field => field.id !== id) || [];
      setFormData(prev => ({
        ...prev,
        fields: updatedFields
      }));
    },
    addField,
    addAllowedUser: async () => {
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
    },
    removeAllowedUser: (email: string) => {
      const updatedAllowedUsers = formData.allowedUsers?.filter(user => user !== email) || [];
      setFormData(prev => ({ 
        ...prev, 
        allowedUsers: updatedAllowedUsers 
      }));
      
      toast({
        title: 'User removed',
        description: `${email} has been removed from allowed users`,
      });
    },
    handleSubmit,
    setAllowedUserEmail,
    setAllowedUserName,
    handleDragEnd,
    handleAllowViewOwnResponsesChange: (allow: boolean) => {
      setFormData(prev => ({ ...prev, allowViewOwnResponses: allow }));
    },
    handleAllowEditOwnResponsesChange: (allow: boolean) => {
      setFormData(prev => ({ ...prev, allowEditOwnResponses: allow }));
    },
    handleFormColorChange: (color: string) => {
      setFormData(prev => ({ ...prev, formColor: color }));
    },
    handleHttpConfigChange: (config: HttpConfig) => {
      setFormData(prev => ({ ...prev, httpConfig: config }));
    },
    scoreRanges,
    isScoringEnabled
  };
};

export default useFormBuilder;
