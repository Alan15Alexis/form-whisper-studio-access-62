
import { useState, useEffect, useCallback } from "react";
import { useForm } from "@/contexts/form";
import { useAuth } from "@/contexts/AuthContext";
import { FormField, ScoreRange } from "@/types/form";
import { toast } from "@/components/ui/use-toast";

interface FormData {
  title: string;
  description: string;
  fields: FormField[];
  isPrivate: boolean;
  allowViewOwnResponses: boolean;
  allowEditOwnResponses: boolean;
  formColor: string;
  httpConfig: {
    enabled: boolean;
    url: string;
    method: 'GET' | 'POST';
    headers: Array<{ id: number; key: string; value: string }>;
    body: string;
  };
  showTotalScore: boolean;
  enableScoring: boolean;
  scoreRanges: ScoreRange[];
}

export function useFormBuilder(id?: string) {
  const { forms, createForm, updateForm, getForm, addAllowedUser, removeAllowedUser } = useForm();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    fields: [],
    isPrivate: false,
    allowViewOwnResponses: false,
    allowEditOwnResponses: false,
    formColor: '#3b82f6',
    httpConfig: {
      enabled: false,
      url: '',
      method: 'POST',
      headers: [],
      body: ''
    },
    showTotalScore: false,
    enableScoring: false,
    scoreRanges: []
  });

  const [allowedUserEmail, setAllowedUserEmail] = useState('');
  const [allowedUserName, setAllowedUserName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>([]);
  const [isScoringEnabled, setIsScoringEnabled] = useState(false);

  const isEditMode = !!id;

  // Load existing form data in edit mode
  useEffect(() => {
    if (id) {
      const existingForm = getForm(id);
      if (existingForm) {
        setFormData({
          title: existingForm.title,
          description: existingForm.description || '',
          fields: existingForm.fields,
          isPrivate: existingForm.isPrivate,
          allowViewOwnResponses: existingForm.allowViewOwnResponses || false,
          allowEditOwnResponses: existingForm.allowEditOwnResponses || false,
          formColor: existingForm.formColor || '#3b82f6',
          httpConfig: existingForm.httpConfig || {
            enabled: false,
            url: '',
            method: 'POST',
            headers: [],
            body: ''
          },
          showTotalScore: existingForm.showTotalScore || false,
          enableScoring: existingForm.enableScoring || false,
          scoreRanges: existingForm.scoreRanges || []
        });
        setScoreRanges(existingForm.scoreRanges || []);
        setIsScoringEnabled(existingForm.enableScoring || false);
      }
    }
  }, [id, getForm]);

  // Event handlers
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({ ...prev, title }));
  };

  const handleDescriptionChange = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
  };

  const handlePrivateChange = (isPrivate: boolean) => {
    setFormData(prev => ({ ...prev, isPrivate }));
  };

  const handleToggleFormScoring = (enabled: boolean) => {
    setFormData(prev => ({ ...prev, enableScoring: enabled, showTotalScore: enabled }));
    setIsScoringEnabled(enabled);
  };

  const handleSaveScoreRanges = (ranges: ScoreRange[]) => {
    setFormData(prev => ({ ...prev, scoreRanges: ranges }));
    setScoreRanges(ranges);
  };

  const updateField = (index: number, field: FormField) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? field : f)
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldType as any,
      label: `Nueva pregunta ${formData.fields.length + 1}`,
      required: false
    };
    
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
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

    const items = Array.from(formData.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData(prev => ({ ...prev, fields: items }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título del formulario es requerido",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const formPayload = {
        ...formData,
        scoreRanges,
        enableScoring: isScoringEnabled,
        ownerId: currentUser?.id || '',
        allowedUsers: isEditMode ? undefined : []
      };

      if (isEditMode && id) {
        await updateForm(id, formPayload);
        toast({
          title: "Formulario actualizado",
          description: "Los cambios han sido guardados correctamente",
        });
      } else {
        await createForm(formPayload);
        toast({
          title: "Formulario creado",
          description: "El formulario ha sido creado exitosamente",
        });
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al guardar el formulario",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    allowedUserEmail,
    allowedUserName,
    isSaving,
    isEditMode,
    scoreRanges,
    isScoringEnabled,
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
    handleSubmit,
    setAllowedUserEmail,
    setAllowedUserName,
    handleDragEnd,
    handleAllowViewOwnResponsesChange,
    handleAllowEditOwnResponsesChange,
    handleFormColorChange,
    handleHttpConfigChange
  };
}
