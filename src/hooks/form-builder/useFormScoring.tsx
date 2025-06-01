
import { FormField, ScoreRange } from "@/types/form";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export function useFormScoring() {
  const [formScoreRanges, setFormScoreRanges] = useState<ScoreRange[]>([]);

  const fetchScoreRangesFromDB = async (formId: string): Promise<ScoreRange[]> => {
    try {
      console.log("useFormScoring - Fetching score ranges for formId:", formId);
      
      if (!formId) {
        console.log("useFormScoring - No formId provided");
        return [];
      }
      
      // Get all forms from database
      const { data: allForms, error: allFormsError } = await supabase
        .from('formulario_construccion')
        .select('*');
      
      if (allFormsError) {
        console.error("useFormScoring - Error fetching forms:", allFormsError);
        return [];
      }

      if (!allForms || allForms.length === 0) {
        console.log("useFormScoring - No forms found in database");
        return [];
      }

      console.log(`useFormScoring - Found ${allForms.length} forms in database`);
      
      // Try multiple search strategies to find the form
      for (const form of allForms) {
        console.log(`useFormScoring - Checking form ${form.id}: "${form.titulo}"`);
        
        // Strategy 1: Direct ID match (if formId is numeric)
        if (form.id.toString() === formId) {
          console.log("useFormScoring - Found form by direct ID match");
          if (form.rangos_mensajes && Array.isArray(form.rangos_mensajes)) {
            console.log("useFormScoring - Found score ranges by direct ID:", form.rangos_mensajes);
            return form.rangos_mensajes;
          }
        }
        
        // Strategy 2: Search in preguntas field for UUID matches
        if (form.preguntas) {
          const preguntasString = JSON.stringify(form.preguntas).toLowerCase();
          if (preguntasString.includes(formId.toLowerCase())) {
            console.log("useFormScoring - Found form by UUID in preguntas field");
            if (form.rangos_mensajes && Array.isArray(form.rangos_mensajes)) {
              console.log("useFormScoring - Found score ranges by UUID search:", form.rangos_mensajes);
              return form.rangos_mensajes;
            }
          }
        }
        
        // Strategy 3: Search in entire form object for UUID
        const formString = JSON.stringify(form).toLowerCase();
        if (formString.includes(formId.toLowerCase())) {
          console.log("useFormScoring - Found form by UUID in entire form object");
          if (form.rangos_mensajes && Array.isArray(form.rangos_mensajes)) {
            console.log("useFormScoring - Found score ranges by full search:", form.rangos_mensajes);
            return form.rangos_mensajes;
          }
        }
      }

      // Strategy 4: Fallback to configuracion.scoreRanges for existing data
      console.log("useFormScoring - No rangos_mensajes found, checking configuracion.scoreRanges as fallback");
      
      for (const form of allForms) {
        // Try same matching strategies for fallback
        if (form.id.toString() === formId || 
            (form.preguntas && JSON.stringify(form.preguntas).toLowerCase().includes(formId.toLowerCase())) ||
            JSON.stringify(form).toLowerCase().includes(formId.toLowerCase())) {
          
          if (form.configuracion?.scoreRanges && Array.isArray(form.configuracion.scoreRanges)) {
            console.log("useFormScoring - Found score ranges in configuracion (fallback):", form.configuracion.scoreRanges);
            return form.configuracion.scoreRanges;
          }
        }
      }

      console.log("useFormScoring - No score ranges found anywhere");
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
        console.log("Database score ranges found:", scoreRanges.length);
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
