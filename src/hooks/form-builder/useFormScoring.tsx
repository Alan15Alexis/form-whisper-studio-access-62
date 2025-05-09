
import { FormField, ScoreRange } from "@/types/form";

export function useFormScoring() {
  const calculateTotalScore = (responses: Record<string, any>, fields: FormField[]): number => {
    let totalScore = 0;
    
    if (!fields) return totalScore;
    
    fields.forEach(field => {
      if (!field.hasNumericValues) return;
      
      const response = responses[field.id];
      if (response === undefined || response === null) return;
      
      if (field.type === 'checkbox' && Array.isArray(response)) {
        // Para checkboxes, sumamos los valores numéricos de todas las opciones seleccionadas
        response.forEach(value => {
          const option = field.options?.find(opt => opt.value === value);
          if (option && option.numericValue !== undefined) {
            totalScore += option.numericValue;
          }
        });
      } else if (field.type === 'yesno') {
        // Para campos Sí/No, buscamos la opción correspondiente
        const isYes = response === true || response === "true" || response === "yes" || response === "sí";
        const option = field.options?.[isYes ? 0 : 1]; // Asumimos que Sí es el índice 0 y No es el índice 1
        if (option && option.numericValue !== undefined) {
          totalScore += option.numericValue;
        }
      } else if (field.type === 'radio' || field.type === 'select' || field.type === 'image-select') {
        // Para selecciones únicas y selección de imágenes
        const option = field.options?.find(opt => opt.value === response);
        if (option && option.numericValue !== undefined) {
          totalScore += option.numericValue;
        }
      } else if (field.type === 'star-rating' || field.type === 'opinion-scale') {
        // Para calificaciones numéricas directas
        const numValue = parseInt(response);
        if (!isNaN(numValue)) {
          totalScore += numValue;
        }
      }
    });
    
    return totalScore;
  };
  
  const getScoreFeedback = (score: number, fields: FormField[]): string | null => {
    if (!fields) return null;
    
    // Recopilar todos los rangos de puntuación de todos los campos
    const allRanges: ScoreRange[] = [];
    fields.forEach(field => {
      if (field.scoreRanges && field.scoreRanges.length > 0) {
        allRanges.push(...field.scoreRanges);
      }
    });
    
    // Si no hay rangos definidos, devuelve null
    if (allRanges.length === 0) return null;
    
    // Buscar un rango que coincida con la puntuación actual
    const matchingRange = allRanges.find(range => 
      score >= range.min && score <= range.max
    );
    
    return matchingRange?.message || null;
  };

  const shouldShowScoreCard = (fields: FormField[], showTotalScore?: boolean): boolean => {
    if (!showTotalScore) return false;
    
    // Verificar que al menos un campo tenga valores numéricos
    return fields.some(f => f.hasNumericValues);
  };

  return {
    calculateTotalScore,
    getScoreFeedback,
    shouldShowScoreCard
  };
}
