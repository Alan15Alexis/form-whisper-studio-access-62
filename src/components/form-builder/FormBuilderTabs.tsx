
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/types/form";
import FormBasicInfo from "./FormBasicInfo";
import FormFieldsList from "./FormFieldsList";
import FormSettings from "./FormSettings";
import AccessControl from "./AccessControl";
import ScoreRangesTab from "./ScoreRangesTab";

interface FormBuilderTabsProps {
  formData: Form;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPrivateChange: (isPrivate: boolean) => void;
  onToggleFormScoring: (enabled: boolean) => void;
  onSaveScoreRanges: (ranges: any[]) => void;
  updateField: (id: string, field: any) => void;
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
  onCollaboratorsChange?: (collaborators: string[]) => void;
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
  onCollaboratorsChange
}: FormBuilderTabsProps) => {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-6">
        <TabsTrigger value="basic" className="text-sm">Básico</TabsTrigger>
        <TabsTrigger value="fields" className="text-sm">Campos</TabsTrigger>
        <TabsTrigger value="settings" className="text-sm">Configuración</TabsTrigger>
        <TabsTrigger value="access" className="text-sm">Acceso</TabsTrigger>
        <TabsTrigger value="scoring" className="text-sm">Puntuación</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="mt-6">
        <FormBasicInfo
          formData={formData}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
        />
      </TabsContent>
      
      <TabsContent value="fields" className="mt-6">
        <FormFieldsList
          formData={formData}
          updateField={updateField}
          removeField={removeField}
          onToggleFormScoring={onToggleFormScoring}
          formShowTotalScore={formData.showTotalScore}
        />
      </TabsContent>
      
      <TabsContent value="settings" className="mt-6">
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
          collaborators={formData.collaborators || []}
          onCollaboratorsChange={onCollaboratorsChange}
        />
      </TabsContent>
      
      <TabsContent value="access" className="mt-6">
        <AccessControl
          allowedUsers={formData.allowedUsers || []}
          allowedUserEmail={allowedUserEmail}
          allowedUserName={allowedUserName}
          onAllowedUserEmailChange={setAllowedUserEmail}
          onAllowedUserNameChange={setAllowedUserName}
          onAddAllowedUser={addAllowedUser}
          onRemoveAllowedUser={removeAllowedUser}
        />
      </TabsContent>
      
      <TabsContent value="scoring" className="mt-6">
        <ScoreRangesTab
          formFields={formData.fields || []}
          showTotalScore={formData.showTotalScore || false}
          onToggleFormScoring={onToggleFormScoring}
          onSaveScoreRanges={onSaveScoreRanges}
          scoreRanges={formData.scoreRanges || []}
        />
      </TabsContent>
    </Tabs>
  );
};

export default FormBuilderTabs;
