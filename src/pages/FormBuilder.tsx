
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
    handleHttpConfigChange
  } = useFormBuilder(id);

  // Add a safety check to ensure formData is not undefined before rendering
  if (!formData) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-500">
              Loading form data...
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  console.log("FormBuilder - Rendering with standardized formData:", {
    showTotalScore: formData.showTotalScore,
    scoreRanges: formData.scoreRanges
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
          />
        </DragDropContext>
      </div>
    </Layout>
  );
};

export default FormBuilder;
