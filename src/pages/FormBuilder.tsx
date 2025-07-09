
import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useFormBuilder } from "@/hooks/useFormBuilder";
import FormBuilderHeader from "@/components/form-builder/FormBuilderHeader";
import FormBuilderTabs from "@/components/form-builder/FormBuilderTabs";
import { FormBuilderContainer } from "@/components/form-builder/FormBuilderContainer";
import { DragDropContext } from "react-beautiful-dnd";

const FormBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const {
    formData,
    allowedUserEmail,
    allowedUserName,
    isSaving,
    isEditMode,
    isLoading,
    updateTrigger,
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
    handleCollaboratorsChange
  } = useFormBuilder(id);

  // Clean up data to prevent serialization issues
  const safeFormData = formData ? {
    ...formData,
    showTotalScore: Boolean(formData.showTotalScore),
    scoreRanges: Array.isArray(formData.scoreRanges) ? formData.scoreRanges.map(range => ({
      min: Number(range.min) || 0,
      max: Number(range.max) || 0,
      message: String(range.message || '')
    })) : [],
    collaborators: Array.isArray(formData.collaborators) ? formData.collaborators : []
  } : null;

  console.log("FormBuilder - Safe formData:", safeFormData && {
    id: safeFormData.id,
    showTotalScore: safeFormData.showTotalScore,
    scoreRangesCount: safeFormData.scoreRanges.length,
    collaboratorsCount: safeFormData.collaborators.length,
    fieldsCount: safeFormData.fields?.length || 0,
    updateTrigger
  });

  return (
    <Layout>
      <FormBuilderContainer 
        isLoading={isLoading}
        hasError={!safeFormData && !isLoading}
        errorMessage="No se pudo cargar el formulario"
      >
        {safeFormData && (
          <>
            <FormBuilderHeader
              isEditMode={isEditMode}
              formTitle={safeFormData.title || ''}
              isSaving={isSaving}
              onSave={handleSubmit}
            />

            <DragDropContext onDragEnd={handleDragEnd}>
              <FormBuilderTabs
                formData={safeFormData}
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
                onCollaboratorsChange={handleCollaboratorsChange}
                updateTrigger={updateTrigger}
              />
            </DragDropContext>
          </>
        )}
      </FormBuilderContainer>
    </Layout>
  );
};

export default FormBuilder;
