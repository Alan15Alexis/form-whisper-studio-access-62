
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@/contexts/form';
import { Form } from '@/types/form';
import { toast } from '@/hooks/toast';

export const useFormOperations = () => {
  const navigate = useNavigate();
  const { createForm, updateForm } = useForm();

  const handleCreateForm = useCallback(async (formData: Partial<Form>) => {
    try {
      console.log("useFormOperations - Creating form with collaborators:", formData.collaborators);
      
      const newForm = await createForm(formData);
      console.log("useFormOperations - Form created successfully:", newForm);
      
      navigate('/dashboard-admin');
      
      toast({
        title: 'Formulario creado',
        description: `"${newForm.title}" ha sido creado exitosamente`,
      });
      
      return newForm;
    } catch (error) {
      console.error("useFormOperations - Error creating form:", error);
      toast({
        title: 'Error al crear formulario',
        description: 'Algo salió mal al crear el formulario.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [createForm, navigate]);

  const handleUpdateForm = useCallback(async (id: string, formData: Partial<Form>) => {
    try {
      console.log("useFormOperations - Updating form with collaborators:", {
        id,
        collaborators: formData.collaborators,
        collaboratorsCount: formData.collaborators?.length || 0
      });
      
      await updateForm(id, formData);
      console.log("useFormOperations - Form update completed successfully");
      
      return true;
    } catch (error) {
      console.error("useFormOperations - Error updating form:", error);
      throw error;
    }
  }, [updateForm]);

  return {
    handleCreateForm,
    handleUpdateForm
  };
};
