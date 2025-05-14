import { v4 as uuidv4 } from 'uuid';
import { Form, ScoreRange } from '@/types/form';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

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
      scoreRanges = [...formData.scoreConfig.ranges];
      console.log("Using score ranges from scoreConfig:", JSON.stringify(scoreRanges));
    } else if (formData.scoreRanges && formData.scoreRanges.length > 0) {
      scoreRanges = [...formData.scoreRanges];
      console.log("Using score ranges from direct scoreRanges:", JSON.stringify(scoreRanges));
    } else if (formData.fields) {
      // Look for a field with score ranges as a fallback
      const fieldWithRanges = formData.fields.find(field => 
        field.scoreRanges && field.scoreRanges.length > 0
      );
      
      if (fieldWithRanges?.scoreRanges) {
        scoreRanges = [...fieldWithRanges.scoreRanges];
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
    
    // Save form to Supabase database with detailed configuration
    try {
      // Make sure score ranges are properly included in the configuration
      const configObject = {
        isPrivate: newForm.isPrivate,
        formColor: newForm.formColor,
        allowViewOwnResponses: newForm.allowViewOwnResponses,
        allowEditOwnResponses: newForm.allowEditOwnResponses,
        httpConfig: newForm.httpConfig,
        showTotalScore: newForm.showTotalScore, 
        scoreRanges: scoreRanges, // Explicitly store score ranges in the config
        hasFieldsWithNumericValues: fieldsWithValues
      };
      
      console.log("Saving configuration to Supabase:", configObject);

      const { data, error } = await supabase.from('formulario_construccion').insert({
        titulo: newForm.title,
        descripcion: newForm.description,
        preguntas: newForm.fields,
        configuracion: configObject,
        administrador: currentUserEmail || 'unknown@email.com',
        acceso: newForm.allowedUsers
      }).select();
      
      if (error) {
        console.error("Error saving form to Supabase:", error);
      } else {
        console.log("Form created in Supabase:", data);
        console.log("Form created with showTotalScore:", newForm.showTotalScore);
        console.log("Form created with score ranges:", JSON.stringify(scoreRanges));
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

// Helper function to ensure all fields with numeric values have the specified score ranges
function ensureScoreRangesInAllFields(fields, scoreRanges) {
  if (!fields || !scoreRanges || scoreRanges.length === 0) return fields;
  
  return fields.map(field => {
    if (field.hasNumericValues) {
      return { ...field, scoreRanges: [...scoreRanges] };
    }
    return field;
  });
}

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
      scoreRanges = [...formData.scoreConfig.ranges];
      console.log("Using score ranges from scoreConfig:", JSON.stringify(scoreRanges));
    } else if (formData.scoreRanges && formData.scoreRanges.length > 0) {
      scoreRanges = [...formData.scoreRanges];
      console.log("Using score ranges from direct scoreRanges:", JSON.stringify(scoreRanges));
    } else if (formData.fields) {
      // Look for a field with score ranges as a fallback
      const fieldWithRanges = formData.fields.find(field => 
        field.scoreRanges && field.scoreRanges.length > 0
      );
      
      if (fieldWithRanges?.scoreRanges) {
        scoreRanges = [...fieldWithRanges.scoreRanges];
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
      // Ensure score configuration is properly set
      showTotalScore: formData.showTotalScore ?? forms[formIndex].showTotalScore,
      scoreConfig: {
        enabled: formData.showTotalScore ?? forms[formIndex].showTotalScore,
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

    // Prepare the configuration object with explicit score ranges
    const configObject = {
      isPrivate: updatedForm.isPrivate,
      formColor: updatedForm.formColor,
      allowViewOwnResponses: updatedForm.allowViewOwnResponses,
      allowEditOwnResponses: updatedForm.allowEditOwnResponses,
      httpConfig: updatedForm.httpConfig,
      showTotalScore: updatedForm.showTotalScore === true, // Ensure this is explicitly a boolean
      scoreRanges: scoreRanges, // Explicitly store score ranges
      hasFieldsWithNumericValues: fieldsWithValues
    };

    console.log("Saving configuration to Supabase:", configObject);
    console.log("Form has showTotalScore:", updatedForm.showTotalScore);
    console.log("Form has scoreRanges:", JSON.stringify(scoreRanges));
    
    // Update the form in Supabase
    try {
      // First check if the form exists in Supabase by title
      const { data: existingForm } = await supabase
        .from('formulario_construccion')
        .select('id')
        .eq('titulo', updatedForm.title)
        .maybeSingle();

      if (existingForm) {
        // Update existing form
        const { data, error } = await supabase
          .from('formulario_construccion')
          .update({
            titulo: updatedForm.title,
            descripcion: updatedForm.description,
            preguntas: updatedForm.fields,
            configuracion: configObject,
            acceso: updatedForm.allowedUsers
          })
          .eq('id', existingForm.id);
          
        if (error) {
          console.error("Error updating form in Supabase:", error);
        } else {
          console.log("Form updated in Supabase successfully");
          console.log("Form updated with showTotalScore:", updatedForm.showTotalScore);
          console.log("Form updated with score ranges:", JSON.stringify(scoreRanges));
        }
      } else {
        // Form doesn't exist, insert it
        const { data, error } = await supabase
          .from('formulario_construccion')
          .insert({
            titulo: updatedForm.title,
            descripcion: updatedForm.description,
            preguntas: updatedForm.fields,
            configuracion: configObject,
            administrador: updatedForm.ownerId,
            acceso: updatedForm.allowedUsers
          });
          
        if (error) {
          console.error("Error creating form in Supabase:", error);
        } else {
          console.log("Form created in Supabase successfully");
          console.log("Form created with showTotalScore:", updatedForm.showTotalScore);
          console.log("Form created with score ranges:", JSON.stringify(scoreRanges));
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
