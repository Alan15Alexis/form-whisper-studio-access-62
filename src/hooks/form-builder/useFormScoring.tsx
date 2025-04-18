
import { FormField, ScoreRange } from "@/types/form";

export function useFormScoring() {
  const calculateTotalScore = (responses: Record<string, any>, fields: FormField[]): number => {
    let totalScore = 0;
    
    if (!fields) return totalScore;
    
    fields.forEach(field => {
      if (!field.hasNumericValues) return;
      
      const response = responses[field.id];
      if (!response) return;
      
      if (field.type === 'checkbox' && Array.isArray(response)) {
        response.forEach(value => {
          const option = field.options?.find(opt => opt.value === value);
          if (option && option.numericValue !== undefined) {
            totalScore += option.numericValue;
          }
        });
      } else if (field.type === 'yesno' || field.type === 'radio' || field.type === 'select') {
        const option = field.options?.find(opt => opt.value === response);
        if (option && option.numericValue !== undefined) {
          totalScore += option.numericValue;
        }
      }
    });
    
    return totalScore;
  };
  
  const getScoreFeedback = (score: number, fields: FormField[]): string | null => {
    if (!fields) return null;
    
    const allRanges: ScoreRange[] = [];
    fields.forEach(field => {
      if (field.scoreRanges && field.scoreRanges.length > 0) {
        allRanges.push(...field.scoreRanges);
      }
    });
    
    const matchingRange = allRanges.find(range => 
      score >= range.min && score <= range.max
    );
    
    return matchingRange?.message || null;
  };

  return {
    calculateTotalScore,
    getScoreFeedback
  };
}
