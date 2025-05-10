
import { v4 as uuidv4 } from 'uuid';
import { FormResponse } from '@/types/form';
import { toast } from "@/components/ui/use-toast";
import { validateFormResponses } from '@/utils/http-utils';
import { processFormData, formatResponsesWithLabels, saveFormResponseToDatabase } from '@/utils/formResponseUtils';

export const submitFormResponseOperation = (
  getForm: (id: string) => any,
  setResponses: React.Dispatch<React.SetStateAction<FormResponse[]>>,
  currentUser: { email: string } | null | undefined,
  apiEndpoint: string
) => {
  return async (formId: string, data: Record<string, any>, formFromLocation: any = null): Promise<FormResponse> => {
    // Validate that data is not empty
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
    
    // Process form data including file uploads
    const processedData = await processFormData(form, data, userEmail, formId);
    
    // Convert response data to use question labels instead of IDs
    const formattedResponses = formatResponsesWithLabels(form.fields, processedData);
    
    // Create the response object
    const response: FormResponse = {
      id: uuidv4(),
      formId,
      responses: processedData, // Keep original format for internal usage
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
    
    // Save the response to databases
    await saveFormResponseToDatabase(form, formId, userEmail, formattedResponses, apiEndpoint);
    
    return response;
  };
};

export const getFormResponsesOperation = (responses: FormResponse[]) => {
  return (formId: string): FormResponse[] => {
    return responses.filter(response => response.formId === formId);
  };
};
