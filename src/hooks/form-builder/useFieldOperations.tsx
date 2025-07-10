
import { useCallback } from 'react';
import { FormField } from '@/types/form';
import { toast } from '@/hooks/toast';
import { createNewField, validateScoringAfterFieldUpdate } from './fieldOperations';
import { useAutoSave } from './useAutoSave';

interface UseFieldOperationsProps {
  formData: any;
  updateFormData: (updater: (prev: any) => any) => void;
  handleUpdateForm?: (formId: string, formData: any) => Promise<any>;
}

export const useFieldOperations = ({ 
  formData, 
  updateFormData, 
  handleUpdateForm 
}: UseFieldOperationsProps) => {
  const { saveToDatabase } = useAutoSave({ 
    formId: formData.id, 
    handleUpdateForm 
  });

  const createField = useCallback(async (fieldType: string) => {
    console.log("useFieldOperations - createField called:", {
      fieldType,
      formId: formData.id,
      currentFieldsCount: formData.fields?.length || 0,
      hasUpdateFunction: !!handleUpdateForm,
      timestamp: new Date().toISOString()
    });

    const newField = createNewField(fieldType);

    console.log("useFieldOperations - Creating new field:", {
      newField: {
        id: newField.id,
        type: newField.type,
        label: newField.label
      },
      timestamp: new Date().toISOString()
    });

    return new Promise<void>((resolve, reject) => {
      updateFormData(prev => {
        const currentFields = Array.isArray(prev.fields) ? [...prev.fields] : [];
        const updatedFields = [...currentFields, newField];
        
        const updatedFormData = {
          ...prev,
          fields: updatedFields,
          updatedAt: new Date().toISOString()
        };
        
        console.log("useFieldOperations - Form data after field addition:", {
          previousFieldsCount: currentFields.length,
          newFieldsCount: updatedFields.length,
          newFieldId: newField.id,
          allFieldIds: updatedFields.map(f => f.id),
          timestamp: new Date().toISOString()
        });
        
        // Auto-save to database if we have a form ID and update function
        if (formData.id && handleUpdateForm) {
          // Show toast only for field creation as it's a significant user action
          saveToDatabase(
            updatedFormData, 
            `Campo "${newField.label}" añadido correctamente.`,
            true // Show success toast for field creation
          )
            .then(resolve)
            .catch(reject);
        } else {
          // Show success toast for local update only (when creating new form)
          toast({
            title: 'Campo añadido',
            description: `Se añadió un campo de tipo "${newField.label}" al formulario.`,
          });
          resolve();
        }
        
        return updatedFormData;
      });
    });
  }, [formData.id, updateFormData, handleUpdateForm, saveToDatabase]);

  const modifyField = useCallback(async (id: string, updatedField: FormField) => {
    console.log("useFieldOperations - modifyField called:", { id, fieldType: updatedField.type });
    
    return new Promise<void>((resolve, reject) => {
      updateFormData(prev => {
        const updatedFormData = {
          ...prev,
          fields: (prev.fields || []).map(field =>
            field.id === id ? { ...updatedField } : field
          ),
          updatedAt: new Date().toISOString()
        };
        
        // Check if scoring should be disabled
        const scoringUpdate = validateScoringAfterFieldUpdate(updatedFormData.fields, updatedFormData.showTotalScore);
        if (scoringUpdate) {
          Object.assign(updatedFormData, scoringUpdate);
        }
        
        // Auto-save field updates to database (silent save - no toast for field updates)
        if (formData.id && handleUpdateForm) {
          console.log("useFieldOperations - Auto-saving field update to database");
          saveToDatabase(updatedFormData, undefined, false) // Silent save
            .then(resolve)
            .catch(reject);
        } else {
          resolve();
        }
        
        return updatedFormData;
      });
    });
  }, [updateFormData, formData.id, handleUpdateForm, saveToDatabase]);

  const deleteField = useCallback(async (id: string) => {
    console.log("useFieldOperations - deleteField called:", { id });
    
    return new Promise<void>((resolve, reject) => {
      updateFormData(prev => {
        const updatedFormData = {
          ...prev,
          fields: (prev.fields || []).filter(field => field.id !== id),
          updatedAt: new Date().toISOString()
        };

        // Auto-save field removal to database
        if (formData.id && handleUpdateForm) {
          console.log("useFieldOperations - Auto-saving field removal to database");
          // Show toast for field deletion as it's a significant user action
          saveToDatabase(
            updatedFormData,
            'Campo eliminado correctamente.',
            true // Show success toast for field deletion
          )
            .then(resolve)
            .catch(reject);
        } else {
          toast({
            title: 'Campo eliminado',
            description: 'El campo ha sido eliminado del formulario.',
          });
          resolve();
        }
        
        return updatedFormData;
      });
    });
  }, [updateFormData, formData.id, handleUpdateForm, saveToDatabase]);

  return {
    createField,
    modifyField,
    deleteField
  };
};
