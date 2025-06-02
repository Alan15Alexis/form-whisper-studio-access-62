
import { FormField, ScoreRange } from "@/types/form";
import { supabase } from "@/integrations/supabase/client";

export function useFormScoring() {
  const fetchScoreRangesFromDB = async (formId: string): Promise<ScoreRange[]> => {
    try {
      console.log("useFormScoring - Fetching score ranges for formId:", formId);
      
      if (!formId) {
        console.log("useFormScoring - No formId provided");
        return [];
      }
      
      // Strategy 1: Try direct numeric ID match first
      const numericFormId = parseInt(formId);
      if (!isNaN(numericFormId)) {
        console.log("useFormScoring - Trying numeric ID match:", numericFormId);
        
        const { data: directMatch, error: directError } = await supabase
          .from('formulario_construccion')
          .select('id, titulo, rangos_mensajes, configuracion, preguntas, created_at')
          .eq('id', numericFormId)
          .single();
        
        if (!directError && directMatch) {
          console.log("useFormScoring - Found form by direct ID match:", directMatch.titulo);
          
          if (directMatch.rangos_mensajes && Array.isArray(directMatch.rangos_mensajes)) {
            console.log("useFormScoring - Found score ranges in rangos_mensajes:", directMatch.rangos_mensajes);
            return directMatch.rangos_mensajes;
          }
          
          if (directMatch.configuracion?.scoreRanges && Array.isArray(directMatch.configuracion.scoreRanges)) {
            console.log("useFormScoring - Found score ranges in configuracion:", directMatch.configuracion.scoreRanges);
            return directMatch.configuracion.scoreRanges;
          }
          
          console.log("useFormScoring - Form found but no score ranges configured");
          return [];
        }
      }
      
      // Strategy 2: Search all forms for UUID matches in preguntas field
      console.log("useFormScoring - Searching all forms for UUID matches");
      
      const { data: allForms, error: allFormsError } = await supabase
        .from('formulario_construccion')
        .select('id, titulo, preguntas, rangos_mensajes, configuracion, created_at');
      
      if (allFormsError) {
        console.error("useFormScoring - Error fetching forms:", allFormsError);
        return [];
      }

      if (!allForms || allForms.length === 0) {
        console.log("useFormScoring - No forms found in database");
        return [];
      }

      console.log(`useFormScoring - Searching through ${allForms.length} forms for UUID: ${formId}`);
      
      // Search for the UUID in the preguntas field or any other field
      for (const form of allForms) {
        console.log(`useFormScoring - Checking form ID ${form.id}: "${form.titulo}"`);
        
        // Convert entire form to string for comprehensive search
        const formString = JSON.stringify(form).toLowerCase();
        const searchId = formId.toLowerCase();
        
        if (formString.includes(searchId)) {
          console.log(`useFormScoring - Found UUID match in form ID ${form.id}: "${form.titulo}"`);
          
          // Check rangos_mensajes first
          if (form.rangos_mensajes && Array.isArray(form.rangos_mensajes)) {
            console.log("useFormScoring - Found score ranges in rangos_mensajes:", form.rangos_mensajes);
            return form.rangos_mensajes;
          }
          
          // Fallback to configuracion
          if (form.configuracion?.scoreRanges && Array.isArray(form.configuracion.scoreRanges)) {
            console.log("useFormScoring - Found score ranges in configuracion:", form.configuracion.scoreRanges);
            return form.configuracion.scoreRanges;
          }
          
          console.log(`useFormScoring - Form "${form.titulo}" found but no score ranges configured`);
          return [];
        }
      }

      // Strategy 3: Search by form title if no UUID match found
      console.log("useFormScoring - No UUID match found, searching by context");
      
      // If we're on an edit page, try to find the most recently created form
      const sortedForms = allForms.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      
      for (const form of sortedForms.slice(0, 3)) { // Check the 3 most recent forms
        console.log(`useFormScoring - Checking recent form ID ${form.id}: "${form.titulo}"`);
        
        if (form.rangos_mensajes && Array.isArray(form.rangos_mensajes) && form.rangos_mensajes.length > 0) {
          console.log(`useFormScoring - Using score ranges from recent form "${form.titulo}":`, form.rangos_mensajes);
          return form.rangos_mensajes;
        }
        
        if (form.configuracion?.scoreRanges && Array.isArray(form.configuracion.scoreRanges) && form.configuracion.scoreRanges.length > 0) {
          console.log(`useFormScoring - Using score ranges from recent form "${form.titulo}":`, form.configuracion.scoreRanges);
          return form.configuracion.scoreRanges;
        }
      }

      console.log("useFormScoring - No score ranges found in any form");
      return [];
      
    } catch (error) {
      console.error("useFormScoring - Unexpected error:", error);
      return [];
    }
  };

  const calculateTotalScore = (responses: Record<string, any>, fields: FormField[]): number => {
    let totalScore = 0;
    
    if (!fields) return totalScore;
    
    console.log("Calculating score for responses:", responses);
    console.log("Using fields:", fields);
    
    fields.forEach(field => {
      if (!field.hasNumericValues) return;
      
      const response = responses[field.id];
      console.log(`Field ${field.id} (${field.type}): response = `, response);
      
      if (response === undefined || response === null) return;
      
      // Skip file uploads, images, drawings and signatures - they don't contribute to score
      if (field.type === 'image-upload' || field.type === 'file-upload' || 
          field.type === 'drawing' || field.type === 'signature') {
        return;
      }
      
      if (field.type === 'checkbox' && Array.isArray(response)) {
        // For checkboxes, sum numeric values of all selected options
        response.forEach(value => {
          const option = field.options?.find(opt => opt.value === value);
          if (option && option.numericValue !== undefined) {
            console.log(`  Adding ${option.numericValue} from checkbox option ${option.label}`);
            totalScore += option.numericValue;
          }
        });
      } else if (field.type === 'yesno') {
        // For Yes/No fields, find the corresponding option
        const isYes = response === true || response === "true" || response === "yes" || response === "sí";
        const option = field.options?.[isYes ? 0 : 1]; // Assuming Yes is index 0 and No is index 1
        if (option && option.numericValue !== undefined) {
          console.log(`  Adding ${option.numericValue} from yesno option ${option.label}`);
          totalScore += option.numericValue;
        }
      } else if (field.type === 'radio' || field.type === 'select' || field.type === 'image-select') {
        // For single selections and image selections
        const option = field.options?.find(opt => opt.value === response);
        if (option && option.numericValue !== undefined) {
          console.log(`  Adding ${option.numericValue} from radio/select option ${option.label}`);
          totalScore += option.numericValue;
        }
      } else if (field.type === 'star-rating' || field.type === 'opinion-scale') {
        // For direct numeric ratings
        const numValue = parseInt(response);
        if (!isNaN(numValue)) {
          console.log(`  Adding ${numValue} from rating scale`);
          totalScore += numValue;
        }
      }
    });
    
    console.log("Total calculated score:", totalScore);
    return totalScore;
  };
  
  const getScoreFeedback = async (score: number, formId?: string, fields?: FormField[]): Promise<string | null> => {
    console.log("Getting feedback for score:", score, "formId:", formId);
    
    let scoreRanges: ScoreRange[] = [];
    
    // First try to get score ranges from database if formId is provided
    if (formId) {
      try {
        scoreRanges = await fetchScoreRangesFromDB(formId);
        console.log("Database score ranges found:", scoreRanges.length, scoreRanges);
      } catch (error) {
        console.error("Error fetching score ranges from DB:", error);
      }
    }
    
    // Fallback to fields if no ranges found in DB
    if (scoreRanges.length === 0 && fields) {
      const fieldWithRanges = fields.find(field => 
        field.scoreRanges && field.scoreRanges.length > 0
      );
      
      if (fieldWithRanges?.scoreRanges) {
        scoreRanges = fieldWithRanges.scoreRanges;
        console.log("Using field score ranges:", scoreRanges.length);
      }
    }
    
    if (scoreRanges.length === 0) {
      console.log("No score ranges found anywhere");
      return null;
    }
    
    console.log("Using score ranges for feedback:", JSON.stringify(scoreRanges));
    
    // Find a range that matches the current score
    const matchingRange = scoreRanges.find(range => 
      score >= range.min && score <= range.max
    );
    
    console.log("Matching range for score", score, ":", matchingRange);
    
    return matchingRange?.message || null;
  };

  const shouldShowScoreCard = (fields: FormField[], showTotalScore?: boolean): boolean => {
    // First check if the showTotalScore flag is explicitly set
    if (!showTotalScore) {
      console.log("Score card hidden: showTotalScore is false");
      return false;
    }
    
    // Then verify that at least one field has numeric values
    const hasNumericFields = fields.some(f => f.hasNumericValues);
    console.log("Has fields with numeric values:", hasNumericFields);
    
    // Must explicitly be true (not just truthy) and have numeric fields
    return hasNumericFields && showTotalScore === true;
  };

  return {
    calculateTotalScore,
    getScoreFeedback,
    shouldShowScoreCard,
    fetchScoreRangesFromDB
  };
}
