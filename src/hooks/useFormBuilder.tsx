import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@/contexts/form';
import { Form, FormField } from '@/types/form';
import { toast } from '@/hooks/toast';
import { addInvitedUser } from '@/integrations/supabase/client';

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

  // Initialize form data - simplified approach
  useEffect(() => {
    const initializeFormData = async () => {
      console.log("useFormBuilder - Initializing for formId:", formId);
      
      if (formId) {
        setIsLoading(true);
        
        try {
          const existingForm = getForm(formId);
          
          if (existingForm) {
            console.log("useFormBuilder - Found form:", {
              title: existingForm.title,
              showTotalScore: existingForm.showTotalScore,
              scoreRangesCount: existingForm.scoreRanges?.length || 0
            });
            
            // Use form data directly from database
            setForm(existingForm);
            setFormData(existingForm);
          } else {
            console.log("useFormBuilder - Form not found");
            toast({
              title: 'Form not found',
              description: 'The form you are trying to edit does not exist.',
              variant: 'destructive',
            });
            navigate('/dashboard-admin');
          }
        } catch (error) {
          console.error("useFormBuilder - Error:", error);
          toast({
            title: 'Error loading form',
            description: 'There was an error loading the form data.',
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
  }, [formId, getForm, navigate, forms]);

  const isEditMode = Boolean(formId);

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({ ...prev, title }));
  };

  const handleDescriptionChange = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
  };

  const handlePrivateChange = (isPrivate: boolean) => {
    setFormData(prev => ({ ...prev, isPrivate }));
  };

  // Simplified scoring toggle
  const handleToggleFormScoring = (enabled: boolean) => {
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
  };

  // Simplified score ranges save
  const handleSaveScoreRanges = (ranges: any[]) => {
    console.log("useFormBuilder - Save score ranges:", ranges.length);
    
    setFormData(prev => ({ 
      ...prev, 
      scoreRanges: [...ranges]
    }));
  };

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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedFields = Array.from(formData.fields || []);
    const [movedField] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, movedField);

    setFormData(prev => ({
      ...prev,
      fields: reorderedFields,
    }));
  };

  const handleSubmit = async () => {
    console.log("useFormBuilder - handleSubmit");
    
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
  };

  const handleCreateForm = async (formData: Partial<Form>) => {
    try {
      setIsSaving(true);
      console.log("Creating form with data:", formData);
      
      const newForm = await createForm(formData);
      console.log("Form created successfully:", newForm);
      
      navigate('/dashboard-admin');
      
      toast({
        title: 'Formulario creado',
        description: `"${newForm.title}" ha sido creado exitosamente`,
      });
    } catch (error) {
      console.error("Error creating form:", error);
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
      console.log("useFormBuilder - Updating form with scoreRanges:", formData.scoreRanges?.length || 0);
      
      await updateForm(id, formData);
      toast({
        title: 'Formulario actualizado',
        description: `"${formData.title}" ha sido actualizado exitosamente`,
      });
    } catch (error) {
      console.error("Error updating form:", error);
      toast({
        title: 'Error al actualizar formulario',
        description: 'Algo salió mal al actualizar el formulario.',
        variant: 'destructive',
      });
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
    handleSubmit,
    handleCreateForm,
    handleUpdateForm
  };
};
