
import { v4 as uuidv4 } from 'uuid';
import { Form } from '@/types/form';
import { supabase } from '@/integrations/supabase/client';

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
      collaborators: formData.collaborators
    });

    const newFormId = uuidv4();
    const newForm: Form = {
      id: newFormId,
      title: formData.title || 'Untitled Form',
      description: formData.description || '',
      fields: formData.fields || [],
      isPrivate: formData.isPrivate || false,
      allowedUsers: formData.allowedUsers || [],
      collaborators: formData.collaborators || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessLink: uuidv4(),
      ownerId: userId || userEmail || 'unknown',
      formColor: formData.formColor || '#3b82f6',
      allowViewOwnResponses: formData.allowViewOwnResponses || false,
      allowEditOwnResponses: formData.allowEditOwnResponses || false,
      httpConfig: formData.httpConfig,
      showTotalScore: formData.showTotalScore || false,
      scoreRanges: formData.scoreRanges || []
    };

    // Save to Supabase
    const { error } = await supabase
      .from('formulario_construccion')
      .insert({
        titulo: newForm.title,
        descripcion: newForm.description,
        preguntas: newForm.fields,
        acceso: newForm.allowedUsers,
        colaboradores: newForm.collaborators, // Save collaborators to database
        administrador: newForm.ownerId,
        configuracion: {
          isPrivate: newForm.isPrivate,
          formColor: newForm.formColor,
          allowViewOwnResponses: newForm.allowViewOwnResponses,
          allowEditOwnResponses: newForm.allowEditOwnResponses,
          httpConfig: newForm.httpConfig,
          showTotalScore: newForm.showTotalScore
        },
        rangos_mensajes: newForm.scoreRanges
      });

    if (error) {
      console.error('Error creating form in Supabase:', error);
      throw error;
    }

    // Update local state
    const updatedForms = [...forms, newForm];
    setForms(updatedForms);

    console.log("Form created successfully with collaborators:", newForm.collaborators);
    return newForm;
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
    console.log("Updating form with collaborators:", {
      id,
      collaborators: formData.collaborators
    });

    const formIndex = forms.findIndex(f => f.id === id);
    if (formIndex === -1) {
      throw new Error('Form not found');
    }

    const updatedForm = { ...forms[formIndex], ...formData, updatedAt: new Date().toISOString() };

    // Update in Supabase
    const { error } = await supabase
      .from('formulario_construccion')
      .update({
        titulo: updatedForm.title,
        descripcion: updatedForm.description,
        preguntas: updatedForm.fields,
        acceso: updatedForm.allowedUsers,
        colaboradores: updatedForm.collaborators, // Update collaborators in database
        configuracion: {
          isPrivate: updatedForm.isPrivate,
          formColor: updatedForm.formColor,
          allowViewOwnResponses: updatedForm.allowViewOwnResponses,
          allowEditOwnResponses: updatedForm.allowEditOwnResponses,
          httpConfig: updatedForm.httpConfig,
          showTotalScore: updatedForm.showTotalScore
        },
        rangos_mensajes: updatedForm.scoreRanges
      })
      .eq('id', parseInt(id));

    if (error) {
      console.error('Error updating form in Supabase:', error);
      throw error;
    }

    // Update local state
    const updatedForms = [...forms];
    updatedForms[formIndex] = updatedForm;
    setForms(updatedForms);

    console.log("Form updated successfully with collaborators:", updatedForm.collaborators);
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
    // Delete from Supabase
    const { error } = await supabase
      .from('formulario_construccion')
      .delete()
      .eq('id', parseInt(id));

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
