
import { useCallback, useEffect } from 'react';
import { toast } from '@/hooks/toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useAutoSave } from './useAutoSave';

interface UseFormPropertiesProps {
  formData: any;
  updateFormData: (updater: (prev: any) => any) => void;
  handleUpdateForm?: (formId: string, formData: any) => Promise<any>;
}

export const useFormProperties = ({ formData, updateFormData, handleUpdateForm }: UseFormPropertiesProps) => {
  const { saveToDatabase } = useAutoSave({ 
    formId: formData.id, 
    handleUpdateForm 
  });

  // Debounce title and description for auto-save
  const debouncedTitle = useDebounce(formData.title || '', 1000);
  const debouncedDescription = useDebounce(formData.description || '', 1000);

  // Auto-save when debounced values change (only for existing forms)
  useEffect(() => {
    if (formData.id && debouncedTitle && debouncedTitle !== formData.title) {
      console.log("useFormProperties - Auto-saving title change");
      saveToDatabase(formData, undefined, false); // Silent save
    }
  }, [debouncedTitle, formData, saveToDatabase]);

  useEffect(() => {
    if (formData.id && debouncedDescription !== formData.description) {
      console.log("useFormProperties - Auto-saving description change");
      saveToDatabase(formData, undefined, false); // Silent save
    }
  }, [debouncedDescription, formData, saveToDatabase]);

  const handleTitleChange = useCallback((title: string) => {
    updateFormData(prev => ({ ...prev, title }));
  }, [updateFormData]);

  const handleDescriptionChange = useCallback((description: string) => {
    updateFormData(prev => ({ ...prev, description }));
  }, [updateFormData]);

  const handlePrivateChange = useCallback((isPrivate: boolean) => {
    updateFormData(prev => ({ ...prev, isPrivate }));
    
    // Auto-save privacy change immediately for existing forms
    if (formData.id) {
      const updatedData = { ...formData, isPrivate };
      saveToDatabase(updatedData, 'Configuración de privacidad actualizada', true);
    }
  }, [updateFormData, formData, saveToDatabase]);

  const handleToggleFormScoring = useCallback((enabled: boolean) => {
    console.log("useFormProperties - Toggle scoring:", enabled);
    
    if (enabled) {
      const hasFieldsWithNumericValues = (formData.fields || []).some(field => field.hasNumericValues === true);
      
      if (!hasFieldsWithNumericValues) {
        toast({
          title: 'No se puede habilitar puntuación',
          description: 'Configura valores numéricos en al menos un campo primero.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    updateFormData(prev => ({ 
      ...prev, 
      showTotalScore: enabled,
      scoreRanges: enabled ? prev.scoreRanges : []
    }));

    // Auto-save scoring configuration immediately for existing forms
    if (formData.id) {       
      const updatedData = { 
        ...formData, 
        showTotalScore: enabled,
        scoreRanges: enabled ? formData.scoreRanges : []
      };
      saveToDatabase(updatedData, 'Configuración de puntuación actualizada', true);
    }
  }, [formData.fields, updateFormData, formData, saveToDatabase]);

  const handleSaveScoreRanges = useCallback((ranges: any[]) => {
    console.log("useFormProperties - Update score ranges in form data:", ranges.length);
    
    // Validate ranges
    const validRanges = ranges.filter(range => 
      range && 
      typeof range.min === 'number' && 
      typeof range.max === 'number' && 
      typeof range.message === 'string' &&
      range.min <= range.max
    );
    
    updateFormData(prev => ({ 
      ...prev, 
      scoreRanges: [...validRanges]
    }));

    // Auto-save score ranges immediately for existing forms
    if (formData.id) {
      const updatedData = { ...formData, scoreRanges: [...validRanges] };
      saveToDatabase(updatedData, 'Rangos de puntuación guardados', true);
    }
  }, [updateFormData, formData, saveToDatabase]);

  return {
    handleTitleChange,
    handleDescriptionChange,
    handlePrivateChange,
    handleToggleFormScoring,
    handleSaveScoreRanges
  };
};
