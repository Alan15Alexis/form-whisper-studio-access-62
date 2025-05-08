
import { v4 as uuidv4 } from 'uuid';
import { FormResponse } from '@/types/form';
import { toast } from "@/components/ui/use-toast";
import { sendHttpRequest, validateFormResponses } from '@/utils/http-utils';
import { supabase } from '@/integrations/supabase/client';

export const submitFormResponseOperation = (
  getForm: (id: string) => any,
  setResponses: React.Dispatch<React.SetStateAction<FormResponse[]>>,
  currentUser: { email: string } | null | undefined,
  apiEndpoint: string
) => {
  return async (formId: string, data: Record<string, any>, formFromLocation: any = null): Promise<FormResponse> => {
    // Validar que los datos no estén vacíos
    if (!validateFormResponses(data)) {
      toast({
        title: "Error",
        description: "No se pueden enviar respuestas vacías",
        variant: "destructive",
      });
      throw new Error("Las respuestas del formulario no pueden estar vacías");
    }
    
    // First try to get the form from the location state if provided
    let form = formFromLocation;
    
    // If not available in location, try to get it from the context
    if (!form) {
      form = getForm(formId);
    }
    
    if (!form) {
      toast({
        title: "Error",
        description: "No se encontró el formulario",
        variant: "destructive",
      });
      throw new Error("No se encontró el formulario");
    }
    
    // Get user email - ensure we always have a valid user identifier
    const userEmail = currentUser?.email || localStorage.getItem('userEmail');
    
    if (!userEmail) {
      toast({
        title: "Error", 
        description: "No se pudo identificar al usuario",
        variant: "destructive",
      });
      throw new Error("No se pudo identificar al usuario");
    }
    
    // Convert response data to use question labels instead of IDs
    const formattedResponses: Record<string, any> = {};
    
    // Create a mapping between field IDs and their labels
    if (Array.isArray(form.fields)) {
      form.fields.forEach(field => {
        if (data[field.id] !== undefined) {
          const label = field.label || `Pregunta ${field.id.substring(0, 5)}`;
          formattedResponses[label] = data[field.id];
        }
      });
    }
    
    const response: FormResponse = {
      id: uuidv4(),
      formId,
      responses: data, // Keep original format for internal usage
      submittedBy: userEmail,
      submittedAt: new Date().toISOString(),
    };
    
    // Make sure we persist the responses to localStorage FIRST to ensure local state is updated
    // This is crucial for showing the form as completed even if database operations fail
    const updatedResponses = JSON.parse(localStorage.getItem('formResponses') || '[]');
    updatedResponses.push(response);
    localStorage.setItem('formResponses', JSON.stringify(updatedResponses));
    
    // Update the state after localStorage has been updated
    setResponses(prev => {
      console.log('Setting responses:', [...prev, response]);
      return [...prev, response];
    });
    
    try {
      // Get admin email (form creator)
      const adminEmail = form.createdBy || form.ownerId || null;
      
      // Save to Supabase (formulario table) - explicitly including user email and status
      await supabase
        .from('formulario')
        .insert({
          nombre_formulario: form.title || 'Untitled Form',
          nombre_invitado: userEmail,  // Ensure we use the correct user email
          nombre_administrador: adminEmail || null,
          respuestas: formattedResponses,
          estatus: true // Set the status to true for completed forms
        });

      console.log(`Form response saved to Supabase for user ${userEmail} with status=true`);

      // Send to MySQL database through API
      try {
        // Prepare data for MySQL submission
        const mysqlData = {
          form_id: formId,
          responses: JSON.stringify(formattedResponses),
          submitted_by: userEmail, // Ensure we use the correct user email
          form_title: form.title || 'Untitled Form',
          estatus: true // Add status field here too for MySQL
        };
        
        // Send to MySQL API endpoint
        await sendHttpRequest({
          url: apiEndpoint,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: mysqlData,
          timeout: 15000
        });
        
        toast({
          title: "Respuesta guardada",
          description: "La respuesta fue guardada correctamente",
        });
      } catch (error) {
        console.error('Error saving to MySQL:', error);
        // Even if MySQL fails, we've already saved to local state and Supabase
        toast({
          title: "Aviso",
          description: "La respuesta fue guardada pero hubo un problema al sincronizar con la base de datos",
          variant: "default"
        });
        // We don't throw an error here so the submission still counts as successful
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      // We still consider the form submitted since it's saved in local state
      toast({
        title: "Aviso",
        description: "La respuesta fue guardada localmente, pero hubo un problema al guardarla en la nube",
        variant: "default"
      });
      // We don't throw an error here so the submission still counts as successful
    }
    
    return response;
  };
};

export const getFormResponsesOperation = (responses: FormResponse[]) => {
  return (formId: string): FormResponse[] => {
    return responses.filter(response => response.formId === formId);
  };
};
