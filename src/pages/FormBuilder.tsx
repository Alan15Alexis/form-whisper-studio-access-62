
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useFormBuilder } from "@/hooks/useFormBuilder";
import FormBuilderHeader from "@/components/form-builder/FormBuilderHeader";
import FormBuilderTabs from "@/components/form-builder/FormBuilderTabs";
import { DragDropContext } from "react-beautiful-dnd";

const FormBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const {
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
    scoreRanges // Get scoreRanges from the hook
  } = useFormBuilder(id);

  // Log the form data for debugging
  console.log("FormBuilder - Current form data:", {
    showTotalScore: formData.showTotalScore,
    scoreConfig: formData.scoreConfig,
    scoreRanges: formData.scoreRanges,
    fieldsWithRanges: formData.fields?.some(f => f.scoreRanges && f.scoreRanges.length > 0),
    externalScoreRanges: scoreRanges // Log the scoreRanges from the hook
  });

  return (
    <Layout>
      <div className="container py-8">
        <FormBuilderHeader
          isEditMode={isEditMode}
          formTitle={formData.title || ''}
          isSaving={isSaving}
          onSave={handleSubmit}
        />

        <DragDropContext onDragEnd={handleDragEnd}>
          <FormBuilderTabs
            formData={formData}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            onPrivateChange={handlePrivateChange}
            onToggleFormScoring={handleToggleFormScoring}
            onSaveScoreRanges={handleSaveScoreRanges}
            updateField={updateField}
            removeField={removeField}
            allowedUserEmail={allowedUserEmail}
            setAllowedUserEmail={setAllowedUserEmail}
            addAllowedUser={addAllowedUser}
            removeAllowedUser={removeAllowedUser}
            onAllowViewOwnResponsesChange={handleAllowViewOwnResponsesChange}
            onAllowEditOwnResponsesChange={handleAllowEditOwnResponsesChange}
            onFormColorChange={handleFormColorChange}
            onHttpConfigChange={handleHttpConfigChange}
            addField={addField}
            formId={id}
            allowedUserName={allowedUserName}
            setAllowedUserName={setAllowedUserName}
            externalScoreRanges={scoreRanges} // Pass scoreRanges to the tabs
          />
        </DragDropContext>
      </div>
    </Layout>
  );
};

export default FormBuilder;
