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

export const createFormOperation = (
  forms: Form[], 
  setForms: React.Dispatch<React.SetStateAction<Form[]>>,
  setAccessTokens: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setAllowedUsers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
  currentUserId: string | undefined,
  currentUserEmail: string | undefined,
) => {
  return async (formData: Partial<Form>): Promise<Form> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = uuidv4();
    const accessToken = uuidv4();
    
    // Extract score ranges
    let scoreRanges: ScoreRange[] = [];
    
    // Get score ranges from the most reliable source
    if (formData.scoreConfig?.ranges && formData.scoreConfig.ranges.length > 0) {
      scoreRanges = JSON.parse(JSON.stringify(formData.scoreConfig.ranges));
      console.log("Using score ranges from scoreConfig:", JSON.stringify(scoreRanges));
    } else if (formData.scoreRanges && formData.scoreRanges.length > 0) {
      scoreRanges = JSON.parse(JSON.stringify(formData.scoreRanges));
      console.log("Using score ranges from direct scoreRanges:", JSON.stringify(scoreRanges));
    } else if (formData.fields) {
      // Look for a field with score ranges as a fallback
      const fieldWithRanges = formData.fields.find(field => 
        field.scoreRanges && field.scoreRanges.length > 0
      );
      
      if (fieldWithRanges?.scoreRanges) {
        scoreRanges = JSON.parse(JSON.stringify(fieldWithRanges.scoreRanges));
        console.log("Using score ranges from fields:", JSON.stringify(scoreRanges));
      }
    }

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
      scoreConfig: {
        enabled: formData.showTotalScore || false,
        ranges: scoreRanges
      },
      scoreRanges: scoreRanges // Also set direct scoreRanges for backward compatibility
    };

    setForms(prevForms => [...prevForms, newForm]);
    setAccessTokens(prev => ({...prev, [id]: accessToken}));
    
    if (newForm.isPrivate && newForm.allowedUsers.length > 0) {
      setAllowedUsers(prev => ({...prev, [id]: newForm.allowedUsers}));
    }
    
    // Check if any field has numeric values
    const fieldsWithValues = formData.fields?.some(field => field.hasNumericValues) || false;
    
    // Save form to Supabase database with score ranges in rangos_mensajes column
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
      
      console.log("Saving configuration to Supabase:", JSON.stringify(configObject));
      console.log("Saving score ranges to rangos_mensajes:", JSON.stringify(scoreRanges));
      
      // Remove scoreRanges from fields before saving to database
      const fieldsForDatabase = removeScoreRangesFromFields(newForm.fields);
      console.log("Fields for database (without scoreRanges):", JSON.stringify(fieldsForDatabase));

      const { data, error } = await supabase.from('formulario_construccion').insert({
        titulo: newForm.title,
        descripcion: newForm.description,
        preguntas: fieldsForDatabase,
        configuracion: configObject,
        rangos_mensajes: scoreRanges.length > 0 ? scoreRanges : null, // Store in new column
        administrador: currentUserEmail || 'unknown@email.com',
        acceso: newForm.allowedUsers
      }).select();
      
      if (error) {
        console.error("Error saving form to Supabase:", error);
      } else {
        console.log("Form created in Supabase:", data);
        console.log("Form created with showTotalScore:", newForm.showTotalScore);
        console.log("Form created with score ranges in rangos_mensajes:", JSON.stringify(scoreRanges));
      }
    } catch (error) {
      console.error("Error saving form to Supabase:", error);
    }

    toast({
      title: 'Form created',
      description: `"${newForm.title}" has been created successfully`,
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

    // Extract score ranges from the most reliable source
    let scoreRanges: ScoreRange[] = [];
    
    // Get score ranges from the most reliable source
    if (formData.scoreConfig?.ranges && formData.scoreConfig.ranges.length > 0) {
      scoreRanges = JSON.parse(JSON.stringify(formData.scoreConfig.ranges));
      console.log("Using score ranges from scoreConfig:", JSON.stringify(scoreRanges));
    } else if (formData.scoreRanges && formData.scoreRanges.length > 0) {
      scoreRanges = JSON.parse(JSON.stringify(formData.scoreRanges));
      console.log("Using score ranges from direct scoreRanges:", JSON.stringify(scoreRanges));
    } else if (formData.fields) {
      // Look for a field with score ranges as a fallback
      const fieldWithRanges = formData.fields.find(field => 
        field.scoreRanges && field.scoreRanges.length > 0
      );
      
      if (fieldWithRanges?.scoreRanges) {
        scoreRanges = JSON.parse(JSON.stringify(fieldWithRanges.scoreRanges));
        console.log("Using score ranges from fields:", JSON.stringify(scoreRanges));
      }
    }
    
    // Check if any field has numeric values
    const fieldsWithValues = formData.fields?.some(field => field.hasNumericValues) || 
                            forms[formIndex].fields.some(field => field.hasNumericValues);

    // Create the updated form with proper score configuration
    const updatedForm = {
      ...forms[formIndex],
      ...formData,
      updatedAt: new Date().toISOString(),
      showTotalScore: formData.showTotalScore === true || forms[formIndex].showTotalScore === true,
      scoreConfig: {
        enabled: formData.showTotalScore === true || forms[formIndex].showTotalScore === true,
        ranges: scoreRanges.length > 0 ? scoreRanges : (forms[formIndex].scoreConfig?.ranges || [])
      },
      scoreRanges: scoreRanges.length > 0 ? scoreRanges : (forms[formIndex].scoreRanges || [])
    };

    // Update fields with score ranges if scoring is enabled
    if (updatedForm.showTotalScore && scoreRanges.length > 0) {
      updatedForm.fields = updatedForm.fields.map(field => {
        if (field.hasNumericValues) {
          return { ...field, scoreRanges: [...scoreRanges] };
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

    console.log("Saving configuration to Supabase:", JSON.stringify(configObject));
    console.log("Saving score ranges to rangos_mensajes:", JSON.stringify(scoreRanges));
    console.log("Form has showTotalScore:", updatedForm.showTotalScore);
    
    // Remove scoreRanges from fields before saving to database
    const fieldsForDatabase = removeScoreRangesFromFields(updatedForm.fields);
    console.log("Fields for database (without scoreRanges):", JSON.stringify(fieldsForDatabase));
    
    // Update the form in Supabase with proper ID handling
    try {
      // Convert form ID to number if it's a string that represents a number
      let queryId: string | number = id;
      const numericId = parseInt(id, 10);
      
      // If the ID can be converted to a number, use it for the database query
      if (!isNaN(numericId)) {
        queryId = numericId;
        console.log("Using numeric ID for database query:", queryId);
      } else {
        // If it's not a number, try to find by title as fallback
        console.log("ID is not numeric, will search by title:", id);
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
        // Update existing form with score ranges in separate column
        const { data, error } = await supabase
          .from('formulario_construccion')
          .update({
            titulo: updatedForm.title,
            descripcion: updatedForm.description,
            preguntas: fieldsForDatabase,
            configuracion: configObject,
            rangos_mensajes: scoreRanges.length > 0 ? scoreRanges : null, // Store in new column
            acceso: updatedForm.allowedUsers
          })
          .eq('id', existingForm.id);
          
        if (error) {
          console.error("Error updating form in Supabase:", error);
        } else {
          console.log("Form updated in Supabase successfully");
          console.log("Form updated with showTotalScore:", updatedForm.showTotalScore);
          console.log("Form updated with score ranges in rangos_mensajes:", JSON.stringify(scoreRanges));
        }
      } else {
        // Form doesn't exist, insert it with score ranges in separate column
        const { data, error } = await supabase
          .from('formulario_construccion')
          .insert({
            titulo: updatedForm.title,
            descripcion: updatedForm.description,
            preguntas: fieldsForDatabase,
            configuracion: configObject,
            rangos_mensajes: scoreRanges.length > 0 ? scoreRanges : null, // Store in new column
            administrador: updatedForm.ownerId,
            acceso: updatedForm.allowedUsers
          });
          
        if (error) {
          console.error("Error creating form in Supabase:", error);
        } else {
          console.log("Form created in Supabase successfully");
          console.log("Form created with showTotalScore:", updatedForm.showTotalScore);
          console.log("Form created with score ranges in rangos_mensajes:", JSON.stringify(scoreRanges));
        }
      }
    } catch (error) {
      console.error("Error with Supabase operation:", error);
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
