
import { v4 as uuidv4 } from 'uuid';
import { FormResponse } from '@/types/form';
import { toast } from "@/components/ui/use-toast";

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

    // Create response object
    const responseId = uuidv4();
    const response: FormResponse = {
      id: responseId,
      formId,
      responses: data,
      submittedBy: user?.email,
      submittedAt: new Date().toISOString()
    };

    try {
      console.log('Submitting form response:', response);
      
      // Save response to local state
      setResponses(prev => [...prev, response]);
      
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
        title: 'Form submitted',
        description: 'Your response has been submitted successfully',
        variant: 'default',
      });
      
      return response;
    } catch (error) {
      console.error('Error submitting form response:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
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
