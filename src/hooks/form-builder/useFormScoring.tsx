
import { FormField, ScoreRange } from "@/types/form";

export function useFormScoring() {
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
  
  const getScoreFeedback = async (score: number, scoreRanges?: ScoreRange[]): Promise<string | null> => {
    console.log("Getting feedback for score:", score, "with ranges:", scoreRanges);
    
    if (!scoreRanges || scoreRanges.length === 0) {
      console.log("No score ranges provided");
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

  const validateScoreRanges = (ranges: ScoreRange[]): boolean => {
    if (!ranges || ranges.length === 0) return true;
    
    // Check for overlapping ranges
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const range1 = ranges[i];
        const range2 = ranges[j];
        
        // Check if ranges overlap
        if (range1.min <= range2.max && range2.min <= range1.max) {
          console.warn("Overlapping score ranges detected:", range1, range2);
          return false;
        }
      }
    }
    
    return true;
  };

  return {
    calculateTotalScore,
    getScoreFeedback,
    shouldShowScoreCard,
    validateScoreRanges
  };
}
