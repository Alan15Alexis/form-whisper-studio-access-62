
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
      
      // Enhanced strategy: Try direct numeric ID match first (most reliable)
      const numericFormId = parseInt(formId);
      if (!isNaN(numericFormId)) {
        console.log("useFormScoring - Trying numeric ID match:", numericFormId);
        
        const { data: directMatch, error: directError } = await supabase
          .from('formulario_construccion')
          .select('id, titulo, rangos_mensajes, configuracion')
          .eq('id', numericFormId)
          .single();
        
        if (!directError && directMatch) {
          console.log("useFormScoring - Found form by direct ID match:", directMatch.titulo);
          
          // Priority 1: rangos_mensajes column (new dedicated column)
          if (directMatch.rangos_mensajes && Array.isArray(directMatch.rangos_mensajes) && directMatch.rangos_mensajes.length > 0) {
            console.log("useFormScoring - Found score ranges in rangos_mensajes:", directMatch.rangos_mensajes);
            return [...directMatch.rangos_mensajes]; // Return a copy
          }
          
          // Priority 2: configuracion.scoreRanges (fallback for older data)
          if (!directMatch.rangos_mensajes && directMatch.configuracion?.scoreRanges && Array.isArray(directMatch.configuracion.scoreRanges) && directMatch.configuracion.scoreRanges.length > 0) {
            console.log("useFormScoring - Found score ranges in configuracion (fallback):", directMatch.configuracion.scoreRanges);
            return [...directMatch.configuracion.scoreRanges]; // Return a copy
          }
          
          console.log("useFormScoring - Form found but no score ranges configured for this specific form");
          return [];
        } else {
          console.log("useFormScoring - No form found with numeric ID:", numericFormId, "Error:", directError?.message);
          return [];
        }
      }
      
      // For UUID formIds, don't search through other forms to avoid showing wrong ranges
      console.log("useFormScoring - UUID formId provided, not searching other forms to avoid showing wrong ranges");
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
    
    // Enhanced: First try to get score ranges from database if formId is provided
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
        scoreRanges = [...fieldWithRanges.scoreRanges]; // Create a copy
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
