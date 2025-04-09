
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "@/contexts/FormContext";
import Layout from "@/components/Layout";
import FormFieldEditor from "@/components/FormFieldEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormField, Form } from "@/types/form";
import { Plus, Save, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, description: e.target.value });
  };

  const handlePrivateChange = (isPrivate: boolean) => {
    setFormData({ ...formData, isPrivate });
  };

  const addField = () => {
    const newField: FormField = {
      id: uuidv4(),
      type: "text",
      label: "New Field",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (isEditMode && id) {
        await updateForm(id, formData);
      } else {
        const newForm = await createForm(formData);
        // Fix the assignment to id which was a const
        // Instead, navigate to the new form after creation
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
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="fields">Form Fields</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {formData.isPrivate && <TabsTrigger value="access">Access Control</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="fields" className="space-y-6 animate-fadeIn">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-lg font-medium">Form Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="Enter form title"
                    required
                    className="text-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-lg font-medium">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={handleDescriptionChange}
                    placeholder="Enter form description"
                    rows={3}
                  />
                </div>
              </div>
            </Card>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Form Fields</h3>
                <Button type="button" onClick={addField} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Add Field
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.fields && formData.fields.length > 0 ? (
                  formData.fields.map(field => (
                    <FormFieldEditor
                      key={field.id}
                      field={field}
                      onChange={(updatedField) => updateField(field.id, updatedField)}
                      onDelete={() => removeField(field.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 border rounded-lg border-dashed">
                    <p className="text-gray-500 mb-4">No fields added yet</p>
                    <Button type="button" onClick={addField} variant="outline">
                      <Plus className="mr-2 h-4 w-4" /> Add Your First Field
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6 animate-fadeIn">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Switch
                    id="private-form"
                    checked={formData.isPrivate}
                    onCheckedChange={handlePrivateChange}
                  />
                  <div>
                    <Label htmlFor="private-form" className="text-lg font-medium">Private Form</Label>
                    <p className="text-sm text-gray-500">
                      When enabled, only specified users can access this form
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {formData.isPrivate && (
            <TabsContent value="access" className="space-y-6 animate-fadeIn">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Allowed Users</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Add email addresses of users who are allowed to access this form
                    </p>
                    
                    <div className="flex space-x-2 mb-4">
                      <Input
                        value={allowedUserEmail}
                        onChange={(e) => setAllowedUserEmail(e.target.value)}
                        placeholder="user@example.com"
                        type="email"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        onClick={addAllowedUser}
                        disabled={!allowedUserEmail.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {formData.allowedUsers && formData.allowedUsers.length > 0 ? (
                      <div className="space-y-2">
                        {formData.allowedUsers.map(email => (
                          <div 
                            key={email} 
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
                          >
                            <span>{email}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeAllowedUser(email)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border rounded-lg border-dashed">
                        <p className="text-gray-500">No users added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
        
        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={isSaving} className="px-8">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : isEditMode ? "Update Form" : "Save Form"}
          </Button>
        </div>
      </form>
    </Layout>
  );
};

export default FormBuilder;
