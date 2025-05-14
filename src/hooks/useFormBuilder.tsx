// Update import for toast
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@/contexts/form';
import { Form, FormField } from '@/types/form';
import { toast } from '@/hooks/toast';

interface Params {
  id: string;
}

export const useFormBuilder = () => {
  const { id } = useParams<Params>();
  const navigate = useNavigate();
  const { forms, createForm, updateForm, getForm } = useForm();
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useState(() => {
    if (id) {
      setIsLoading(true);
      const existingForm = getForm(id);
      if (existingForm) {
        setForm(existingForm);
      } else {
        toast({
          title: 'Form not found',
          description: 'The form you are trying to edit does not exist.',
          variant: 'destructive',
        });
        navigate('/forms');
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [id, forms, navigate, getForm]);

  const handleCreateForm = async (formData: Partial<Form>) => {
    try {
      setIsLoading(true);
      const newForm = await createForm(formData);
      navigate(`/form/${newForm.id}`);
      toast({
        title: 'Form created',
        description: `"${newForm.title}" has been created successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error creating form',
        description: 'Something went wrong while creating the form.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateForm = async (id: string, formData: Partial<Form>) => {
    try {
      setIsLoading(true);
      await updateForm(id, formData);
      toast({
        title: 'Form updated',
        description: `"${formData.title}" has been updated successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error updating form',
        description: 'Something went wrong while updating the form.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    handleCreateForm,
    handleUpdateForm,
  };
};
