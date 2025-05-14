
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormBasicInfo from "./FormBasicInfo";
import FormFieldsList from "./FormFieldsList";
import FieldsSidebar from "./FieldsSidebar";
import FormSettings from "./FormSettings";
import AccessControl from "../form-builder/AccessControl";
import { Form, FormField, ScoreRange } from "@/types/form";

interface FormBuilderTabsProps {
  formData: Partial<Form>;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPrivateChange: (isPrivate: boolean) => void;
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
  allowedUserEmail: string;
  setAllowedUserEmail: (email: string) => void;
  addAllowedUser: () => void;
  removeAllowedUser: (email: string) => void;
  onAllowViewOwnResponsesChange?: (allow: boolean) => void;
  onAllowEditOwnResponsesChange?: (allow: boolean) => void;
  onFormColorChange?: (color: string) => void;
  onHttpConfigChange?: (config: any) => void;
  addField: (fieldType: string) => void;
  formId?: string;
  allowedUserName?: string;
  setAllowedUserName?: (name: string) => void;
  onToggleFormScoring?: (enabled: boolean) => void;
  onSaveScoreRanges?: (ranges: ScoreRange[]) => void;
  externalScoreRanges?: ScoreRange[];
  isScoringEnabled?: boolean;
}

const FormBuilderTabs = ({
  formData,
  onTitleChange,
  onDescriptionChange,
  onPrivateChange,
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
  allowedUserName = "",
  setAllowedUserName = () => {},
  onToggleFormScoring,
  onSaveScoreRanges,
  externalScoreRanges,
  isScoringEnabled,
}: FormBuilderTabsProps) => {

  return (
    <Tabs defaultValue="fields" className="w-full mt-6">
      <TabsList className="mb-8">
        <TabsTrigger value="fields">Campos</TabsTrigger>
        <TabsTrigger value="settings">Configuración</TabsTrigger>
        {formData.isPrivate && <TabsTrigger value="access">Control de Acceso</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="fields" className="space-y-6">
        <FormBasicInfo 
          formData={formData}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">
            <FormFieldsList 
              formData={formData}
              updateField={updateField}
              removeField={removeField}
            />
          </div>
          <div className="lg:col-span-3">
            <FieldsSidebar onAddField={addField} />
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="settings">
        <FormSettings 
          isPrivate={!!formData.isPrivate} 
          onPrivateChange={onPrivateChange}
          allowViewOwnResponses={formData.allowViewOwnResponses}
          onAllowViewOwnResponsesChange={onAllowViewOwnResponsesChange}
          allowEditOwnResponses={formData.allowEditOwnResponses}
          onAllowEditOwnResponsesChange={onAllowEditOwnResponsesChange}
          formColor={formData.formColor}
          onFormColorChange={onFormColorChange}
          httpConfig={formData.httpConfig}
          onHttpConfigChange={onHttpConfigChange}
          formFields={formData.fields || []}
          formId={formId}
          showTotalScore={formData.showTotalScore}
          onToggleFormScoring={onToggleFormScoring}
          onSaveScoreRanges={onSaveScoreRanges}
          externalScoreRanges={externalScoreRanges}
          isScoringEnabled={isScoringEnabled}
        />
      </TabsContent>
      
      {formData.isPrivate && (
        <TabsContent value="access">
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
      )}
    </Tabs>
  );
};

export default FormBuilderTabs;
