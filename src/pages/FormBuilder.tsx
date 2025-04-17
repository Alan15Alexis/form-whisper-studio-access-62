
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "@/contexts/FormContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormField, Form } from "@/types/form";
import { DragDropContext, DropResult } from "react-beautiful-dnd";

// Imported components
import FormBasicInfo from "@/components/form-builder/FormBasicInfo";
import FormFieldsList from "@/components/form-builder/FormFieldsList";
import FormSettings from "@/components/form-builder/FormSettings";
import AccessControl from "@/components/form-builder/AccessControl";
import FormActions from "@/components/form-builder/FormActions";
import FieldsSidebar from "@/components/form-builder/FieldsSidebar";

const FormBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getForm, createForm, updateForm } = useForm();
  const isEditMode = !!id;
  
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
    if (isEditMode) {
      const existingForm = getForm(id);
      if (existingForm) {
        setFormData(existingForm);
      } else {
        navigate("/dashboard");
      }
    }
  }, [id, getForm, isEditMode, navigate]);

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

  const handleDragEnd = (result: DropResult) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (isEditMode && id) {
        await updateForm(id, formData);
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

  return (
    <Layout title={isEditMode ? "Edit Form" : "Create Form"}>
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <FormActions isSaving={isSaving} isEditMode={isEditMode} />
      </div>
      
      <form onSubmit={handleSubmit}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Tabs defaultValue="fields" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="fields">Form Fields</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              {formData.isPrivate && <TabsTrigger value="access">Access Control</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="fields" className="space-y-6 animate-fadeIn">
              <FormBasicInfo 
                formData={formData} 
                onTitleChange={handleTitleChange}
                onDescriptionChange={handleDescriptionChange}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <FieldsSidebar />
                </div>
                
                <div className="md:col-span-3">
                  <FormFieldsList 
                    formData={formData}
                    addField={addField}
                    updateField={updateField}
                    removeField={removeField}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6 animate-fadeIn">
              <FormSettings 
                isPrivate={formData.isPrivate || false}
                onPrivateChange={handlePrivateChange}
              />
            </TabsContent>
            
            {formData.isPrivate && (
              <TabsContent value="access" className="space-y-6 animate-fadeIn">
                <AccessControl 
                  allowedUsers={formData.allowedUsers || []}
                  allowedUserEmail={allowedUserEmail}
                  onAllowedUserEmailChange={setAllowedUserEmail}
                  onAddAllowedUser={addAllowedUser}
                  onRemoveAllowedUser={removeAllowedUser}
                />
              </TabsContent>
            )}
          </Tabs>
        </DragDropContext>
      </form>
    </Layout>
  );
};

export default FormBuilder;
