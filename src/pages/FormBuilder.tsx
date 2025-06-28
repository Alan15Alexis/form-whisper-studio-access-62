
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
    isLoading,
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

  // Show loading state while form data is being loaded
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-500">
              Cargando datos del formulario...
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Add a safety check to ensure formData is not undefined before rendering
  if (!formData) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-500">
              Error: No se pudo cargar el formulario
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Clean up data to prevent serialization issues
  const safeFormData = {
    ...formData,
    showTotalScore: Boolean(formData.showTotalScore),
    scoreRanges: Array.isArray(formData.scoreRanges) ? formData.scoreRanges.map(range => ({
      min: Number(range.min) || 0,
      max: Number(range.max) || 0,
      message: String(range.message || '')
    })) : [],
    collaborators: Array.isArray(formData.collaborators) ? formData.collaborators : []
  };

  console.log("FormBuilder - Safe formData:", {
    id: safeFormData.id,
    showTotalScore: safeFormData.showTotalScore,
    scoreRangesCount: safeFormData.scoreRanges.length,
    collaboratorsCount: safeFormData.collaborators.length
  });

  return (
    <Layout>
      <div className="container py-8">
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
          />
        </DragDropContext>
      </div>
    </Layout>
  );
};

export default FormBuilder;
