
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/types/form";
import FormBasicInfo from "@/components/form-builder/FormBasicInfo";
import FormFieldsList from "@/components/form-builder/FormFieldsList";
import FormSettings from "@/components/form-builder/FormSettings";
import AccessControl from "@/components/form-builder/AccessControl";
import FieldsSidebar from "@/components/form-builder/FieldsSidebar";

interface FormBuilderTabsProps {
  formData: Partial<Form>;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPrivateChange: (isPrivate: boolean) => void;
  onToggleFormScoring: (enabled: boolean) => void;  // Added this missing property
  updateField: (id: string, field: any) => void;
  removeField: (id: string) => void;
  allowedUserEmail: string;
  setAllowedUserEmail: (email: string) => void;
  addAllowedUser: () => void;
  removeAllowedUser: (email: string) => void;
}

const FormBuilderTabs = ({
  formData,
  onTitleChange,
  onDescriptionChange,
  onPrivateChange,
  onToggleFormScoring,  // Added this missing property
  updateField,
  removeField,
  allowedUserEmail,
  setAllowedUserEmail,
  addAllowedUser,
  removeAllowedUser
}: FormBuilderTabsProps) => {
  return (
    <Tabs defaultValue="fields" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="fields">Form Fields</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        {formData.isPrivate && <TabsTrigger value="access">Access Control</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="fields" className="space-y-6 animate-fadeIn">
        <FormBasicInfo 
          formData={formData} 
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <FieldsSidebar />
          </div>
          
          <div className="md:col-span-3">
            <FormFieldsList 
              formData={formData}
              updateField={updateField}
              removeField={removeField}
              onToggleFormScoring={onToggleFormScoring}
            />
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="settings" className="space-y-6 animate-fadeIn">
        <FormSettings 
          isPrivate={formData.isPrivate || false}
          onPrivateChange={onPrivateChange}
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
  );
};

export default FormBuilderTabs;
