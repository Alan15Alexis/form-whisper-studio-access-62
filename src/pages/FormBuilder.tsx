
//Paguina para crear y edeitar formularios
import React from "react";
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
    isSaving,
    isEditMode,
    handleTitleChange,
    handleDescriptionChange,
    handlePrivateChange,
    handleToggleFormScoring,
    updateField,
    removeField,
    addField,
    addAllowedUser,
    removeAllowedUser,
    handleSubmit,
    setAllowedUserEmail,
    handleDragEnd,
    handleAllowViewOwnResponsesChange,
    handleAllowEditOwnResponsesChange,
    handleFormColorChange,
    handleHttpConfigChange
  } = useFormBuilder(id);

  const handleSave = () => {
    handleSubmit();
  };

  return (
    <Layout title={isEditMode ? "Edit Form" : "Create Form"}>
      <FormBuilderHeader 
        isSaving={isSaving} 
        isEditMode={isEditMode} 
        onSave={handleSave}
      />
      <DragDropContext onDragEnd={handleDragEnd}>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <FormBuilderTabs 
            formData={formData}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            onPrivateChange={handlePrivateChange}
            onToggleFormScoring={handleToggleFormScoring}
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
          />
        </form>
      </DragDropContext>
    </Layout>
  );
};

export default FormBuilder;
