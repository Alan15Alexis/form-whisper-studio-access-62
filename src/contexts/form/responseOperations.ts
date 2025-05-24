
import { v4 as uuidv4 } from 'uuid';
import { FormResponse } from '@/types/form';
import { toast } from "@/hooks/use-toast";
import { processFormData, formatResponsesWithLabels, saveFormResponseToDatabase } from '@/utils/formResponseUtils';

export const submitFormResponseOperation = (
  getForm: (id: string) => any,
  setResponses: React.Dispatch<React.SetStateAction<any[]>>,
  currentUser: { email: string } | null,
  apiEndpoint: string
) => {
  return async (formId: string, data: Record<string, any>, formFromLocation: any = null): Promise<FormResponse> => {
    console.log('=== STARTING FORM SUBMISSION ===');
    console.log('Form ID:', formId);
    console.log('Current User:', currentUser);
    console.log('Form Data:', data);
    
    // Use form from location if provided, otherwise fetch it
    const form = formFromLocation || getForm(formId);
    if (!form) {
      console.error('Form not found');
      toast({
        title: 'Error',
        description: 'Form not found',
        variant: 'destructive',
      });
      throw new Error('Form not found');
    }

    console.log('Form found:', form.title);

    // Get user email from various sources
    const userEmail = currentUser?.email || localStorage.getItem('userEmail') || 'anonymous';
    console.log('User email for submission:', userEmail);

    try {
      console.log('Processing form data...');
      // Process file uploads and other data
      const processedData = await processFormData(form, data, userEmail, formId);
      console.log('Processed data:', processedData);

      // Format responses with labels for database storage
      const formattedResponses = formatResponsesWithLabels(form.fields, processedData);
      console.log('Formatted responses for database:', formattedResponses);

      // Create response object for local state
      const responseId = uuidv4();
      const response: FormResponse = {
        id: responseId,
        formId,
        responses: processedData,
        submittedBy: userEmail,
        submittedAt: new Date().toISOString()
      };

      console.log('Response object created:', response);

      // Save response to local state first
      setResponses(prev => {
        const updated = [...prev, response];
        console.log('Updated local responses:', updated.length);
        return updated;
      });

      // Save to database (Supabase + MySQL)
      console.log('Saving to database...');
      await saveFormResponseToDatabase(
        form,
        formId,
        userEmail,
        formattedResponses,
        apiEndpoint
      );

      console.log('=== FORM SUBMISSION COMPLETED SUCCESSFULLY ===');
      
      toast({
        title: 'Formulario enviado',
        description: 'Su respuesta ha sido guardada correctamente',
        variant: 'default',
      });
      
      return response;
    } catch (error) {
      console.error('=== FORM SUBMISSION ERROR ===', error);
      toast({
        title: 'Error al enviar formulario',
        description: error instanceof Error ? error.message : 'Por favor intenta nuevamente más tarde',
        variant: 'destructive',
      });
      throw error;
    }
  };
};

export const getFormResponsesOperation = (
  responses: any[]
) => {
  return (formId: string): any[] => {
    return responses.filter(response => response.formId === formId);
  };
};
