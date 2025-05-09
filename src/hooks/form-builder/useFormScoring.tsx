
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
      
      if (field.type === 'checkbox' && Array.isArray(response)) {
        // Para checkboxes, sumamos los valores numéricos de todas las opciones seleccionadas
        response.forEach(value => {
          const option = field.options?.find(opt => opt.value === value);
          if (option && option.numericValue !== undefined) {
            console.log(`  Adding ${option.numericValue} from checkbox option ${option.label}`);
            totalScore += option.numericValue;
          }
        });
      } else if (field.type === 'yesno') {
        // Para campos Sí/No, buscamos la opción correspondiente
        const isYes = response === true || response === "true" || response === "yes" || response === "sí";
        const option = field.options?.[isYes ? 0 : 1]; // Asumimos que Sí es el índice 0 y No es el índice 1
        if (option && option.numericValue !== undefined) {
          console.log(`  Adding ${option.numericValue} from yesno option ${option.label}`);
          totalScore += option.numericValue;
        }
      } else if (field.type === 'radio' || field.type === 'select' || field.type === 'image-select') {
        // Para selecciones únicas y selección de imágenes
        const option = field.options?.find(opt => opt.value === response);
        if (option && option.numericValue !== undefined) {
          console.log(`  Adding ${option.numericValue} from radio/select option ${option.label}`);
          totalScore += option.numericValue;
        }
      } else if (field.type === 'star-rating' || field.type === 'opinion-scale') {
        // Para calificaciones numéricas directas
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
  
  const getScoreFeedback = (score: number, fields: FormField[]): string | null => {
    if (!fields) return null;
    
    console.log("Getting feedback for score:", score);
    
    // Recopilar todos los rangos de puntuación de todos los campos
    const allRanges: ScoreRange[] = [];
    fields.forEach(field => {
      if (field.scoreRanges && field.scoreRanges.length > 0) {
        allRanges.push(...field.scoreRanges);
        console.log(`Added ${field.scoreRanges.length} ranges from field ${field.id}`);
      }
    });
    
    console.log("All score ranges:", allRanges);
    
    // Si no hay rangos definidos, devuelve null
    if (allRanges.length === 0) return null;
    
    // Buscar un rango que coincida con la puntuación actual
    const matchingRange = allRanges.find(range => 
      score >= range.min && score <= range.max
    );
    
    console.log("Matching range:", matchingRange);
    
    return matchingRange?.message || null;
  };

  const shouldShowScoreCard = (fields: FormField[], showTotalScore?: boolean): boolean => {
    if (!showTotalScore) {
      console.log("Score card hidden: showTotalScore is false");
      return false;
    }
    
    // Verificar que al menos un campo tenga valores numéricos
    const hasNumericFields = fields.some(f => f.hasNumericValues);
    console.log("Has fields with numeric values:", hasNumericFields);
    return hasNumericFields;
  };

  return {
    calculateTotalScore,
    getScoreFeedback,
    shouldShowScoreCard
  };
}
