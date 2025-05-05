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
  return async (formId: string, data: Record<string, any>): Promise<FormResponse> => {
    // Validar que los datos no estén vacíos
    if (!validateFormResponses(data)) {
      toast({
        title: "Error",
        description: "No se pueden enviar respuestas vacías",
        variant: "destructive",
      });
      throw new Error("Las respuestas del formulario no pueden estar vacías");
    }
    
    const form = getForm(formId);
    
    if (!form) {
      throw new Error("No se encontró el formulario");
    }
    
    // Convert response data to use question labels instead of IDs
    const formattedResponses: Record<string, any> = {};
    
    // Create a mapping between field IDs and their labels
    form.fields.forEach(field => {
      if (data[field.id] !== undefined) {
        const label = field.label || `Pregunta ${field.id.substring(0, 5)}`;
        formattedResponses[label] = data[field.id];
      }
    });
    
    const response: FormResponse = {
      id: uuidv4(),
      formId,
      responses: data, // Keep original format for internal usage
      submittedBy: currentUser?.email,
      submittedAt: new Date().toISOString(),
    };
    
    // Save response locally
    setResponses(prev => [...prev, response]);
    
    try {
      // Get admin email (form creator)
      const adminEmail = form.createdBy || null;
      
      // Save to Supabase (usuario_invitado table)
      await supabase
        .from('formulario')
        .insert({
          nombre_formulario: form.title || 'Untitled Form',
          nombre_invitado: currentUser?.email || 'anonymous',
          nombre_administrador: adminEmail || null,
          respuestas: formattedResponses // Use formatted responses with labels
        });

      // Send to MySQL database through API
      try {
        // Prepare data for MySQL submission
        const mysqlData = {
          form_id: formId,
          responses: JSON.stringify(formattedResponses), // Use formatted responses with labels
          submitted_by: currentUser?.email || 'anonymous',
          form_title: form.title || 'Untitled Form'
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
          description: "La respuesta fue guardada localmente, en Supabase y en la base de datos MySQL",
        });
      } catch (error) {
        console.error('Error saving to MySQL:', error);
        toast({
          title: "Error al guardar en MySQL",
          description: "La respuesta fue guardada localmente y en Supabase, pero hubo un problema al guardarla en la base de datos MySQL",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      toast({
        title: "Error al guardar en Supabase",
        description: "La respuesta fue guardada localmente, pero hubo un problema al guardarla en Supabase",
        variant: "destructive"
      });
    }
    
    return response;
  };
};

export const getFormResponsesOperation = (responses: FormResponse[]) => {
  return (formId: string): FormResponse[] => {
    return responses.filter(response => response.formId === formId);
  };
};
