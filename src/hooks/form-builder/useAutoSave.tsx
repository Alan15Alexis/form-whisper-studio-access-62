
import { useCallback } from 'react';
import { toast } from '@/hooks/toast';

interface UseAutoSaveProps {
  formId?: string;
  handleUpdateForm?: (formId: string, formData: any) => Promise<any>;
}

export const useAutoSave = ({ formId, handleUpdateForm }: UseAutoSaveProps) => {
  const saveToDatabase = useCallback(async (updatedFormData: any, successMessage?: string) => {
    if (!formId || !handleUpdateForm) {
      return Promise.resolve();
    }

    console.log("useAutoSave - Starting auto-save to database:", {
      formId,
      totalFields: updatedFormData.fields?.length || 0
    });

    try {
      await handleUpdateForm(formId, updatedFormData);
      console.log("useAutoSave - Auto-saved successfully to database");
      
      if (successMessage) {
        toast({
          title: 'Guardado exitoso',
          description: successMessage,
        });
      }
    } catch (error) {
      console.error("useAutoSave - Error auto-saving:", error);
      toast({
        title: 'Error al guardar',
        description: 'Los cambios no se pudieron guardar en la base de datos.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [formId, handleUpdateForm]);

  return { saveToDatabase };
};
