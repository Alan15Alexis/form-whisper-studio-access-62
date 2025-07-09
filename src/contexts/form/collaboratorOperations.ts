
import { supabase } from '@/integrations/supabase/client';

// Enhanced helper function to process collaborators data with better error handling
export const processCollaborators = (collaboratorsData: any): string[] => {
  console.log('processCollaborators - Processing raw data:', collaboratorsData);
  
  if (!collaboratorsData) {
    console.log('processCollaborators - No collaborators data, returning empty array');
    return [];
  }
  
  if (Array.isArray(collaboratorsData)) {
    const processed = collaboratorsData
      .filter(item => item && typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim().toLowerCase());
    
    console.log('processCollaborators - Processed array:', processed);
    return processed;
  }
  
  if (typeof collaboratorsData === 'string') {
    // Handle empty string case
    if (collaboratorsData.trim() === '') {
      return [];
    }
    
    try {
      const parsed = JSON.parse(collaboratorsData);
      if (Array.isArray(parsed)) {
        const processed = parsed
          .filter(item => item && typeof item === 'string' && item.trim().length > 0)
          .map(item => item.trim().toLowerCase());
        
        console.log('processCollaborators - Processed from JSON string:', processed);
        return processed;
      }
    } catch (error) {
      console.warn('processCollaborators - Failed to parse JSON string, treating as single email:', error);
      // If it's not valid JSON, treat it as a single email
      const email = collaboratorsData.trim().toLowerCase();
      return email ? [email] : [];
    }
  }
  
  console.log('processCollaborators - Unrecognized format, returning empty array');
  return [];
};

export const updateCollaboratorsInDatabase = async (formId: string, collaborators: string[]) => {
  try {
    const { error } = await supabase
      .from('formulario_construccion')
      .update({ colaboradores: collaborators })
      .eq('id', formId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating collaborators in database:', error);
    throw error;
  }
};
