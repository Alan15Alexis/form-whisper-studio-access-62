
import { v4 as uuidv4 } from 'uuid';
import { FormResponse } from '@/types/form';
import { toast } from "@/components/ui/use-toast";
import { sendHttpRequest, validateFormResponses } from '@/utils/http-utils';

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
    
    const response: FormResponse = {
      id: uuidv4(),
      formId,
      responses: data,
      submittedBy: currentUser?.email,
      submittedAt: new Date().toISOString(),
    };
    
    // Save response locally
    setResponses(prev => [...prev, response]);
    
    // Send to MySQL database through API
    try {
      // Prepare data for MySQL submission
      const mysqlData = {
        form_id: formId,
        responses: JSON.stringify(data),
        submitted_by: currentUser?.email || 'anonymous',
        form_title: form?.title || 'Untitled Form'
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
        description: "La respuesta fue guardada localmente y en la base de datos MySQL",
      });
    } catch (error) {
      console.error('Error saving to MySQL:', error);
      toast({
        title: "Error al guardar en MySQL",
        description: "La respuesta fue guardada localmente, pero hubo un problema al guardarla en la base de datos MySQL",
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
