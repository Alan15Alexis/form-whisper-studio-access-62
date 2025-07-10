
import { useCallback } from 'react';
import { toast } from '@/hooks/toast';
import { useFormPermissions } from '@/hooks/useFormPermissions';

interface UseFieldPermissionsProps {
  formId?: string;
}

export const useFieldPermissions = ({ formId }: UseFieldPermissionsProps) => {
  const { canEditFormById } = useFormPermissions();

  const checkFieldPermission = useCallback((action: string = 'editar'): boolean => {
    // Allow operations on new forms (when formId is undefined or empty)
    if (!formId) {
      console.log(`useFieldPermissions - Field ${action} allowed: new form (no ID)`);
      return true;
    }

    // Check permissions for existing forms
    const canEdit = canEditFormById(formId);
    if (!canEdit) {
      console.warn(`useFieldPermissions - Field ${action} blocked: insufficient permissions`);
      toast({
        title: 'Sin permisos',
        description: `No tienes permisos para ${action} campos en este formulario.`,
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  }, [formId, canEditFormById]);

  return { checkFieldPermission };
};
