
import { FormField } from '@/types/form';
import { toast } from '@/hooks/toast';

export const getDefaultLabel = (fieldType: string): string => {
  const labels: Record<string, string> = {
    'text': 'Texto corto',
    'textarea': 'Texto largo',
    'select': 'Selección desplegable',
    'radio': 'Selección individual',
    'checkbox': 'Selección múltiple',
    'email': 'Correo electrónico',
    'number': 'Número',
    'date': 'Fecha',
    'time': 'Hora',
    'yesno': 'Sí / No',
    'image-select': 'Selección de imagen',
    'fullname': 'Nombre completo',
    'address': 'Dirección',
    'phone': 'Teléfono',
    'image-upload': 'Subir imagen',
    'file-upload': 'Subir archivo',
    'drawing': 'Dibujo',
    'matrix': 'Matriz de selección',
    'opinion-scale': 'Escala de opinión',
    'star-rating': 'Calificación de estrellas',
    'ranking': 'Clasificación',
    'timer': 'Temporizador',
    'terms': 'Términos y condiciones',
    'signature': 'Firma'
  };
  
  return labels[fieldType] || `Campo ${fieldType}`;
};

export const getDefaultOptions = (fieldType: string) => {
  if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
    return [
      { id: crypto.randomUUID(), label: 'Opción 1', value: 'option_1' },
      { id: crypto.randomUUID(), label: 'Opción 2', value: 'option_2' }
    ];
  } else if (fieldType === 'yesno') {
    return [
      { id: 'yes', label: 'Sí', value: 'yes' },
      { id: 'no', label: 'No', value: 'no' }
    ];
  }
  return undefined;
};

export const createNewField = (fieldType: string): FormField => {
  return {
    id: crypto.randomUUID(),
    type: fieldType as any,
    label: getDefaultLabel(fieldType),
    required: false,
    options: getDefaultOptions(fieldType)
  };
};

export const validateScoringAfterFieldUpdate = (fields: FormField[], showTotalScore: boolean) => {
  const hasFieldsWithNumericValues = fields.some(field => field.hasNumericValues === true);
  
  if (!hasFieldsWithNumericValues && showTotalScore) {
    console.log("fieldOperations - Disabling scoring: no numeric fields");
    toast({
      title: 'Puntuación deshabilitada',
      description: 'Se deshabilitó porque ningún campo tiene valores numéricos.',
    });
    return { showTotalScore: false, scoreRanges: [] };
  }
  
  return null;
};
