
import { v4 as uuidv4 } from 'uuid';
import { FormResponse } from '@/types/form';
import { toast } from "@/hooks/use-toast";
import { processFormData, formatResponsesWithLabels, saveFormResponseToDatabase } from '@/utils/formResponseUtils';
import { MYSQL_API_ENDPOINT } from './initialState';

export const submitFormResponseOperation = (
  getForm: (id: string) => any,
  setResponses: React.Dispatch<React.SetStateAction<any[]>>,
  user: { email: string } | null,
  apiEndpoint: string
) => {
  return async (formId: string, data: Record<string, any>, formFromLocation: any = null): Promise<FormResponse> => {
    // Use form from location if provided, otherwise fetch it
    const form = formFromLocation || getForm(formId);
    if (!form) {
      toast({
        title: 'Error',
        description: 'Form not found',
        variant: 'destructive',
      });
      throw new Error('Form not found');
    }

    // Get user email - try from user object, localStorage, or default
    const userEmail = user?.email || localStorage.getItem('userEmail') || 'anonymous@example.com';
    
    console.log('Submitting form response for user:', userEmail);
    console.log('Form data:', data);

    try {
      // Process form data (handle file uploads, etc.)
      const processedData = await processFormData(form, data, userEmail, formId);
      console.log('Processed form data:', processedData);

      // Format responses with labels for storage
      const formattedResponses = formatResponsesWithLabels(form.fields, processedData);
      console.log('Formatted responses:', formattedResponses);

      // Create response object for local state
      const responseId = uuidv4();
      const response: FormResponse = {
        id: responseId,
        formId,
        responses: processedData, // Use processed data with URLs
        submittedBy: userEmail,
        submittedAt: new Date().toISOString()
      };

      // Save response to local state first
      setResponses(prev => [...prev, response]);
      console.log('Response saved to local state');

      // Save to database (Supabase and MySQL)
      await saveFormResponseToDatabase(form, formId, userEmail, formattedResponses, MYSQL_API_ENDPOINT);
      console.log('Response saved to database successfully');

      // If the form has HTTP config enabled, send data to external API
      if (form.httpConfig && form.httpConfig.enabled && form.httpConfig.url) {
        try {
          const { url, method, headers, body } = form.httpConfig;
          
          // Parse headers
          const headersObj = headers?.reduce((acc, h) => {
            if (h.key && h.value) {
              acc[h.key] = h.value;
            }
            return acc;
          }, {} as Record<string, string>) || {};
          
          // Replace placeholder in body with actual response data
          let parsedBody = body;
          try {
            const bodyObj = JSON.parse(body);
            
            // If body contains "respuesta" key, replace with form response data
            if (bodyObj && typeof bodyObj === 'object' && 'id_del_elemento' in bodyObj) {
              bodyObj.id_del_elemento = response;
              parsedBody = JSON.stringify(bodyObj);
            }
          } catch (e) {
            console.error('Error parsing HTTP body:', e);
          }
          
          console.log('Sending HTTP request:', {
            url,
            method,
            headers: headersObj,
            body: parsedBody
          });
          
          // Make HTTP request
          const httpResponse = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headersObj
            },
            body: method === 'POST' ? parsedBody : undefined
          });
          
          // Save last response to form
          const httpData = await httpResponse.text();
          console.log('HTTP response:', httpResponse.status, httpData);
        } catch (error) {
          console.error('HTTP request error:', error);
        }
      }
      
      toast({
        title: 'Formulario enviado',
        description: 'Su respuesta ha sido enviada exitosamente',
        variant: 'default',
      });
      
      return response;
    } catch (error) {
      console.error('Error submitting form response:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
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
