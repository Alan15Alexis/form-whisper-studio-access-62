
import { useCallback } from 'react';
import { FormField } from '@/types/form';
import { useFieldOperations } from './useFieldOperations';
import { useFieldPermissions } from './useFieldPermissions';

interface UseFormFieldsProps {
  formData: any;
  updateFormData: (updater: (prev: any) => any) => void;
  handleUpdateForm?: (formId: string, formData: any) => Promise<any>;
}

export const useFormFields = ({ formData, updateFormData, handleUpdateForm }: UseFormFieldsProps) => {
  const { checkFieldPermission } = useFieldPermissions({ formId: formData.id });
  const { createField, modifyField, deleteField } = useFieldOperations({
    formData,
    updateFormData,
    handleUpdateForm
  });

  const addField = useCallback(async (fieldType: string) => {
    if (!checkFieldPermission('añadir')) {
      return;
    }
    
    return createField(fieldType);
  }, [checkFieldPermission, createField]);

  const updateField = useCallback(async (id: string, updatedField: FormField) => {
    return modifyField(id, updatedField);
  }, [modifyField]);

  const removeField = useCallback(async (id: string) => {
    return deleteField(id);
  }, [deleteField]);

  return {
    addField,
    updateField,
    removeField
  };
};
