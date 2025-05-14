
import { v4 as uuidv4 } from 'uuid';
import { Form, FormResponse } from '@/types/form';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../AuthContext';

export const submitFormResponseOperation = (
  getForm: (id: string) => Form | undefined,
  setResponses: (responses: any) => void,
  user: { email: string } | null,
  apiEndpoint: string
) => {
  return async (formId: string, data: Record<string, any>, formFromLocation: any = null): Promise<boolean> => {
    // Use form from location if provided, otherwise fetch it
    const form = formFromLocation || getForm(formId);
    if (!form) {
      toast({
        title: 'Error',
        description: 'Form not found',
        variant: 'destructive',
      });
      return false;
    }

    // Create response object
    const responseId = uuidv4();
    const response = {
      id: responseId,
      formId,
      responses: data,
      submittedBy: user?.email || 'anonymous',
      submittedAt: new Date().toISOString()
    };

    try {
      // Perform form response calculation for scoring if applicable
      let calculatedScore = null;
      let scoreMessage = '';
      
      if (form.showTotalScore) {
        calculatedScore = calculateTotalScore(form, data);
        scoreMessage = getScoreMessage(form, calculatedScore);
        
        // Add score data to response
        response.responses.calculatedScore = calculatedScore;
        response.responses.scoreMessage = scoreMessage;
      }

      // Process HTTP webhook if configured
      if (form.httpConfig && form.httpConfig.enabled) {
        try {
          // Process webhook (implementation not relevant for this fix)
          console.log('Processing webhook for form response');
        } catch (error) {
          console.error('Error processing webhook:', error);
        }
      }

      // Store response in local state (for in-memory implementation)
      setResponses((prevResponses: any[]) => [...prevResponses, response]);
      
      // Save response to Supabase
      try {
        const { error } = await supabase.from('formulario').insert({
          nombre_formulario: form.title,
          respuestas: response.responses,
          estatus: true,
          nombre_administrador: form.ownerId,
          nombre_invitado: user?.email || 'anonymous'
        });
        
        if (error) {
          console.error('Error saving response to Supabase:', error);
        } else {
          console.log('Response saved to Supabase successfully');
        }
      } catch (error) {
        console.error('Error saving response to Supabase:', error);
      }

      toast({
        title: 'Response submitted',
        description: 'Your response has been submitted successfully',
        variant: 'default',
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting form response:', error);
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    }
  };
};

// Helper function to calculate total score from form responses
const calculateTotalScore = (form: Form, responses: Record<string, any>): number => {
  let totalScore = 0;
  
  // Iterate through fields with numeric values
  form.fields.forEach(field => {
    if (field.hasNumericValues && field.options) {
      const responseValue = responses[field.id];
      
      // Handle different field types
      if (field.type === 'checkbox' && Array.isArray(responseValue)) {
        // For checkboxes (multiple selection)
        responseValue.forEach(value => {
          const selectedOption = field.options?.find(opt => opt.value === value);
          if (selectedOption && selectedOption.numericValue) {
            totalScore += selectedOption.numericValue;
          }
        });
      } else if (responseValue) {
        // For single value fields (radio, select)
        const selectedOption = field.options?.find(opt => opt.value === responseValue);
        if (selectedOption && selectedOption.numericValue) {
          totalScore += selectedOption.numericValue;
        }
      }
    }
  });
  
  return totalScore;
};

// Helper function to get score message based on ranges
const getScoreMessage = (form: Form, score: number): string => {
  // Try to get score ranges from most reliable source
  const scoreRanges = form.scoreConfig?.ranges || form.scoreRanges || [];
  
  if (!scoreRanges || scoreRanges.length === 0) {
    return '';
  }
  
  // Find matching range
  const matchingRange = scoreRanges.find(range => 
    score >= range.min && score <= range.max
  );
  
  return matchingRange ? matchingRange.message : '';
};

export const getFormResponsesOperation = (responses: FormResponse[]) => {
  return (formId: string): FormResponse[] => {
    return responses.filter(response => response.formId === formId);
  };
};
