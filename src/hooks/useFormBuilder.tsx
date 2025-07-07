import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@/contexts/form';
import { Form } from '@/types/form';
import { toast } from '@/hooks/toast';
import { addInvitedUser } from '@/integrations/supabase/client';
import { useDragAndDrop } from './form-builder/useDragAndDrop';
import { useFormPermissions } from './useFormPermissions';
import { useFormState } from './form-builder/useFormState';
import { useFormFields } from './form-builder/useFormFields';
import { useFormOperations } from './form-builder/useFormOperations';

interface UseFormBuilderParams {
  id?: string;
}

export const useFormBuilder = (id?: string) => {
  const params = useParams<{ id: string }>();
  const formId = id || params.id;
  const navigate = useNavigate();
  const { getForm } = useForm();
  const { canEditFormById } = useFormPermissions();
  
  // Use focused state management
  const {
    form,
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
    formData,
    updateFormData,
    syncFormData,
    updateTrigger,
    allowedUserEmail,
    setAllowedUserEmail,
    allowedUserName,
    setAllowedUserName,
    createInitialFormData
  } = useFormState();

  // Use focused field management
  const { addField, updateField, removeField } = useFormFields({
    formData,
    updateFormData
  });

  // Use focused form operations
  const { handleCreateForm, handleUpdateForm } = useFormOperations();

  // Add drag and drop functionality
  const { handleDragEnd } = useDragAndDrop({
    formData,
    setFormData: updateFormData,
    addField
  });

  // Enhanced initialization with better error handling and retry logic
  useEffect(() => {
    const initializeFormData = async () => {
      console.log("useFormBuilder - Initializing for formId:", formId);
      
      if (formId) {
        setIsLoading(true);
        
        try {
          // Wait for forms to load with better retry logic
          let retryCount = 0;
          let existingForm = getForm(formId);
          
          while (!existingForm && retryCount < 10) {
            console.log(`useFormBuilder - Form "${formId}" not found, retrying... (attempt ${retryCount + 1})`);
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
            
            console.log("useFormBuilder - Found form:", {
              id: existingForm.id,
              title: existingForm.title,
              fieldsCount: existingForm.fields?.length || 0,
              collaboratorsCount: existingForm.collaborators?.length || 0,
              canEdit: canEdit
            });
            
            syncFormData(existingForm);
          } else {
            console.log("useFormBuilder - Form not found after retries");
            toast({
              title: 'Formulario no encontrado',
              description: 'El formulario que intentas editar no existe o no se pudo cargar.',
              variant: 'destructive',
            });
            navigate('/dashboard-admin');
          }
        } catch (error) {
          console.error("useFormBuilder - Error:", error);
          toast({
            title: 'Error al cargar formulario',
            description: 'Hubo un error al cargar los datos del formulario.',
            variant: 'destructive',
          });
          navigate('/dashboard-admin');
        }
        
        setIsLoading(false);
      } else {
        console.log("useFormBuilder - Initializing new form");
        updateFormData(() => createInitialFormData());
        setIsLoading(false);
      }
    };

    initializeFormData();
  }, [formId, getForm, navigate, syncFormData, canEditFormById, setIsLoading, updateFormData, createInitialFormData]);

  const isEditMode = Boolean(formId);

  // Form property handlers
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
    console.log("useFormBuilder - Toggle scoring:", enabled);
    
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
    console.log("useFormBuilder - Update score ranges in form data:", ranges.length);
    
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

  // User management handlers
  const addAllowedUser = async () => {
    if (!allowedUserEmail || !allowedUserName) {
      toast({
        title: "Error",
        description: "Por favor, introduce tanto el nombre como el correo electrónico",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(allowedUserEmail)) {
      toast({
        title: "Error",
        description: "Por favor, introduce un correo electrónico válido",
        variant: "destructive",
      });
      return;
    }

    const lowerCaseEmail = allowedUserEmail.toLowerCase();

    if (formData.allowedUsers?.includes(lowerCaseEmail)) {
      toast({
        title: "Usuario ya añadido",
        description: "Este usuario ya tiene acceso a este formulario",
        variant: "destructive",
      });
      return;
    }

    try {
      const newInvitedUser = await addInvitedUser(allowedUserName, lowerCaseEmail);
      
      if (newInvitedUser) {
        updateFormData(prev => ({
          ...prev,
          allowedUsers: [...(prev.allowedUsers || []), lowerCaseEmail],
        }));
        
        setAllowedUserEmail('');
        setAllowedUserName('');
        
        toast({
          title: "Usuario añadido",
          description: `${allowedUserName} (${lowerCaseEmail}) ha sido añadido al formulario`,
        });
      }
    } catch (error) {
      console.error('Error adding invited user:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el usuario. Por favor, inténtalo de nuevo",
        variant: "destructive",
      });
    }
  };

  const removeAllowedUser = (email: string) => {
    updateFormData(prev => ({
      ...prev,
      allowedUsers: (prev.allowedUsers || []).filter(user => user !== email),
    }));
  };

  // Settings handlers
  const handleAllowViewOwnResponsesChange = (allow: boolean) => {
    updateFormData(prev => ({ ...prev, allowViewOwnResponses: allow }));
  };

  const handleAllowEditOwnResponsesChange = (allow: boolean) => {
    updateFormData(prev => ({ ...prev, allowEditOwnResponses: allow }));
  };

  const handleFormColorChange = (color: string) => {
    updateFormData(prev => ({ ...prev, formColor: color }));
  };

  const handleHttpConfigChange = (config: any) => {
    updateFormData(prev => ({ ...prev, httpConfig: config }));
  };

  const handleCollaboratorsChange = useCallback((collaborators: string[]) => {
    console.log("useFormBuilder - handleCollaboratorsChange called:", {
      newCollaborators: collaborators,
      previousCount: formData.collaborators?.length || 0,
      newCount: collaborators.length
    });
    
    const validCollaborators = Array.isArray(collaborators) 
      ? collaborators.filter(email => typeof email === 'string' && email.trim().length > 0)
      : [];
    
    console.log("useFormBuilder - Setting valid collaborators:", {
      originalInput: collaborators,
      validatedOutput: validCollaborators,
      removedCount: collaborators.length - validCollaborators.length
    });
    
    updateFormData(prev => ({ 
      ...prev, 
      collaborators: validCollaborators 
    }));
  }, [formData.collaborators, updateFormData]);

  const handleSubmit = useCallback(async () => {
    console.log("useFormBuilder - handleSubmit with collaborators:", {
      collaborators: formData.collaborators,
      collaboratorsCount: formData.collaborators?.length || 0
    });
    
    // Validate scoring configuration
    if (formData.showTotalScore) {
      const hasFieldsWithNumericValues = (formData.fields || []).some(field => field.hasNumericValues === true);
      
      if (!hasFieldsWithNumericValues) {
        toast({
          title: 'Error de configuración',
          description: 'No se puede guardar con puntuación habilitada sin campos con valores numéricos.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setIsSaving(true);
    
    try {
      if (isEditMode && formId) {
        await handleUpdateForm(formId, formData);
      } else {
        await handleCreateForm(formData);
      }
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditMode, formId, handleCreateForm, handleUpdateForm, setIsSaving]);

  return {
    form,
    isLoading,
    isSaving,
    formData,
    isEditMode,
    updateTrigger,
    allowedUserEmail,
    allowedUserName,
    setAllowedUserEmail,
    setAllowedUserName,
    handleTitleChange,
    handleDescriptionChange,
    handlePrivateChange,
    handleToggleFormScoring,
    handleSaveScoreRanges,
    updateField,
    removeField,
    addField,
    addAllowedUser,
    removeAllowedUser,
    handleDragEnd,
    handleAllowViewOwnResponsesChange,
    handleAllowEditOwnResponsesChange,
    handleFormColorChange,
    handleHttpConfigChange,
    handleCollaboratorsChange,
    handleSubmit,
    handleCreateForm,
    handleUpdateForm
  };
};
