
import React from "react";
import { useParams } from "react-router-dom";
import { DragDropContext } from "react-beautiful-dnd";
import Layout from "@/components/Layout";
import { useFormBuilder } from "@/hooks/useFormBuilder";
import FormBuilderHeader from "@/components/form-builder/FormBuilderHeader";
import FormBuilderTabs from "@/components/form-builder/FormBuilderTabs";

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
    addField,
    updateField,
    removeField,
    addAllowedUser,
    removeAllowedUser,
    handleSubmit,
    handleDragEnd,
    setAllowedUserEmail
  } = useFormBuilder(id);

  return (
    <Layout title={isEditMode ? "Edit Form" : "Create Form"}>
      <FormBuilderHeader isSaving={isSaving} isEditMode={isEditMode} />
      
      <form onSubmit={handleSubmit}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <FormBuilderTabs 
            formData={formData}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            onPrivateChange={handlePrivateChange}
            addField={addField}
            updateField={updateField}
            removeField={removeField}
            allowedUserEmail={allowedUserEmail}
            setAllowedUserEmail={setAllowedUserEmail}
            addAllowedUser={addAllowedUser}
            removeAllowedUser={removeAllowedUser}
          />
        </DragDropContext>
      </form>
    </Layout>
  );
};

export default FormBuilder;
