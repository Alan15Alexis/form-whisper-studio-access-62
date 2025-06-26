import { v4 as uuidv4 } from 'uuid';
import { Form } from '@/types/form';
import { supabase } from '@/integrations/supabase/client';

// Helper function to safely serialize data and prevent circular references
const safeSerialize = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => safeSerialize(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        // Skip circular references and malformed objects
        if (value && typeof value === 'object' && value._type === 'undefined') {
          continue;
        }
        result[key] = safeSerialize(value);
      }
    }
    return result;
  }
  
  return obj;
};

// Helper function to validate and clean score ranges
const cleanScoreRanges = (ranges: any): any[] => {
  if (!Array.isArray(ranges)) {
    return [];
  }
  
  return ranges
    .filter(range => range && typeof range === 'object')
    .map(range => ({
      min: typeof range.min === 'number' ? range.min : 0,
      max: typeof range.max === 'number' ? range.max : 0,
      message: typeof range.message === 'string' ? range.message : ''
    }))
    .filter(range => range.min <= range.max); // Only keep valid ranges
};

// Helper function to validate form ID
const validateFormId = (id: string): number => {
  console.log("Validating form ID:", id);
  
  // Check if it's already a valid number
  const numericId = parseInt(id, 10);
  if (!isNaN(numericId) && numericId > 0) {
    console.log("Valid numeric ID:", numericId);
    return numericId;
  }
  
  // If it's a UUID or invalid, throw an error
  console.error("Invalid form ID format - expected numeric ID but got:", id);
  throw new Error(`Invalid form ID format: ${id}. Expected a numeric ID.`);
};

export const createFormOperation = (
  forms: Form[],
  setForms: (forms: Form[]) => void,
  setAccessTokens: (tokens: any) => void,
  setAllowedUsers: (users: any) => void,
  userId?: string,
  userEmail?: string
) => async (formData: Partial<Form>): Promise<Form> => {
  try {
    console.log("Creating form with data:", {
      title: formData.title,
      collaborators: formData.collaborators,
      showTotalScore: formData.showTotalScore,
      scoreRanges: formData.scoreRanges
    });

    const newFormId = uuidv4();
    
    // Clean and validate the form data
    const cleanFormData = safeSerialize(formData);
    const cleanedScoreRanges = cleanScoreRanges(cleanFormData.scoreRanges);
    
    const newForm: Form = {
      id: newFormId,
      title: cleanFormData.title || 'Untitled Form',
      description: cleanFormData.description || '',
      fields: cleanFormData.fields || [],
      isPrivate: Boolean(cleanFormData.isPrivate),
      allowedUsers: Array.isArray(cleanFormData.allowedUsers) ? cleanFormData.allowedUsers : [],
      collaborators: Array.isArray(cleanFormData.collaborators) ? cleanFormData.collaborators : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessLink: uuidv4(),
      ownerId: userId || userEmail || 'unknown',
      formColor: cleanFormData.formColor || '#3b82f6',
      allowViewOwnResponses: Boolean(cleanFormData.allowViewOwnResponses),
      allowEditOwnResponses: Boolean(cleanFormData.allowEditOwnResponses),
      httpConfig: cleanFormData.httpConfig,
      showTotalScore: Boolean(cleanFormData.showTotalScore),
      scoreRanges: cleanedScoreRanges
    };

    console.log("Cleaned form data for creation:", {
      showTotalScore: newForm.showTotalScore,
      scoreRangesCount: newForm.scoreRanges.length,
      collaboratorsCount: newForm.collaborators.length
    });

    // Save to Supabase
    const { data, error } = await supabase
      .from('formulario_construccion')
      .insert({
        titulo: newForm.title,
        descripcion: newForm.description,
        preguntas: newForm.fields,
        acceso: newForm.allowedUsers,
        colaboradores: newForm.collaborators,
        administrador: newForm.ownerId,
        configuracion: {
          isPrivate: newForm.isPrivate,
          formColor: newForm.formColor,
          allowViewOwnResponses: newForm.allowViewOwnResponses,
          allowEditOwnResponses: newForm.allowEditOwnResponses,
          httpConfig: newForm.httpConfig,
          showTotalScore: newForm.showTotalScore
        },
        rangos_mensajes: cleanedScoreRanges
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating form in Supabase:', error);
      throw error;
    }

    // Update the form ID with the database ID
    const finalForm = { ...newForm, id: data.id.toString() };

    // Update local state
    const updatedForms = [...forms, finalForm];
    setForms(updatedForms);

    console.log("Form created successfully:", finalForm.id);
    return finalForm;
  } catch (error) {
    console.error('Error in createFormOperation:', error);
    throw error;
  }
};

export const updateFormOperation = (
  forms: Form[],
  setForms: (forms: Form[]) => void,
  setAllowedUsers: (users: any) => void
) => async (id: string, formData: Partial<Form>) => {
  try {
    console.log("Updating form:", {
      id,
      collaborators: formData.collaborators,
      showTotalScore: formData.showTotalScore,
      scoreRanges: formData.scoreRanges
    });

    // Validate the form ID
    const numericId = validateFormId(id);

    const formIndex = forms.findIndex(f => f.id === id);
    if (formIndex === -1) {
      throw new Error('Form not found');
    }

    // Clean and validate the form data
    const cleanFormData = safeSerialize(formData);
    const cleanedScoreRanges = cleanScoreRanges(cleanFormData.scoreRanges);

    const updatedForm = { 
      ...forms[formIndex], 
      ...cleanFormData, 
      updatedAt: new Date().toISOString(),
      scoreRanges: cleanedScoreRanges,
      collaborators: Array.isArray(cleanFormData.collaborators) ? cleanFormData.collaborators : [],
      showTotalScore: Boolean(cleanFormData.showTotalScore)
    };

    console.log("Cleaned form data for update:", {
      showTotalScore: updatedForm.showTotalScore,
      scoreRangesCount: updatedForm.scoreRanges.length,
      collaboratorsCount: updatedForm.collaborators.length
    });

    // Update in Supabase
    const { error } = await supabase
      .from('formulario_construccion')
      .update({
        titulo: updatedForm.title,
        descripcion: updatedForm.description,
        preguntas: updatedForm.fields,
        acceso: updatedForm.allowedUsers,
        colaboradores: updatedForm.collaborators,
        configuracion: {
          isPrivate: updatedForm.isPrivate,
          formColor: updatedForm.formColor,
          allowViewOwnResponses: updatedForm.allowViewOwnResponses,
          allowEditOwnResponses: updatedForm.allowEditOwnResponses,
          httpConfig: updatedForm.httpConfig,
          showTotalScore: updatedForm.showTotalScore
        },
        rangos_mensajes: cleanedScoreRanges
      })
      .eq('id', numericId);

    if (error) {
      console.error('Error updating form in Supabase:', error);
      throw error;
    }

    // Update local state
    const updatedForms = [...forms];
    updatedForms[formIndex] = updatedForm;
    setForms(updatedForms);

    console.log("Form updated successfully:", id);
    return updatedForm;
  } catch (error) {
    console.error('Error in updateFormOperation:', error);
    throw error;
  }
};

export const deleteFormOperation = (
  forms: Form[],
  setForms: (forms: Form[]) => void,
  setAllowedUsers: (users: any) => void,
  setAccessTokens: (tokens: any) => void,
  setResponses: (responses: any) => void,
  responses: any[]
) => async (id: string) => {
  try {
    // Validate the form ID
    const numericId = validateFormId(id);

    // Delete from Supabase
    const { error } = await supabase
      .from('formulario_construccion')
      .delete()
      .eq('id', numericId);

    if (error) {
      console.error('Error deleting form from Supabase:', error);
      throw error;
    }

    // Update local state
    const updatedForms = forms.filter(f => f.id !== id);
    setForms(updatedForms);

    // Clean up related data
    const filteredResponses = responses.filter(r => r.formId !== id);
    setResponses(filteredResponses);

    return true;
  } catch (error) {
    console.error('Error in deleteFormOperation:', error);
    throw error;
  }
};

export const getFormOperation = (forms: Form[]) => (id: string): Form | undefined => {
  return forms.find(f => f.id === id);
};
