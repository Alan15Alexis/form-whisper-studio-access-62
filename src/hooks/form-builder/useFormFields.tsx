
import { useCallback } from 'react';
import { FormField } from '@/types/form';
import { toast } from '@/hooks/toast';
import { useFormPermissions } from '@/hooks/useFormPermissions';
import { createNewField, validateScoringAfterFieldUpdate } from './fieldOperations';

interface UseFormFieldsProps {
  formData: any;
  updateFormData: (updater: (prev: any) => any) => void;
  handleUpdateForm?: (formId: string, formData: any) => Promise<any>;
}

export const useFormFields = ({ formData, updateFormData, handleUpdateForm }: UseFormFieldsProps) => {
  const { canEditFormById } = useFormPermissions();

  const addField = useCallback(async (fieldType: string) => {
    console.log("useFormFields - addField called:", {
      fieldType,
      formId: formData.id,
      currentFieldsCount: formData.fields?.length || 0,
      hasUpdateFunction: !!handleUpdateForm,
      timestamp: new Date().toISOString()
    });

    // Check permissions before adding field - only if we have a form ID
    if (formData.id) {
      const canEdit = canEditFormById(formData.id);
      if (!canEdit) {
        console.warn("useFormFields - Field addition blocked: insufficient permissions");
        toast({
          title: 'Sin permisos',
          description: 'No tienes permisos para añadir campos a este formulario.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    const newField = createNewField(fieldType);

    console.log("useFormFields - Creating new field:", {
      newField: {
        id: newField.id,
        type: newField.type,
        label: newField.label
      },
      timestamp: new Date().toISOString()
    });

    // Update local state first and get the updated data
    return new Promise<void>((resolve, reject) => {
      updateFormData(prev => {
        const currentFields = Array.isArray(prev.fields) ? [...prev.fields] : [];
        const updatedFields = [...currentFields, newField];
        
        const updatedFormData = {
          ...prev,
          fields: updatedFields,
          updatedAt: new Date().toISOString()
        };
        
        console.log("useFormFields - Form data after field addition:", {
          previousFieldsCount: currentFields.length,
          newFieldsCount: updatedFields.length,
          newFieldId: newField.id,
          allFieldIds: updatedFields.map(f => f.id),
          timestamp: new Date().toISOString()
        });
        
        // Auto-save to database if we have a form ID and update function
        if (formData.id && handleUpdateForm) {
          console.log("useFormFields - Starting auto-save to database:", {
            formId: formData.id,
            newFieldId: newField.id,
            totalFields: updatedFormData.fields.length
          });
          
          handleUpdateForm(formData.id, updatedFormData)
            .then(() => {
              console.log("useFormFields - Field auto-saved successfully to database");
              toast({
                title: 'Campo añadido',
                description: `Se añadió un campo de tipo "${newField.label}" al formulario y se guardó en la base de datos.`,
              });
              resolve();
            })
            .catch((error) => {
              console.error("useFormFields - Error auto-saving field:", error);
              toast({
                title: 'Error al guardar',
                description: 'El campo se añadió localmente pero no se pudo guardar en la base de datos.',
                variant: 'destructive',
              });
              reject(error);
            });
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
  }, [formData.id, updateFormData, canEditFormById, handleUpdateForm]);

  const updateField = useCallback(async (id: string, updatedField: FormField) => {
    console.log("useFormFields - updateField called:", { id, fieldType: updatedField.type });
    
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
        
        // Auto-save field updates to database
        if (formData.id && handleUpdateForm) {
          console.log("useFormFields - Auto-saving field update to database");
          handleUpdateForm(formData.id, updatedFormData)
            .then(() => {
              console.log("useFormFields - Field update auto-saved successfully");
              resolve();
            })
            .catch((error) => {
              console.error("useFormFields - Error auto-saving field update:", error);
              toast({
                title: 'Error al guardar',
                description: 'Los cambios no se pudieron guardar en la base de datos.',
                variant: 'destructive',
              });
              reject(error);
            });
        } else {
          resolve();
        }
        
        return updatedFormData;
      });
    });
  }, [updateFormData, formData.id, handleUpdateForm]);

  const removeField = useCallback(async (id: string) => {
    console.log("useFormFields - removeField called:", { id });
    
    return new Promise<void>((resolve, reject) => {
      updateFormData(prev => {
        const updatedFormData = {
          ...prev,
          fields: (prev.fields || []).filter(field => field.id !== id),
          updatedAt: new Date().toISOString()
        };

        // Auto-save field removal to database
        if (formData.id && handleUpdateForm) {
          console.log("useFormFields - Auto-saving field removal to database");
          handleUpdateForm(formData.id, updatedFormData)
            .then(() => {
              console.log("useFormFields - Field removal auto-saved successfully");
              toast({
                title: 'Campo eliminado',
                description: 'El campo ha sido eliminado del formulario y guardado en la base de datos.',
              });
              resolve();
            })
            .catch((error) => {
              console.error("useFormFields - Error auto-saving field removal:", error);
              toast({
                title: 'Error al guardar',
                description: 'El campo se eliminó localmente pero no se pudo guardar en la base de datos.',
                variant: 'destructive',
              });
              reject(error);
            });
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
  }, [updateFormData, formData.id, handleUpdateForm]);

  return {
    addField,
    updateField,
    removeField
  };
};
