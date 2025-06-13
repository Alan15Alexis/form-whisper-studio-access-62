
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormBasicInfo from "./FormBasicInfo";
import FormFieldsList from "./FormFieldsList";
import FieldsSidebar from "./FieldsSidebar";
import FormSettings from "./FormSettings";
import AccessControl from "../form-builder/AccessControl";
import ScoreRangesTab from "./ScoreRangesTab";
import { Form, FormField, ScoreRange } from "@/types/form";

interface FormBuilderTabsProps {
  formData: Partial<Form>;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPrivateChange: (isPrivate: boolean) => void;
  onToggleFormScoring: (enabled: boolean) => void;
  onSaveScoreRanges: (ranges: ScoreRange[]) => void;
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
  externalScoreRanges?: ScoreRange[];
  isScoringEnabled?: boolean;
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
  allowedUserName = "",
  setAllowedUserName = () => {},
  externalScoreRanges = [],
  isScoringEnabled = false
}: FormBuilderTabsProps) => {
  // Improved showTotalScore handling - explicitly handle undefined/null from database
  const showTotalScore = formData.showTotalScore === true;
  const scoreRanges = Array.isArray(formData.scoreRanges) ? formData.scoreRanges : [];
  
  // Check if fields have numeric values configured
  const hasFieldsWithNumericValues = (formData.fields || []).some(field => field.hasNumericValues === true);

  console.log("FormBuilderTabs - Rendering with improved data handling:", {
    title: formData.title,
    showTotalScore: {
      raw: formData.showTotalScore,
      processed: showTotalScore
    },
    scoreRanges: scoreRanges.length > 0 ? scoreRanges : 'No score ranges',
    hasFieldsWithNumericValues,
    formId
  });

  return (
    <Tabs defaultValue="fields" className="w-full mt-6">
      <TabsList className="mb-8">
        <TabsTrigger value="fields">Campos</TabsTrigger>
        <TabsTrigger value="settings">Configuración</TabsTrigger>
        <TabsTrigger value="ranges">Rangos</TabsTrigger>
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
              formShowTotalScore={showTotalScore}
              onToggleFormScoring={onToggleFormScoring}
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
        />
      </TabsContent>
      
      <TabsContent value="ranges">
        <ScoreRangesTab
          formFields={formData.fields || []}
          showTotalScore={showTotalScore}
          onToggleFormScoring={onToggleFormScoring}
          onSaveScoreRanges={onSaveScoreRanges}
          scoreRanges={scoreRanges}
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
