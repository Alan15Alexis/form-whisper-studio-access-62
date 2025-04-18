
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "@/contexts/FormContext";
import { FormField, Form } from "@/types/form";

export function useFormBuilder(formId?: string) {
  const navigate = useNavigate();
  const { getForm, createForm, updateForm } = useForm();
  const isEditMode = !!formId;
  
  const [formData, setFormData] = useState<Partial<Form>>({
    title: "",
    description: "",
    fields: [],
    isPrivate: false,
    allowedUsers: [],
  });
  
  const [allowedUserEmail, setAllowedUserEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
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

  const addField = (type: string) => {
    const newField: FormField = {
      id: uuidv4(),
      type: type as any,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: "",
      required: false,
    };
    
    setFormData({ 
      ...formData, 
      fields: [...(formData.fields || []), newField] 
    });
  };

  const updateField = (id: string, updatedField: FormField) => {
    if (!formData.fields) return;
    
    setFormData({
      ...formData,
      fields: formData.fields.map(field => 
        field.id === id ? updatedField : field
      ),
    });
  };

  const removeField = (id: string) => {
    if (!formData.fields) return;
    
    setFormData({
      ...formData,
      fields: formData.fields.filter(field => field.id !== id),
    });
  };

  const addAllowedUser = () => {
    if (!allowedUserEmail.trim() || !formData.isPrivate) return;
    
    // Check if email is already added
    if (formData.allowedUsers?.includes(allowedUserEmail)) {
      return;
    }
    
    setFormData({
      ...formData,
      allowedUsers: [...(formData.allowedUsers || []), allowedUserEmail],
    });
    
    setAllowedUserEmail("");
  };

  const removeAllowedUser = (email: string) => {
    setFormData({
      ...formData,
      allowedUsers: formData.allowedUsers?.filter(user => user !== email),
    });
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

  const handleDragEnd = (result: import("react-beautiful-dnd").DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    // If dragging from sidebar to form area
    if (source.droppableId === "FIELDS_SIDEBAR" && destination.droppableId === "FORM_FIELDS") {
      // Parse the field type from the draggable id
      const fieldType = source.droppableId === "FIELDS_SIDEBAR" 
        ? result.draggableId.split("-")[1] 
        : "text";
      
      addField(fieldType);
      return;
    }
    
    // If reordering within form fields
    if (source.droppableId === "FORM_FIELDS" && destination.droppableId === "FORM_FIELDS") {
      if (!formData.fields) return;
      
      const reorderedFields = Array.from(formData.fields);
      const [removed] = reorderedFields.splice(source.index, 1);
      reorderedFields.splice(destination.index, 0, removed);
      
      setFormData({
        ...formData,
        fields: reorderedFields,
      });
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
    addField,
    updateField,
    removeField,
    addAllowedUser,
    removeAllowedUser,
    handleSubmit,
    handleDragEnd,
    setAllowedUserEmail
  };
}
