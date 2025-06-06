
import { Form, FormResponse } from '@/types/form';
import { processFormData, saveFormResponseToDatabase, formatResponsesWithLabels } from '@/utils/formResponseUtils';

// Submit form response operation
export const submitFormResponseOperation = (
  getForm: (id: string) => Form | undefined,
  setResponses: React.Dispatch<React.SetStateAction<FormResponse[]>>,
  currentUser: { email: string } | null,
  apiEndpoint: string
) => {
  return async (
    formId: string, 
    data: Record<string, any>, 
    formFromLocation: any = null,
    scoreData: any = null
  ): Promise<FormResponse> => {
    try {
      // Get the form using the provided formId
      const form = formFromLocation || getForm(formId);
      if (!form) {
        throw new Error('Form not found');
      }

      // Get user email (for anonymous users, use a placeholder)
      const userEmail = currentUser?.email || 'anonymous@user.com';

      console.log("Processing form response submission:");
      console.log("- Form ID:", formId);
      console.log("- User:", userEmail);
      console.log("- Data length:", Object.keys(data).length);
      console.log("- Score data:", scoreData);

      // Process form data (handle file uploads, etc.)
      const processedData = await processFormData(form, data, userEmail, formId);
      
      // Format responses to use labels instead of IDs and include score feedback from DB
      const formattedResponses = await formatResponsesWithLabels(form.fields, processedData, formId);
      
      // Add score data to formatted responses if available
      if (scoreData) {
        console.log("Adding score data to formatted responses:", scoreData);
        formattedResponses['_puntuacion_total'] = scoreData.totalScore;
        formattedResponses['_mensaje_puntuacion'] = scoreData.feedback;
        formattedResponses['_fecha_puntuacion'] = scoreData.timestamp;
        
        // Also add to processed data for local storage
        processedData['_puntuacion_total'] = scoreData.totalScore;
        processedData['_mensaje_puntuacion'] = scoreData.feedback;
        processedData['_fecha_puntuacion'] = scoreData.timestamp;
      }
      
      // Create the response object - Using the correct FormResponse type properties
      const formResponse: FormResponse = {
        id: crypto.randomUUID(),
        formId,
        submittedBy: currentUser?.email || 'anonymous',
        submittedAt: new Date().toISOString(),
        data: processedData,
        formattedData: formattedResponses
      };
      
      // Save the response locally
      setResponses(prev => [...prev, formResponse]);

      // Save to database (Supabase and MySQL) - include score data
      await saveFormResponseToDatabase(form, formId, userEmail, formattedResponses, apiEndpoint);
      
      console.log("Form response saved successfully with score data:", formResponse);
      
      return formResponse;
    } catch (error) {
      console.error('Error submitting form response:', error);
      throw error;
    }
  };
};

// Get form responses operation
export const getFormResponsesOperation = (responses: FormResponse[]) => {
  return (formId: string, userEmail?: string): FormResponse[] => {
    if (userEmail) {
      // If userEmail is provided, filter by both formId and submittedBy
      return responses.filter(
        response => response.formId === formId && response.submittedBy === userEmail
      );
    }
    
    // Otherwise, just filter by formId
    return responses.filter(response => response.formId === formId);
  };
};
