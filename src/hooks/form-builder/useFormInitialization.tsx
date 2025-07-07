
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@/contexts/form';
import { useFormPermissions } from '@/hooks/useFormPermissions';
import { toast } from '@/hooks/toast';

interface UseFormInitializationProps {
  formId?: string;
  syncFormData: (form: any) => void;
  setIsLoading: (loading: boolean) => void;
  createInitialFormData: () => any;
  updateFormData: (updater: (prev: any) => any) => void;
}

export const useFormInitialization = ({
  formId,
  syncFormData,
  setIsLoading,
  createInitialFormData,
  updateFormData
}: UseFormInitializationProps) => {
  const navigate = useNavigate();
  const { getForm } = useForm();
  const { canEditFormById } = useFormPermissions();

  useEffect(() => {
    const initializeFormData = async () => {
      console.log("useFormInitialization - Initializing for formId:", formId);
      
      if (formId) {
        setIsLoading(true);
        
        try {
          // Wait for forms to load with better retry logic
          let retryCount = 0;
          let existingForm = getForm(formId);
          
          while (!existingForm && retryCount < 10) {
            console.log(`useFormInitialization - Form "${formId}" not found, retrying... (attempt ${retryCount + 1})`);
            await new Promise(resolve => setTimeout(resolve, 300));
            existingForm = getForm(formId);
            retryCount++;
          }
          
          if (existingForm) {
            // Check if user has permission to edit this form
            const canEdit = canEditFormById(formId);
            
            if (!canEdit) {
              toast({
                title: 'Sin permisos de edición',
                description: 'No tienes permisos para editar este formulario.',
                variant: 'destructive',
              });
              navigate('/dashboard-admin');
              return;
            }
            
            console.log("useFormInitialization - Found form:", {
              id: existingForm.id,
              title: existingForm.title,
              fieldsCount: existingForm.fields?.length || 0,
              collaboratorsCount: existingForm.collaborators?.length || 0,
              canEdit: canEdit
            });
            
            syncFormData(existingForm);
          } else {
            console.log("useFormInitialization - Form not found after retries");
            toast({
              title: 'Formulario no encontrado',
              description: 'El formulario que intentas editar no existe o no se pudo cargar.',
              variant: 'destructive',
            });
            navigate('/dashboard-admin');
          }
        } catch (error) {
          console.error("useFormInitialization - Error:", error);
          toast({
            title: 'Error al cargar formulario',
            description: 'Hubo un error al cargar los datos del formulario.',
            variant: 'destructive',
          });
          navigate('/dashboard-admin');
        }
        
        setIsLoading(false);
      } else {
        console.log("useFormInitialization - Initializing new form");
        updateFormData(() => createInitialFormData());
        setIsLoading(false);
      }
    };

    initializeFormData();
  }, [formId, getForm, navigate, syncFormData, canEditFormById, setIsLoading, updateFormData, createInitialFormData]);
};
