import { toast } from "@/components/ui/use-toast";
import { Form } from '@/types/form';
import { supabase } from '@/integrations/supabase/client';

// Enhanced helper function to validate form ID format (accepts both numeric and UUID formats)
const validateFormId = (id: string): boolean => {
  console.log('validateFormId - Validating form ID:', id);
  
  // Check if it's a numeric ID (legacy format)
  if (/^\d+$/.test(id)) {
    console.log('validateFormId - Valid numeric ID format');
    return true;
  }
  
  // Check if it's a UUID format (new format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    console.log('validateFormId - Valid UUID format');
    return true;
  }
  
  console.error('validateFormId - Invalid form ID format - expected numeric ID or UUID but got:', id);
  return false;
};

// Enhanced helper function to find numeric ID from any form identifier
const resolveNumericFormId = async (id: string, forms: Form[]): Promise<number | null> => {
  console.log('resolveNumericFormId - Resolving ID:', id);
  
  // If it's already numeric, convert to number
  if (/^\d+$/.test(id)) {
    const numericId = parseInt(id, 10);
    console.log('resolveNumericFormId - Already numeric:', numericId);
    return numericId;
  }
  
  // If it's a UUID, try to find matching form in local state first
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    console.log('resolveNumericFormId - UUID detected, searching in local forms');
    
    // Search in local forms array for a matching form
    const localForm = forms.find(f => f.id === id);
    if (localForm) {
      // Check if the local form has a numeric ID we can use
      const parts = localForm.id.split('-');
      if (parts.length === 1 && /^\d+$/.test(parts[0])) {
        const numericId = parseInt(parts[0], 10);
        console.log('resolveNumericFormId - Found numeric ID from local form:', numericId);
        return numericId;
      }
    }
    
    // If we can't resolve from local state, search database by other properties
    console.log('resolveNumericFormId - Searching database for UUID match');
    try {
      const { data: forms, error } = await supabase
        .from('formulario_construccion')
        .select('id, titulo, administrador, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('resolveNumericFormId - Database query error:', error);
        return null;
      }
      
      // For now, we can't directly match UUID to numeric ID without a mapping
      // This would require database schema changes to add a UUID column
      console.warn('resolveNumericFormId - Cannot resolve UUID to numeric ID without schema changes');
      return null;
    } catch (error) {
      console.error('resolveNumericFormId - Error querying database:', error);
      return null;
    }
  }
  
  console.error('resolveNumericFormId - Unrecognized ID format:', id);
  return null;
};

export const createFormOperation = (
  forms: Form[],
  setForms: React.Dispatch<React.SetStateAction<Form[]>>,
  setAccessTokens: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setAllowedUsers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
  userId?: string,
  userEmail?: string
) => {
  return async (formData: Partial<Form>): Promise<Form> => {
    try {
      console.log("createFormOperation - Creating form with data:", formData);
      
      // Prepare form data for Supabase with enhanced collaborators handling
      const supabaseData = {
        titulo: formData.title || '',
        descripcion: formData.description || '',
        preguntas: formData.fields || [],
        configuracion: {
          isPrivate: formData.isPrivate || false,
          formColor: formData.formColor || '#3b82f6',
          allowViewOwnResponses: formData.allowViewOwnResponses || false,
          allowEditOwnResponses: formData.allowEditOwnResponses || false,
          showTotalScore: formData.showTotalScore || false,
          httpConfig: formData.httpConfig
        },
        acceso: formData.allowedUsers || [],
        administrador: userEmail,
        rangos_mensajes: formData.scoreRanges || [],
        colaboradores: Array.isArray(formData.collaborators) ? formData.collaborators : []
      };

      console.log("createFormOperation - Inserting form data to Supabase with collaborators:", supabaseData.colaboradores);
      
      const { data, error } = await supabase
        .from('formulario_construccion')
        .insert([supabaseData])
        .select()
        .single();

      if (error) {
        console.error("createFormOperation - Supabase error:", error);
        throw new Error(`Failed to create form: ${error.message}`);
      }

      console.log("createFormOperation - Form created in Supabase:", data);

      // Convert Supabase data back to Form format with proper collaborators handling
      const newForm: Form = {
        id: data.id.toString(),
        title: data.titulo || '',
        description: data.descripcion || '',
        fields: data.preguntas || [],
        isPrivate: data.configuracion?.isPrivate || false,
        allowedUsers: data.acceso || [],
        collaborators: Array.isArray(data.colaboradores) ? data.colaboradores : [],
        createdAt: data.created_at,
        updatedAt: data.created_at,
        accessLink: crypto.randomUUID(),
        ownerId: data.administrador || '',
        formColor: data.configuracion?.formColor || '#3b82f6',
        allowViewOwnResponses: data.configuracion?.allowViewOwnResponses || false,
        allowEditOwnResponses: data.configuracion?.allowEditOwnResponses || false,
        showTotalScore: data.configuracion?.showTotalScore || false,
        scoreRanges: data.rangos_mensajes || []
      };

      console.log("createFormOperation - New form created with collaborators:", newForm.collaborators);

      // Update local state
      setForms(prev => [newForm, ...prev]);

      toast({
        title: 'Formulario creado',
        description: `"${newForm.title}" ha sido creado exitosamente`,
      });

      return newForm;
    } catch (error) {
      console.error("createFormOperation - Error:", error);
      toast({
        title: 'Error al crear formulario',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
      throw error;
    }
  };
};

export const updateFormOperation = (
  forms: Form[],
  setForms: React.Dispatch<React.SetStateAction<Form[]>>,
  setAllowedUsers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
) => {
  return async (id: string, formData: Partial<Form>): Promise<Form | null> => {
    try {
      console.log("updateFormOperation - Updating form:", { id, collaborators: formData.collaborators });
      
      // Enhanced form ID validation
      if (!validateFormId(id)) {
        throw new Error(`Invalid form ID format: ${id}. Expected a numeric ID or UUID.`);
      }

      // Enhanced numeric ID resolution with fallback mechanisms
      const numericId = await resolveNumericFormId(id, forms);
      
      if (numericId === null) {
        // Final fallback: try to extract from forms array by matching properties
        const matchingForm = forms.find(f => f.id === id);
        if (matchingForm) {
          console.log('updateFormOperation - Found matching form in local state:', matchingForm.title);
          // Try to extract numeric ID if the local form ID is actually numeric
          const tryNumeric = parseInt(matchingForm.id, 10);
          if (!isNaN(tryNumeric)) {
            console.log('updateFormOperation - Using extracted numeric ID:', tryNumeric);
          } else {
            throw new Error(`Cannot resolve form ID "${id}" to database format. Form may not exist or there's an ID mapping issue.`);
          }
        } else {
          throw new Error(`Form with ID "${id}" not found in local state and cannot be resolved to database format.`);
        }
      }
      
      const finalNumericId = numericId || parseInt(id, 10);
      console.log('updateFormOperation - Using numeric ID for database update:', finalNumericId);
      
      // Prepare update data for Supabase with enhanced collaborators handling
      const updateData: any = {};
      
      if (formData.title !== undefined) updateData.titulo = formData.title;
      if (formData.description !== undefined) updateData.descripcion = formData.description;
      if (formData.fields !== undefined) updateData.preguntas = formData.fields;
      if (formData.allowedUsers !== undefined) updateData.acceso = formData.allowedUsers;
      if (formData.scoreRanges !== undefined) updateData.rangos_mensajes = formData.scoreRanges;
      
      // Enhanced collaborators handling with detailed logging
      if (formData.collaborators !== undefined) {
        const collaboratorsArray = Array.isArray(formData.collaborators) ? formData.collaborators : [];
        updateData.colaboradores = collaboratorsArray;
        console.log('updateFormOperation - Setting collaborators in database:', collaboratorsArray);
      }
      
      // Handle configuration updates with existing config preservation
      if (formData.isPrivate !== undefined || 
          formData.formColor !== undefined || 
          formData.allowViewOwnResponses !== undefined || 
          formData.allowEditOwnResponses !== undefined ||
          formData.showTotalScore !== undefined ||
          formData.httpConfig !== undefined) {
        
        // Get current configuration to preserve existing settings
        const { data: currentData, error: fetchError } = await supabase
          .from('formulario_construccion')
          .select('configuracion')
          .eq('id', finalNumericId)
          .single();
        
        if (fetchError) {
          console.warn('updateFormOperation - Could not fetch current config:', fetchError);
        }
        
        const currentConfig = currentData?.configuracion || {};
        
        updateData.configuracion = {
          ...currentConfig,
          ...(formData.isPrivate !== undefined && { isPrivate: formData.isPrivate }),
          ...(formData.formColor !== undefined && { formColor: formData.formColor }),
          ...(formData.allowViewOwnResponses !== undefined && { allowViewOwnResponses: formData.allowViewOwnResponses }),
          ...(formData.allowEditOwnResponses !== undefined && { allowEditOwnResponses: formData.allowEditOwnResponses }),
          ...(formData.showTotalScore !== undefined && { showTotalScore: formData.showTotalScore }),
          ...(formData.httpConfig !== undefined && { httpConfig: formData.httpConfig })
        };
      }

      console.log("updateFormOperation - Updating Supabase with data:", updateData);

      const { data, error } = await supabase
        .from('formulario_construccion')
        .update(updateData)
        .eq('id', finalNumericId)
        .select()
        .single();

      if (error) {
        console.error("updateFormOperation - Supabase update error:", error);
        throw new Error(`Failed to update form: ${error.message}`);
      }

      console.log("updateFormOperation - Form updated in Supabase:", data);

      // Convert updated data back to Form format with proper collaborators handling
      const updatedForm: Form = {
        id: data.id.toString(),
        title: data.titulo || '',
        description: data.descripcion || '',
        fields: data.preguntas || [],
        isPrivate: data.configuracion?.isPrivate || false,
        allowedUsers: data.acceso || [],
        collaborators: Array.isArray(data.colaboradores) ? data.colaboradores : [],
        createdAt: data.created_at,
        updatedAt: data.created_at,
        accessLink: crypto.randomUUID(),
        ownerId: data.administrador || '',
        formColor: data.configuracion?.formColor || '#3b82f6',
        allowViewOwnResponses: data.configuracion?.allowViewOwnResponses || false,
        allowEditOwnResponses: data.configuracion?.allowEditOwnResponses || false,
        showTotalScore: data.configuracion?.showTotalScore || false,
        scoreRanges: data.rangos_mensajes || []
      };

      console.log("updateFormOperation - Updated form with collaborators:", updatedForm.collaborators);

      // Update local state with proper ID matching
      setForms(prev => prev.map(form => form.id === id ? updatedForm : form));

      // Update allowed users if needed
      if (formData.allowedUsers) {
        setAllowedUsers(prev => ({ ...prev, [id]: formData.allowedUsers || [] }));
      }

      toast({
        title: 'Formulario actualizado',
        description: 'Los cambios se han guardado exitosamente',
      });

      return updatedForm;
    } catch (error) {
      console.error("updateFormOperation - Error:", error);
      toast({
        title: 'Error al actualizar formulario',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
      throw error;
    }
  };
};

export const deleteFormOperation = (
  forms: Form[],
  setForms: React.Dispatch<React.SetStateAction<Form[]>>,
  setAllowedUsers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
  setAccessTokens: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setResponses: React.Dispatch<React.SetStateAction<any[]>>,
  responses: any[]
) => {
  return async (id: string): Promise<boolean> => {
    try {
      // Validate form ID format
      if (!validateFormId(id)) {
        throw new Error(`Invalid form ID format: ${id}. Expected a numeric ID or UUID.`);
      }

      // Convert string ID to number for Supabase query
      const numericId = /^\d+$/.test(id) ? parseInt(id, 10) : id;

      const { error } = await supabase
        .from('formulario_construccion')
        .delete()
        .eq('id', numericId);

      if (error) {
        console.error("Supabase delete error:", error);
        throw new Error(`Failed to delete form: ${error.message}`);
      }

      // Update local state
      setForms(prev => prev.filter(form => form.id !== id));
      setAllowedUsers(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      setAccessTokens(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      // Remove related responses
      setResponses(prev => prev.filter(response => response.formId !== id));

      toast({
        title: 'Formulario eliminado',
        description: 'El formulario ha sido eliminado exitosamente',
      });

      return true;
    } catch (error) {
      console.error("Error in deleteFormOperation:", error);
      toast({
        title: 'Error al eliminar formulario',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
      return false;
    }
  };
};

export const getFormOperation = (forms: Form[]) => {
  return (id: string): Form | undefined => {
    return forms.find(form => form.id === id);
  };
};
