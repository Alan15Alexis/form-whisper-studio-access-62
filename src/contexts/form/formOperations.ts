import { v4 as uuidv4 } from 'uuid';
import { Form, FormField, ScoreRange } from '@/types/form';
import { toast } from "@/hooks/toast";
import { supabase } from '@/integrations/supabase/client';

// Helper function to ensure all fields with numeric values have the specified score ranges
export function ensureScoreRangesInAllFields(fields: FormField[], scoreRanges: ScoreRange[]) {
  if (!fields || !scoreRanges || scoreRanges.length === 0) return fields;
  
  return fields.map(field => {
    if (field.hasNumericValues) {
      // Create a deep copy of scoreRanges to avoid reference issues
      return { ...field, scoreRanges: JSON.parse(JSON.stringify(scoreRanges)) };
    }
    return field;
  });
}

// Helper function to remove score ranges from fields before saving to database
function removeScoreRangesFromFields(fields: FormField[]) {
  if (!fields) return [];
  
  return fields.map(field => {
    // Create a new object without the scoreRanges property using destructuring
    const { scoreRanges, ...fieldWithoutRanges } = field;
    return fieldWithoutRanges;
  });
}

// Helper function to validate and clean score ranges
function validateAndCleanScoreRanges(ranges: ScoreRange[]): { valid: ScoreRange[]; errors: string[] } {
  const errors: string[] = [];
  
  if (!ranges || ranges.length === 0) {
    return { valid: [], errors: [] };
  }
  
  const validRanges = ranges.filter((range, index) => {
    // Check if range has required properties
    if (typeof range.min !== 'number' || typeof range.max !== 'number' || typeof range.message !== 'string') {
      errors.push(`Range ${index + 1}: Missing or invalid properties`);
      return false;
    }
    
    // Check if min <= max
    if (range.min > range.max) {
      errors.push(`Range ${index + 1}: Minimum value (${range.min}) cannot be greater than maximum value (${range.max})`);
      return false;
    }
    
    return true;
  });
  
  // Check for overlaps between valid ranges
  for (let i = 0; i < validRanges.length; i++) {
    for (let j = i + 1; j < validRanges.length; j++) {
      const range1 = validRanges[i];
      const range2 = validRanges[j];
      if (range1.min <= range2.max && range2.min <= range1.max) {
        errors.push(`Range ${i + 1} overlaps with Range ${j + 1}`);
      }
    }
  }
  
  return { valid: validRanges, errors };
}

export const createFormOperation = (
  forms: Form[], 
  setForms: React.Dispatch<React.SetStateAction<Form[]>>,
  setAccessTokens: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setAllowedUsers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
  currentUserId: string | undefined,
  currentUserEmail: string | undefined,
) => {
  return async (formData: Partial<Form>): Promise<Form> => {
    console.log("Creating form with data:", formData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = uuidv4();
    const accessToken = uuidv4();
    
    // Extract and validate score ranges with improved consolidation
    let scoreRanges: ScoreRange[] = [];
    
    // Priority 1: scoreRanges direct property
    if (formData.scoreRanges && Array.isArray(formData.scoreRanges) && formData.scoreRanges.length > 0) {
      scoreRanges = JSON.parse(JSON.stringify(formData.scoreRanges));
      console.log("Using score ranges from direct scoreRanges:", scoreRanges.length);
    } 
    // Priority 2: scoreConfig.ranges
    else if (formData.scoreConfig?.ranges && Array.isArray(formData.scoreConfig.ranges) && formData.scoreConfig.ranges.length > 0) {
      scoreRanges = JSON.parse(JSON.stringify(formData.scoreConfig.ranges));
      console.log("Using score ranges from scoreConfig:", scoreRanges.length);
    }
    // Priority 3: Look in fields as fallback
    else if (formData.fields) {
      const fieldWithRanges = formData.fields.find(field => 
        field.scoreRanges && Array.isArray(field.scoreRanges) && field.scoreRanges.length > 0
      );
      
      if (fieldWithRanges?.scoreRanges) {
        scoreRanges = JSON.parse(JSON.stringify(fieldWithRanges.scoreRanges));
        console.log("Using score ranges from fields:", scoreRanges.length);
      }
    }

    // Validate and clean score ranges before saving
    const validation = validateAndCleanScoreRanges(scoreRanges);
    if (validation.errors.length > 0) {
      console.warn("Score range validation issues:", validation.errors);
      toast({
        title: 'Advertencia de configuración',
        description: `Se detectaron problemas con los rangos de puntuación: ${validation.errors.slice(0, 2).join(', ')}${validation.errors.length > 2 ? '...' : ''}`,
        variant: 'destructive',
      });
    }
    
    // Use validated ranges
    scoreRanges = validation.valid;

    // Create the new form with all score properties properly set
    const newForm: Form = {
      id,
      title: formData.title || 'Untitled Form',
      description: formData.description || '',
      fields: formData.fields || [],
      isPrivate: formData.isPrivate || false,
      allowedUsers: formData.allowedUsers || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessLink: accessToken,
      ownerId: currentUserId || 'unknown',
      formColor: formData.formColor || '#3b82f6',
      allowViewOwnResponses: formData.allowViewOwnResponses || false,
      allowEditOwnResponses: formData.allowEditOwnResponses || false,
      httpConfig: formData.httpConfig,
      showTotalScore: formData.showTotalScore || false,
      enableScoring: formData.showTotalScore || false,
      scoreConfig: {
        enabled: formData.showTotalScore || false,
        ranges: JSON.parse(JSON.stringify(scoreRanges)) // Deep copy
      },
      scoreRanges: JSON.parse(JSON.stringify(scoreRanges)) // Deep copy for backward compatibility
    };

    // Check if any field has numeric values
    const fieldsWithValues = formData.fields?.some(field => field.hasNumericValues) || false;
    
    // Save form to Supabase database with score ranges in dedicated column
    try {
      // Configuration object without score ranges (they go in separate column)
      const configObject = {
        isPrivate: newForm.isPrivate,
        formColor: newForm.formColor,
        allowViewOwnResponses: newForm.allowViewOwnResponses,
        allowEditOwnResponses: newForm.allowEditOwnResponses,
        httpConfig: newForm.httpConfig,
        showTotalScore: newForm.showTotalScore === true,
        hasFieldsWithNumericValues: fieldsWithValues
      };
      
      console.log("Saving configuration to Supabase:", configObject);
      console.log("Saving score ranges to rangos_mensajes:", scoreRanges.length, "ranges");
      
      // Remove scoreRanges from fields before saving to database
      const fieldsForDatabase = removeScoreRangesFromFields(newForm.fields);

      const { data, error } = await supabase.from('formulario_construccion').insert({
        titulo: newForm.title,
        descripcion: newForm.description,
        preguntas: fieldsForDatabase,
        configuracion: configObject,
        rangos_mensajes: scoreRanges.length > 0 ? scoreRanges : null, // Store in dedicated column
        administrador: currentUserEmail || 'unknown@email.com',
        acceso: newForm.allowedUsers
      }).select();
      
      if (error) {
        console.error("Error saving form to Supabase:", error);
        toast({
          title: 'Error al guardar',
          description: 'No se pudo guardar el formulario en la base de datos. Se mantendrá en almacenamiento local.',
          variant: 'destructive',
        });
      } else {
        console.log("Form created in Supabase with score ranges:", scoreRanges.length);
        
        // Update the form ID with the database ID for better synchronization
        if (data && data[0]) {
          newForm.id = data[0].id.toString();
          console.log("Updated form ID to database ID:", newForm.id);
        }
        
        toast({
          title: 'Formulario guardado',
          description: `"${newForm.title}" ha sido guardado exitosamente en la base de datos`,
        });
      }
    } catch (error) {
      console.error("Error saving form to Supabase:", error);
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con la base de datos. El formulario se guardará localmente.',
        variant: 'destructive',
      });
    }

    // Add to local state
    setForms(prevForms => [...prevForms, newForm]);
    setAccessTokens(prev => ({...prev, [newForm.id]: accessToken}));
    
    if (newForm.isPrivate && newForm.allowedUsers.length > 0) {
      setAllowedUsers(prev => ({...prev, [newForm.id]: newForm.allowedUsers}));
    }

    toast({
      title: 'Formulario creado',
      description: `"${newForm.title}" ha sido creado exitosamente`,
      variant: 'default',
    });
    
    return newForm;
  };
};

export const updateFormOperation = (
  forms: Form[],
  setForms: React.Dispatch<React.SetStateAction<Form[]>>,
  setAllowedUsers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
) => {
  return async (id: string, formData: Partial<Form>): Promise<Form | null> => {
    console.log("Updating form with ID:", id, "and score data:", {
      showTotalScore: formData.showTotalScore,
      scoreRanges: formData.scoreRanges?.length || 0,
      scoreConfigRanges: formData.scoreConfig?.ranges?.length || 0
    });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find the form to update
    const formIndex = forms.findIndex(form => form.id === id);
    if (formIndex === -1) {
      toast({
        title: 'Update failed',
        description: 'Form not found',
        variant: 'destructive',
      });
      return null;
    }

    // Extract and validate score ranges with improved consolidation
    let scoreRanges: ScoreRange[] = [];
    
    // Priority 1: scoreRanges direct property
    if (formData.scoreRanges && Array.isArray(formData.scoreRanges) && formData.scoreRanges.length > 0) {
      scoreRanges = JSON.parse(JSON.stringify(formData.scoreRanges));
      console.log("Update: Using score ranges from direct scoreRanges:", scoreRanges.length);
    } 
    // Priority 2: scoreConfig.ranges
    else if (formData.scoreConfig?.ranges && Array.isArray(formData.scoreConfig.ranges) && formData.scoreConfig.ranges.length > 0) {
      scoreRanges = JSON.parse(JSON.stringify(formData.scoreConfig.ranges));
      console.log("Update: Using score ranges from scoreConfig:", scoreRanges.length);
    }
    // Priority 3: Keep existing ranges from current form
    else if (forms[formIndex].scoreRanges && Array.isArray(forms[formIndex].scoreRanges)) {
      scoreRanges = JSON.parse(JSON.stringify(forms[formIndex].scoreRanges));
      console.log("Update: Keeping existing score ranges:", scoreRanges.length);
    }
    
    // Validate and clean score ranges before saving
    const validation = validateAndCleanScoreRanges(scoreRanges);
    if (validation.errors.length > 0) {
      console.warn("Score range validation issues during update:", validation.errors);
      toast({
        title: 'Advertencia de configuración',
        description: `Se detectaron problemas con los rangos de puntuación: ${validation.errors.slice(0, 2).join(', ')}${validation.errors.length > 2 ? '...' : ''}`,
        variant: 'destructive',
      });
    }
    
    // Use validated ranges
    scoreRanges = validation.valid;
    
    // Check if any field has numeric values
    const fieldsWithValues = formData.fields?.some(field => field.hasNumericValues) || 
                            forms[formIndex].fields.some(field => field.hasNumericValues);

    // Create the updated form with proper score configuration
    const updatedForm = {
      ...forms[formIndex],
      ...formData,
      updatedAt: new Date().toISOString(),
      showTotalScore: formData.showTotalScore === true || forms[formIndex].showTotalScore === true,
      enableScoring: formData.showTotalScore === true || forms[formIndex].showTotalScore === true,
      scoreConfig: {
        enabled: formData.showTotalScore === true || forms[formIndex].showTotalScore === true,
        ranges: JSON.parse(JSON.stringify(scoreRanges)) // Deep copy
      },
      scoreRanges: JSON.parse(JSON.stringify(scoreRanges)) // Deep copy
    };

    // Update fields with score ranges if scoring is enabled
    if (updatedForm.showTotalScore && scoreRanges.length > 0) {
      updatedForm.fields = updatedForm.fields.map(field => {
        if (field.hasNumericValues) {
          return { ...field, scoreRanges: JSON.parse(JSON.stringify(scoreRanges)) };
        }
        return field;
      });
    }

    // Update forms array
    const updatedForms = [...forms];
    updatedForms[formIndex] = updatedForm;
    setForms(updatedForms);
    
    // Update allowed users if the form is private
    if (updatedForm.isPrivate && updatedForm.allowedUsers) {
      setAllowedUsers(prev => ({...prev, [id]: updatedForm.allowedUsers}));
    }

    // Prepare the configuration object WITHOUT score ranges
    const configObject = {
      isPrivate: updatedForm.isPrivate,
      formColor: updatedForm.formColor,
      allowViewOwnResponses: updatedForm.allowViewOwnResponses,
      allowEditOwnResponses: updatedForm.allowEditOwnResponses,
      httpConfig: updatedForm.httpConfig,
      showTotalScore: updatedForm.showTotalScore === true,
      hasFieldsWithNumericValues: fieldsWithValues
    };

    console.log("Update: Saving configuration to Supabase:", configObject);
    console.log("Update: Saving score ranges to rangos_mensajes:", scoreRanges.length, "ranges");
    
    // Remove scoreRanges from fields before saving to database
    const fieldsForDatabase = removeScoreRangesFromFields(updatedForm.fields);
    
    // Update the form in Supabase with proper ID handling
    try {
      // Convert form ID to number if it's a string that represents a number
      let queryId: string | number = id;
      const numericId = parseInt(id, 10);
      
      // If the ID can be converted to a number, use it for the database query
      if (!isNaN(numericId)) {
        queryId = numericId;
      }
      
      let existingForm;
      
      // Try to find by numeric ID first if possible
      if (typeof queryId === 'number') {
        const { data } = await supabase
          .from('formulario_construccion')
          .select('id')
          .eq('id', queryId)
          .maybeSingle();
        existingForm = data;
      }
      
      // If not found by ID or ID is not numeric, try to find by title
      if (!existingForm) {
        const { data } = await supabase
          .from('formulario_construccion')
          .select('id')
          .eq('titulo', updatedForm.title)
          .maybeSingle();
        existingForm = data;
      }

      if (existingForm) {
        // Update existing form with score ranges in dedicated column
        const { data, error } = await supabase
          .from('formulario_construccion')
          .update({
            titulo: updatedForm.title,
            descripcion: updatedForm.description,
            preguntas: fieldsForDatabase,
            configuracion: configObject,
            rangos_mensajes: scoreRanges.length > 0 ? scoreRanges : null, // Store in dedicated column
            acceso: updatedForm.allowedUsers
          })
          .eq('id', existingForm.id);
          
        if (error) {
          console.error("Error updating form in Supabase:", error);
          toast({
            title: 'Error al actualizar',
            description: 'No se pudo actualizar el formulario en la base de datos. Los cambios se mantienen localmente.',
            variant: 'destructive',
          });
        } else {
          console.log("Form updated in Supabase with score ranges:", scoreRanges.length);
          
          toast({
            title: 'Formulario actualizado',
            description: 'Los cambios se han guardado exitosamente en la base de datos',
          });
        }
      } else {
        // Form doesn't exist, insert it
        const { data, error } = await supabase
          .from('formulario_construccion')
          .insert({
            titulo: updatedForm.title,
            descripcion: updatedForm.description,
            preguntas: fieldsForDatabase,
            configuracion: configObject,
            rangos_mensajes: scoreRanges.length > 0 ? scoreRanges : null, // Store in dedicated column
            administrador: updatedForm.ownerId,
            acceso: updatedForm.allowedUsers
          });
          
        if (error) {
          console.error("Error creating form in Supabase:", error);
          toast({
            title: 'Error al crear',
            description: 'No se pudo crear el formulario en la base de datos. Se mantendrá en almacenamiento local.',
            variant: 'destructive',
          });
        } else {
          console.log("Form created in Supabase with score ranges:", scoreRanges.length);
          
          toast({
            title: 'Formulario creado',
            description: 'El formulario se ha guardado exitosamente en la base de datos',
          });
        }
      }
    } catch (error) {
      console.error("Error with Supabase operation:", error);
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con la base de datos. Los cambios se mantienen localmente.',
        variant: 'destructive',
      });
    }

    toast({
      title: 'Form updated',
      description: `"${updatedForm.title}" has been updated successfully`,
      variant: 'default',
    });
    
    return updatedForm;
  };
};

export const deleteFormOperation = (
  forms: Form[],
  setForms: React.Dispatch<React.SetStateAction<Form[]>>,
  setAllowedUsers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
  setAccessTokens: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setResponses: React.Dispatch<React.SetStateAction<any[]>>,
  responses: any[],
) => {
  return async (id: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const formToDelete = forms.find(form => form.id === id);
    if (!formToDelete) {
      toast({
        title: 'Deletion failed',
        description: 'Form not found',
        variant: 'destructive',
      });
      return false;
    }

    // Filter out the form to delete
    setForms(forms.filter(form => form.id !== id));
    
    // Also remove from allowed users
    const newAllowedUsers = {...setAllowedUsers};
    delete newAllowedUsers[id];
    setAllowedUsers(newAllowedUsers);
    
    // Remove access token
    const newAccessTokens = {...setAccessTokens};
    delete newAccessTokens[id];
    setAccessTokens(newAccessTokens);
    
    // Remove associated responses
    setResponses(responses.filter(response => response.formId !== id));
    
    // Delete the form from Supabase
    try {
      // First find the form by title
      const { data: existingForm } = await supabase
        .from('formulario_construccion')
        .select('id')
        .eq('titulo', formToDelete.title)
        .maybeSingle();

      if (existingForm) {
        const { error } = await supabase
          .from('formulario_construccion')
          .delete()
          .eq('id', existingForm.id);
          
        if (error) {
          console.error("Error deleting form from Supabase:", error);
        } else {
          console.log("Form deleted from Supabase successfully");
        }
      }
    } catch (error) {
      console.error("Error with Supabase delete operation:", error);
    }

    toast({
      title: 'Form deleted',
      description: `"${formToDelete.title}" has been deleted`,
      variant: 'default',
    });
    
    return true;
  };
};

export const getFormOperation = (forms: Form[]) => {
  return (id: string): Form | undefined => {
    return forms.find(form => form.id === id);
  };
};
