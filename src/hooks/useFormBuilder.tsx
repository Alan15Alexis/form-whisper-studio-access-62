import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form } from "@/types/form";
import { useForm } from "@/contexts/FormContext";
import { useFormFields } from "./form-builder/useFormFields";
import { useDragAndDrop } from "./form-builder/useDragAndDrop";
import { useFormScoring } from "./form-builder/useFormScoring";

export function useFormBuilder(formId?: string) {
  const navigate = useNavigate();
  const { getForm, createForm, updateForm, addAllowedUser: addAllowedUserToForm, removeAllowedUser: removeAllowedUserFromForm } = useForm();
  const isEditMode = !!formId;
  
  const [formData, setFormData] = useState<Partial<Form>>({
    title: "",
    description: "",
    fields: [],
    isPrivate: false,
    allowedUsers: [],
    showTotalScore: false,
    allowViewOwnResponses: false,
    allowEditOwnResponses: false,
    formColor: "#3b82f6",
  });
  
  const [allowedUserEmail, setAllowedUserEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const { addField, updateField: updateFieldUtil, removeField: removeFieldUtil } = useFormFields();
  const { handleDragEnd: handleDragEndUtil } = useDragAndDrop(
    (type) => setFormData(prev => ({ ...prev, fields: addField(type, prev.fields) })),
    formData,
    setFormData
  );
  const { calculateTotalScore, getScoreFeedback } = useFormScoring();
  
  useEffect(() => {
    if (isEditMode && formId) {
      const existingForm = getForm(formId);
      if (existingForm) {
        setFormData(existingForm);
      } else {
        navigate("/dashboard");
      }
    }
  }, [formId, getForm, isEditMode, navigate]);

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
  };

  const handleDescriptionChange = (description: string) => {
    setFormData({ ...formData, description });
  };

  const handlePrivateChange = (isPrivate: boolean) => {
    setFormData({ ...formData, isPrivate });
  };

  const handleToggleFormScoring = (showTotalScore: boolean) => {
    setFormData({ ...formData, showTotalScore });
  };

  const updateField = (id: string, field: any) => {
    setFormData(prev => ({
      ...prev,
      fields: updateFieldUtil(id, field, prev.fields || [])
    }));
  };

  const removeField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      fields: removeFieldUtil(id, prev.fields || [])
    }));
  };

  const addAllowedUser = async () => {
    if (!formId || !allowedUserEmail.trim()) return;
    
    const success = await addAllowedUserToForm(formId, allowedUserEmail);
    if (success) {
      setFormData(prev => ({
        ...prev,
        allowedUsers: [...(prev.allowedUsers || []), allowedUserEmail]
      }));
      setAllowedUserEmail("");
    }
  };

  const removeAllowedUser = async (email: string) => {
    if (!formId) return;
    
    const success = await removeAllowedUserFromForm(formId, email);
    if (success) {
      setFormData(prev => ({
        ...prev,
        allowedUsers: (prev.allowedUsers || []).filter(e => e !== email)
      }));
    }
  };

  const handleAllowViewOwnResponsesChange = (allow: boolean) => {
    setFormData({ ...formData, allowViewOwnResponses: allow });
  };

  const handleAllowEditOwnResponsesChange = (allow: boolean) => {
    setFormData({ ...formData, allowEditOwnResponses: allow });
  };

  const handleFormColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, formColor: color }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      if (isEditMode && formId) {
        await updateForm(formId, formData);
      } else {
        const newForm = await createForm(formData);
        navigate(`/forms/${newForm.id}/edit`);
      }
    } catch (error) {
      console.error("Error saving form:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    allowedUserEmail,
    isSaving,
    isEditMode,
    handleTitleChange,
    handleDescriptionChange,
    handlePrivateChange,
    handleToggleFormScoring,
    updateField,
    removeField,
    handleSubmit,
    handleDragEnd: handleDragEndUtil,
    setAllowedUserEmail,
    calculateTotalScore,
    getScoreFeedback,
    addAllowedUser,
    removeAllowedUser,
    handleAllowViewOwnResponsesChange,
    handleAllowEditOwnResponsesChange,
    handleFormColorChange,
  };
}
