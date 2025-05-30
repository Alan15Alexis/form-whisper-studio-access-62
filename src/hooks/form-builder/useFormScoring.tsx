
import { FormField, ScoreRange } from "@/types/form";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export function useFormScoring() {
  const [formScoreRanges, setFormScoreRanges] = useState<ScoreRange[]>([]);

  const fetchScoreRangesFromDB = async (formId: string): Promise<ScoreRange[]> => {
    try {
      console.log("useFormScoring - Starting comprehensive search for formId:", formId);
      
      // Strategy 1: Direct UUID lookup in the 'id' field (assuming it might be stored as text)
      console.log("useFormScoring - Attempting direct UUID lookup");
      
      const { data: directResult, error: directError } = await supabase
        .from('formulario_construccion')
        .select('id, titulo, configuracion')
        .eq('id', formId);
      
      if (!directError && directResult && directResult.length > 0) {
        const form = directResult[0];
        console.log("useFormScoring - Found form by direct UUID lookup:", form.titulo);
        console.log("useFormScoring - Configuration:", form.configuracion);
        
        if (form.configuracion?.scoreRanges && Array.isArray(form.configuracion.scoreRanges)) {
          console.log("useFormScoring - Found score ranges:", form.configuracion.scoreRanges);
          return form.configuracion.scoreRanges;
        }
      }

      // Strategy 2: Try numeric ID lookup if formId is a number
      const numericId = parseInt(formId);
      if (!isNaN(numericId)) {
        console.log("useFormScoring - Attempting numeric ID lookup for:", numericId);
        
        const { data: numericResult, error: numericError } = await supabase
          .from('formulario_construccion')
          .select('id, titulo, configuracion')
          .eq('id', numericId);
        
        if (!numericError && numericResult && numericResult.length > 0) {
          const form = numericResult[0];
          console.log("useFormScoring - Found form by numeric ID:", form.titulo);
          console.log("useFormScoring - Configuration:", form.configuracion);
          
          if (form.configuracion?.scoreRanges && Array.isArray(form.configuracion.scoreRanges)) {
            console.log("useFormScoring - Found score ranges:", form.configuracion.scoreRanges);
            return form.configuracion.scoreRanges;
          }
        }
      }

      // Strategy 3: Search all forms and check if the UUID matches any stored form reference
      console.log("useFormScoring - Searching all forms for comprehensive UUID matches");
      
      const { data: allForms, error: allFormsError } = await supabase
        .from('formulario_construccion')
        .select('*')
        .not('configuracion', 'is', null);
      
      if (allFormsError) {
        console.error("useFormScoring - Error fetching all forms:", allFormsError);
        return [];
      }

      if (!allForms || allForms.length === 0) {
        console.log("useFormScoring - No forms found in database");
        return [];
      }

      console.log(`useFormScoring - Searching through ${allForms.length} forms for UUID ${formId}`);
      
      for (const form of allForms) {
        console.log(`useFormScoring - Checking form ID ${form.id}: "${form.titulo}"`);
        
        // Check if the UUID appears anywhere in the form data
        const formString = JSON.stringify(form);
        if (formString.includes(formId)) {
          console.log(`useFormScoring - Found UUID match in form ${form.id}: "${form.titulo}"`);
          
          if (form.configuracion?.scoreRanges && Array.isArray(form.configuracion.scoreRanges)) {
            console.log("useFormScoring - Found score ranges:", form.configuracion.scoreRanges);
            return form.configuracion.scoreRanges;
          } else {
            console.log("useFormScoring - Form found but no scoreRanges array in configuration");
            // Even if no scoreRanges, let's return what we found
            return [];
          }
        }
      }

      // Strategy 4: Look for forms where the current UUID might be in a different field
      console.log("useFormScoring - Checking for forms with similar patterns");
      
      // Check if any form has the UUID in preguntas or other fields
      for (const form of allForms) {
        if (form.preguntas) {
          const preguntasString = JSON.stringify(form.preguntas);
          if (preguntasString.includes(formId)) {
            console.log(`useFormScoring - Found UUID in preguntas for form ${form.id}: "${form.titulo}"`);
            
            if (form.configuracion?.scoreRanges && Array.isArray(form.configuracion.scoreRanges)) {
              console.log("useFormScoring - Found score ranges:", form.configuracion.scoreRanges);
              return form.configuracion.scoreRanges;
            }
          }
        }
      }

      console.log("useFormScoring - No matching forms found for formId:", formId);
      return [];
      
    } catch (error) {
      console.error("useFormScoring - Unexpected error in fetchScoreRangesFromDB:", error);
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
      scoreRanges = await fetchScoreRangesFromDB(formId);
    }
    
    // Fallback to fields if no ranges found in DB
    if (scoreRanges.length === 0 && fields) {
      const fieldWithRanges = fields.find(field => 
        field.scoreRanges && field.scoreRanges.length > 0
      );
      
      if (fieldWithRanges?.scoreRanges) {
        scoreRanges = fieldWithRanges.scoreRanges;
      }
    }
    
    if (scoreRanges.length === 0) {
      console.log("No score ranges found");
      return null;
    }
    
    console.log("Using score ranges:", JSON.stringify(scoreRanges));
    
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
