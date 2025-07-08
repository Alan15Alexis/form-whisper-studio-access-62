
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormBasicInfo from "./FormBasicInfo";
import FormFieldsList from "./FormFieldsList";
import FormSettings from "./FormSettings";
import AccessControl from "./AccessControl";
import { FormField, Form } from "@/types/form";

interface FormBuilderTabsProps {
  formData: Partial<Form>;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPrivateChange: (isPrivate: boolean) => void;
  onToggleFormScoring: (enabled: boolean) => void;
  onSaveScoreRanges: (ranges: Array<{ min: number; max: number; message: string }>) => void;
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
  allowedUserEmail: string;
  setAllowedUserEmail: (email: string) => void;
  addAllowedUser: () => void;
  removeAllowedUser: (email: string) => void;
  onAllowViewOwnResponsesChange: (allow: boolean) => void;
  onAllowEditOwnResponsesChange: (allow: boolean) => void;
  onFormColorChange: (color: string) => void;
  onHttpConfigChange: (config: any) => void;
  addField: (fieldType: string) => void;
  formId?: string;
  allowedUserName: string;
  setAllowedUserName: (name: string) => void;
  onCollaboratorsChange: (collaborators: string[]) => void;
  updateTrigger: number;
}

const FormBuilderTabs = ({ 
  formData, 
  onTitleChange, 
  onDescriptionChange,
  onPrivateChange,
  onToggleFormScoring,
  onSaveScoreRanges,
  updateField,
  removeField,
  allowedUserEmail,
  setAllowedUserEmail,
  addAllowedUser,
  removeAllowedUser,
  onAllowViewOwnResponsesChange,
  onAllowEditOwnResponsesChange,
  onFormColorChange,
  onHttpConfigChange,
  addField,
  formId,
  allowedUserName,
  setAllowedUserName,
  onCollaboratorsChange,
  updateTrigger
}: FormBuilderTabsProps) => {
  const [activeTab, setActiveTab] = useState("fields");

  console.log("FormBuilderTabs - Render triggered:", {
    updateTrigger,
    fieldsCount: formData.fields?.length || 0
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="fields">Campos</TabsTrigger>
        <TabsTrigger value="settings">Configuración</TabsTrigger>
        <TabsTrigger value="access">Acceso</TabsTrigger>
        <TabsTrigger value="basic">Información</TabsTrigger>
      </TabsList>

      <TabsContent value="fields" className="space-y-6">
        <FormFieldsList
          formData={formData}
          updateField={updateField}
          removeField={removeField}
          onToggleFormScoring={onToggleFormScoring}
          formShowTotalScore={formData.showTotalScore}
          addField={addField}
          updateTrigger={updateTrigger}
        />
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <FormSettings
          isPrivate={formData.isPrivate || false}
          onPrivateChange={onPrivateChange}
          allowViewOwnResponses={formData.allowViewOwnResponses}
          onAllowViewOwnResponsesChange={onAllowViewOwnResponsesChange}
          allowEditOwnResponses={formData.allowEditOwnResponses}
          onAllowEditOwnResponsesChange={onAllowEditOwnResponsesChange}
          formColor={formData.formColor}
          onFormColorChange={onFormColorChange}
          httpConfig={formData.httpConfig}
          onHttpConfigChange={onHttpConfigChange}
          formFields={formData.fields}
          formId={formId}
          collaborators={formData.collaborators}
          onCollaboratorsChange={onCollaboratorsChange}
        />
      </TabsContent>

      <TabsContent value="access" className="space-y-6">
        <AccessControl
          allowedUsers={formData.allowedUsers || []}
          allowedUserEmail={allowedUserEmail}
          onAllowedUserEmailChange={setAllowedUserEmail}
          onAddAllowedUser={addAllowedUser}
          onRemoveAllowedUser={removeAllowedUser}
          allowedUserName={allowedUserName}
          onAllowedUserNameChange={setAllowedUserName}
        />
      </TabsContent>

      <TabsContent value="basic" className="space-y-6">
        <FormBasicInfo
          formData={formData}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default FormBuilderTabs;
