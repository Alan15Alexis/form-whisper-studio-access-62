import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@/contexts/form';
import { Form, FormField } from '@/types/form';
import { toast } from '@/hooks/toast';
import { addInvitedUser } from '@/integrations/supabase/client';
import { useDragAndDrop } from './form-builder/useDragAndDrop';
import { useFormPermissions } from './useFormPermissions';

interface UseFormBuilderParams {
  id?: string;
}

export const useFormBuilder = (id?: string) => {
  const params = useParams<{ id: string }>();
  const formId = id || params.id;
  const navigate = useNavigate();
  const { 
    forms, 
    createForm, 
    updateForm, 
    getForm
  } = useForm();
  const { canEditFormById } = useFormPermissions();
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Form>({
    id: '',
    title: '',
    description: '',
    fields: [],
    isPrivate: false,
    allowedUsers: [],
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accessLink: '',
    ownerId: '',
    formColor: '#3b82f6',
    allowViewOwnResponses: false,
    allowEditOwnResponses: false,
    showTotalScore: false,
    scoreRanges: []
  });
  const [allowedUserEmail, setAllowedUserEmail] = useState('');
  const [allowedUserName, setAllowedUserName] = useState('');

  // Add drag and drop functionality
  const { handleDragEnd } = useDragAndDrop({
    formData,
    setFormData,
    addField: (fieldType: string) => {
      const newField: FormField = {
        id: crypto.randomUUID(),
        type: fieldType as any,
        label: '',
        required: false,
        options: fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox' ? [
          { id: crypto.randomUUID(), label: 'Option 1', value: 'option_1' },
          { id: crypto.randomUUID(), label: 'Option 2', value: 'option_2' }
        ] : undefined
      };

      setFormData(prev => ({
        ...prev,
        fields: [...(prev.fields || []), newField],
      }));
    }
  });

  // Enhanced form data sync with better collaborators handling
  const syncFormData = useCallback((sourceForm: Form) => {
    console.log("useFormBuilder - Syncing form data:", {
      formId: sourceForm.id,
      title: sourceForm.title,
      showTotalScore: sourceForm.showTotalScore,
      scoreRangesCount: sourceForm.scoreRanges?.length || 0,
      collaborators: sourceForm.collaborators || [],
      collaboratorsCount: sourceForm.collaborators?.length || 0
    });
    
    setFormData(prevData => {
      const newData = { ...sourceForm };
      
      // Ensure scoreRanges is always an array
      if (!Array.isArray(newData.scoreRanges)) {
        newData.scoreRanges = [];
      }
      
      // Enhanced collaborators handling with validation
      if (!Array.isArray(newData.collaborators)) {
        console.warn("useFormBuilder - Invalid collaborators data, converting to array:", newData.collaborators);
        newData.collaborators = [];
      } else {
        // Filter and validate collaborators
        newData.collaborators = newData.collaborators.filter(email => 
          typeof email === 'string' && email.trim().length > 0
        );
      }
      
      // Only update if data has actually changed (deep comparison for collaborators)
      const hasChanged = JSON.stringify(prevData) !== JSON.stringify(newData);
      
      if (hasChanged) {
        console.log("useFormBuilder - Form data updated with collaborators:", {
          collaborators: newData.collaborators,
          collaboratorsCount: newData.collaborators.length
        });
        return newData;
      }
      
      return prevData;
    });
    
    setForm(sourceForm);
  }, []);

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
              showTotalScore: existingForm.showTotalScore,
              scoreRangesCount: existingForm.scoreRanges?.length || 0,
              collaborators: existingForm.collaborators || [],
              collaboratorsCount: existingForm.collaborators?.length || 0,
              canEdit: canEdit
            });
            
            syncFormData(existingForm);
          } else {
            console.log("useFormBuilder - Form not found after retries. Available forms:", 
              forms.map(f => ({ id: f.id, title: f.title, collaboratorsCount: f.collaborators?.length || 0 }))
            );
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
        const newFormData = {
          id: '',
          title: '',
          description: '',
          fields: [],
          isPrivate: false,
          allowedUsers: [],
          collaborators: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          accessLink: '',
          ownerId: '',
          formColor: '#3b82f6',
          allowViewOwnResponses: false,
          allowEditOwnResponses: false,
          showTotalScore: false,
          scoreRanges: []
        };
        
        setFormData(newFormData);
        setIsLoading(false);
      }
    };

    initializeFormData();
  }, [formId, getForm, navigate, syncFormData, forms, canEditFormById]);

  // Listen for form changes and resync when needed
  useEffect(() => {
    if (formId && forms.length > 0) {
      const currentForm = getForm(formId);
      if (currentForm && form && currentForm.updatedAt !== form.updatedAt) {
        console.log("useFormBuilder - Detected form update, resyncing");
        syncFormData(currentForm);
      }
    }
  }, [forms, formId, getForm, form, syncFormData]);

  const isEditMode = Boolean(formId);

  const handleTitleChange = useCallback((title: string) => {
    setFormData(prev => ({ ...prev, title }));
  }, []);

  const handleDescriptionChange = useCallback((description: string) => {
    setFormData(prev => ({ ...prev, description }));
  }, []);

  const handlePrivateChange = useCallback((isPrivate: boolean) => {
    setFormData(prev => ({ ...prev, isPrivate }));
  }, []);

  // Enhanced scoring toggle with validation
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
    
    setFormData(prev => ({ 
      ...prev, 
      showTotalScore: enabled,
      scoreRanges: enabled ? prev.scoreRanges : []
    }));
  }, [formData.fields]);

  // Simple score ranges save - just update local state (no automatic saving)
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
    
    setFormData(prev => ({ 
      ...prev, 
      scoreRanges: [...validRanges]
    }));
  }, []);

  const updateField = (id: string, updatedField: FormField) => {
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        fields: (prev.fields || []).map(field =>
          field.id === id ? updatedField : field
        ),
      };
      
      // Check if scoring should be disabled
      const hasFieldsWithNumericValues = updatedFormData.fields.some(field => field.hasNumericValues === true);
      
      if (!hasFieldsWithNumericValues && updatedFormData.showTotalScore) {
        console.log("useFormBuilder - Disabling scoring: no numeric fields");
        updatedFormData.showTotalScore = false;
        updatedFormData.scoreRanges = [];
        
        toast({
          title: 'Puntuación deshabilitada',
          description: 'Se deshabilitó porque ningún campo tiene valores numéricos.',
        });
      }
      
      return updatedFormData;
    });
  };

  const removeField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      fields: (prev.fields || []).filter(field => field.id !== id),
    }));
  };

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: fieldType as any,
      label: '',
      required: false,
      options: fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox' ? [
        { id: crypto.randomUUID(), label: 'Option 1', value: 'option_1' },
        { id: crypto.randomUUID(), label: 'Option 2', value: 'option_2' }
      ] : undefined
    };

    setFormData(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
    }));
  };

  const addAllowedUser = async () => {
    if (!allowedUserEmail || !allowedUserName) {
      toast({
        title: "Error",
        description: "Por favor, introduce tanto el nombre como el correo electrónico",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
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

    // Check if the email is already in the allowed users list
    if (formData.allowedUsers?.includes(lowerCaseEmail)) {
      toast({
        title: "Usuario ya añadido",
        description: "Este usuario ya tiene acceso a este formulario",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add user to the usuario_invitado table in Supabase
      const newInvitedUser = await addInvitedUser(allowedUserName, lowerCaseEmail);
      
      if (newInvitedUser) {
        // Add user to the form's allowed users list
        setFormData(prev => ({
          ...prev,
          allowedUsers: [...(prev.allowedUsers || []), lowerCaseEmail],
        }));
        
        setAllowedUserEmail('');
        setAllowedUserName('');
        
        toast({
          title: "Usuario añadido",
          description: `${allowedUserName} (${lowerCaseEmail}) ha sido añadido al formulario y a la lista de usuarios invitados`,
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
    setFormData(prev => ({
      ...prev,
      allowedUsers: (prev.allowedUsers || []).filter(user => user !== email),
    }));
  };

  const handleAllowViewOwnResponsesChange = (allow: boolean) => {
    setFormData(prev => ({ ...prev, allowViewOwnResponses: allow }));
  };

  const handleAllowEditOwnResponsesChange = (allow: boolean) => {
    setFormData(prev => ({ ...prev, allowEditOwnResponses: allow }));
  };

  const handleFormColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, formColor: color }));
  };

  const handleHttpConfigChange = (config: any) => {
    setFormData(prev => ({ ...prev, httpConfig: config }));
  };

  // Enhanced collaborators change handler with validation and logging
  const handleCollaboratorsChange = useCallback((collaborators: string[]) => {
    console.log("useFormBuilder - handleCollaboratorsChange called with:", collaborators);
    
    // Validate and sanitize collaborators array
    const validCollaborators = Array.isArray(collaborators) 
      ? collaborators.filter(email => typeof email === 'string' && email.trim().length > 0)
      : [];
    
    console.log("useFormBuilder - Setting valid collaborators:", validCollaborators);
    
    setFormData(prev => ({ 
      ...prev, 
      collaborators: validCollaborators 
    }));
  }, []);

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
  }, [formData, isEditMode, formId]);

  const handleCreateForm = async (formData: Partial<Form>) => {
    try {
      setIsSaving(true);
      console.log("useFormBuilder - Creating form with collaborators:", formData.collaborators);
      
      const newForm = await createForm(formData);
      console.log("useFormBuilder - Form created successfully:", newForm);
      
      navigate('/dashboard-admin');
      
      toast({
        title: 'Formulario creado',
        description: `"${newForm.title}" ha sido creado exitosamente`,
      });
    } catch (error) {
      console.error("useFormBuilder - Error creating form:", error);
      toast({
        title: 'Error al crear formulario',
        description: 'Algo salió mal al crear el formulario.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateForm = async (id: string, formData: Partial<Form>) => {
    try {
      setIsSaving(true);
      console.log("useFormBuilder - Updating form with collaborators:", {
        id,
        collaborators: formData.collaborators,
        collaboratorsCount: formData.collaborators?.length || 0
      });
      
      await updateForm(id, formData);
      
      console.log("useFormBuilder - Form update completed successfully");
      // Don't show success message here since it's already shown in updateFormOperation
    } catch (error) {
      console.error("useFormBuilder - Error updating form:", error);
      // Error message is already shown in updateFormOperation
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    isLoading,
    isSaving,
    formData,
    isEditMode,
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
