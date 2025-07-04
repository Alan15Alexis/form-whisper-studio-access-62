
import { useCallback } from 'react';
import { FormField } from '@/types/form';
import { toast } from '@/hooks/toast';
import { useFormPermissions } from '@/hooks/useFormPermissions';

interface UseFormFieldsProps {
  formData: any;
  updateFormData: (updater: (prev: any) => any) => void;
}

export const useFormFields = ({ formData, updateFormData }: UseFormFieldsProps) => {
  const { canEditFormById } = useFormPermissions();

  const addField = useCallback((fieldType: string) => {
    console.log("useFormFields - addField called:", {
      fieldType,
      formId: formData.id,
      currentFieldsCount: formData.fields?.length || 0
    });

    // Check permissions before adding field
    const canEdit = formData.id ? canEditFormById(formData.id) : true;
    if (!canEdit) {
      console.warn("useFormFields - Field addition blocked: insufficient permissions");
      toast({
        title: 'Sin permisos',
        description: 'No tienes permisos para añadir campos a este formulario.',
        variant: 'destructive',
      });
      return;
    }
    
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: fieldType as any,
      label: getDefaultLabel(fieldType),
      required: false,
      options: getDefaultOptions(fieldType)
    };

    console.log("useFormFields - Adding new field:", {
      newField: {
        id: newField.id,
        type: newField.type,
        label: newField.label
      }
    });

    updateFormData(prev => {
      const updatedData = {
        ...prev,
        fields: [...(prev.fields || []), newField],
      };
      
      console.log("useFormFields - Updated form data with new field. Total fields:", updatedData.fields.length);
      
      // Show success toast
      toast({
        title: 'Campo añadido',
        description: `Se añadió un campo de tipo "${fieldType}" al formulario.`,
      });
      
      return updatedData;
    });
  }, [formData.id, updateFormData, canEditFormById]);

  const updateField = useCallback((id: string, updatedField: FormField) => {
    updateFormData(prev => {
      const updatedFormData = {
        ...prev,
        fields: (prev.fields || []).map(field =>
          field.id === id ? updatedField : field
        ),
      };
      
      // Check if scoring should be disabled
      const hasFieldsWithNumericValues = updatedFormData.fields.some(field => field.hasNumericValues === true);
      
      if (!hasFieldsWithNumericValues && updatedFormData.showTotalScore) {
        console.log("useFormFields - Disabling scoring: no numeric fields");
        updatedFormData.showTotalScore = false;
        updatedFormData.scoreRanges = [];
        
        toast({
          title: 'Puntuación deshabilitada',
          description: 'Se deshabilitó porque ningún campo tiene valores numéricos.',
        });
      }
      
      return updatedFormData;
    });
  }, [updateFormData]);

  const removeField = useCallback((id: string) => {
    updateFormData(prev => ({
      ...prev,
      fields: (prev.fields || []).filter(field => field.id !== id),
    }));
  }, [updateFormData]);

  return {
    addField,
    updateField,
    removeField
  };
};

function getDefaultLabel(fieldType: string): string {
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
}

function getDefaultOptions(fieldType: string) {
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
}
