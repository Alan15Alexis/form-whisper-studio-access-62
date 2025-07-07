
import { useCallback } from 'react';
import { toast } from '@/hooks/toast';

interface UseFormPropertiesProps {
  formData: any;
  updateFormData: (updater: (prev: any) => any) => void;
}

export const useFormProperties = ({ formData, updateFormData }: UseFormPropertiesProps) => {
  const handleTitleChange = useCallback((title: string) => {
    updateFormData(prev => ({ ...prev, title }));
  }, [updateFormData]);

  const handleDescriptionChange = useCallback((description: string) => {
    updateFormData(prev => ({ ...prev, description }));
  }, [updateFormData]);

  const handlePrivateChange = useCallback((isPrivate: boolean) => {
    updateFormData(prev => ({ ...prev, isPrivate }));
  }, [updateFormData]);

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
  }, [formData.fields, updateFormData]);

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
  }, [updateFormData]);

  return {
    handleTitleChange,
    handleDescriptionChange,
    handlePrivateChange,
    handleToggleFormScoring,
    handleSaveScoreRanges
  };
};
