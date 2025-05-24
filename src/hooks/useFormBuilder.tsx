import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "@/contexts/form/FormContext";
import { useAuth } from "@/contexts/AuthContext";
import { FormField, ScoreRange } from "@/types/form";

export const useFormBuilder = (id: string | undefined) => {
  const navigate = useNavigate();
  const {
    getForm,
    createForm,
    updateForm,
    addAllowedUser: addAllowedUserContext,
    removeAllowedUser: removeAllowedUserContext,
  } = useForm();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fields: [],
    isPrivate: false,
    allowViewOwnResponses: false,
    allowEditOwnResponses: false,
    formColor: "#FFFFFF",
    httpConfig: {
      enabled: false,
      url: "",
      method: "POST",
      headers: [],
      body: ""
    },
    showTotalScore: false,
    enableScoring: false,
    scoreRanges: [] as ScoreRange[],
  });
  const [allowedUserEmail, setAllowedUserEmail] = useState("");
  const [allowedUserName, setAllowedUserName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!id;
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>([]);
  const [isScoringEnabled, setIsScoringEnabled] = useState(false);

  useEffect(() => {
    if (id) {
      const existingForm = getForm(id);
      if (existingForm) {
        setFormData(existingForm);
        setIsScoringEnabled(existingForm.enableScoring || false);
        setScoreRanges(existingForm.scoreRanges || []);
      } else {
        toast({
          title: "Error",
          description: "Form not found",
          variant: "destructive",
        });
        navigate("/dashboard-admin");
      }
    }
  }, [id, getForm, navigate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, description: e.target.value });
  };

  const handlePrivateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, isPrivate: e.target.checked });
  };

  const handleAllowViewOwnResponsesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, allowViewOwnResponses: e.target.checked });
  };

  const handleAllowEditOwnResponsesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, allowEditOwnResponses: e.target.checked });
  };

  const handleFormColorChange = (color: string) => {
    setFormData({ ...formData, formColor: color });
  };

  const handleHttpConfigChange = (config: any) => {
    setFormData({ ...formData, httpConfig: config });
  };

  const handleToggleFormScoring = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enable = e.target.checked;
    setIsScoringEnabled(enable);
    setFormData(prev => ({ ...prev, enableScoring: enable, showTotalScore: enable }));
  };

  const handleSaveScoreRanges = (ranges: ScoreRange[]) => {
    setScoreRanges(ranges);
    setFormData(prev => ({ ...prev, scoreRanges: ranges }));
  };

  const updateField = (id: string, updatedField: Partial<FormField>) => {
    setFormData((prevFormData) => {
      const updatedFields = prevFormData.fields.map((field) =>
        field.id === id ? { ...field, ...updatedField } : field
      );
      return { ...prevFormData, fields: updatedFields };
    });
  };

  const removeField = (id: string) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      fields: prevFormData.fields.filter((field) => field.id !== id),
    }));
  };

  const addField = (newField: FormField) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      fields: [...prevFormData.fields, newField],
    }));
  };

  const addAllowedUser = async () => {
    if (!id) {
      toast({
        title: "Error",
        description: "Form ID is missing",
        variant: "destructive",
      });
      return;
    }

    if (!allowedUserEmail) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await addAllowedUserContext(id, allowedUserEmail);
      toast({
        title: "Success",
        description: `User ${allowedUserEmail} added successfully`,
      });
      setAllowedUserEmail("");
      setAllowedUserName("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const removeAllowedUser = async (email: string) => {
    if (!id) {
      toast({
        title: "Error",
        description: "Form ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      await removeAllowedUserContext(id, email);
      toast({
        title: "Success",
        description: `User ${email} removed successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      if (isEditMode && id) {
        // Ensure score ranges are saved to the form
        const updatedFormData = { ...formData, scoreRanges: scoreRanges, enableScoring: isScoringEnabled };
        await updateForm(id, updatedFormData);
        toast({
          title: "Success",
          description: "Form updated successfully",
        });
      } else {
        // Ensure score ranges are saved to the form
        const newFormData = { ...formData, scoreRanges: scoreRanges, enableScoring: isScoringEnabled, ownerId: currentUser?.id };
        await createForm(newFormData);
        toast({
          title: "Success",
          description: "Form created successfully",
        });
        navigate("/dashboard-admin");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save form",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(formData.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData({ ...formData, fields: items });
  };

  return {
    formData,
    allowedUserEmail,
    allowedUserName,
    isSaving,
    isEditMode,
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
    handleHttpConfigChange,
    scoreRanges,
    isScoringEnabled
  };
};
