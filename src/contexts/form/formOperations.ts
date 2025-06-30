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

// Simplified and more reliable function to get the database ID for form updates
const getFormDatabaseId = async (formId: string): Promise<number | null> => {
  console.log('getFormDatabaseId - Looking for form with ID:', formId);
  
  try {
    // If it's already numeric, use it directly
    if (/^\d+$/.test(formId)) {
      const numericId = parseInt(formId, 10);
      console.log('getFormDatabaseId - Using numeric ID directly:', numericId);
      return numericId;
    }
    
    // If it's not numeric, it could be a UUID - try to find it in the database
    console.log('getFormDatabaseId - Searching database for form ID:', formId);
    const { data: dbForm, error } = await supabase
      .from('formulario_construccion')
      .select('id')
      .eq('id', formId)
      .maybeSingle();
    
    if (error) {
      console.error('getFormDatabaseId - Database search error:', error);
      return null;
    }
    
    if (dbForm) {
      console.log('getFormDatabaseId - Found form in database with ID:', dbForm.id);
      return dbForm.id;
    }
    
    console.error('getFormDatabaseId - Form not found in database:', formId);
    return null;
  } catch (error) {
    console.error('getFormDatabaseId - Error:', error);
    return null;
  }
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

      // Get the database ID for the form using the improved function
      const databaseId = await getFormDatabaseId(id);
      
      if (databaseId === null) {
        throw new Error(`Cannot resolve form ID "${id}" to database format. Form may not exist.`);
      }
      
      console.log('updateFormOperation - Using database ID for update:', databaseId);
      
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
      
      // Handle configuration updates - get current config first to preserve existing settings
      if (formData.isPrivate !== undefined || 
          formData.formColor !== undefined || 
          formData.allowViewOwnResponses !== undefined || 
          formData.allowEditOwnResponses !== undefined ||
          formData.showTotalScore !== undefined ||
          formData.httpConfig !== undefined) {
        
        try {
          const { data: currentData, error: fetchError } = await supabase
            .from('formulario_construccion')
            .select('configuracion')
            .eq('id', databaseId)
            .maybeSingle();
          
          if (fetchError) {
            console.warn('updateFormOperation - Could not fetch current config, using defaults:', fetchError);
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
        } catch (configError) {
          console.error('updateFormOperation - Error fetching current config:', configError);
          // Create config from scratch if we can't fetch current one
          updateData.configuracion = {
            isPrivate: formData.isPrivate || false,
            formColor: formData.formColor || '#3b82f6',
            allowViewOwnResponses: formData.allowViewOwnResponses || false,
            allowEditOwnResponses: formData.allowEditOwnResponses || false,
            showTotalScore: formData.showTotalScore || false,
            httpConfig: formData.httpConfig
          };
        }
      }

      console.log("updateFormOperation - Updating Supabase with data:", updateData);

      const { data, error } = await supabase
        .from('formulario_construccion')
        .update(updateData)
        .eq('id', databaseId)
        .select()
        .maybeSingle();

      if (error) {
        console.error("updateFormOperation - Supabase update error:", error);
        throw new Error(`Failed to update form: ${error.message}`);
      }

      if (!data) {
        throw new Error('Form update completed but no data returned from database');
      }

      console.log("updateFormOperation - Form updated in Supabase:", data);

      // Convert updated data back to Form format with proper collaborators handling
      const updatedForm: Form = {
        id: id, // Keep the original ID format for consistency
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
