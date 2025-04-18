
import React from "react";
import { useParams } from "react-router-dom";
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
    updateField,
    removeField,
    addAllowedUser,
    removeAllowedUser,
    handleSubmit,
    setAllowedUserEmail
  } = useFormBuilder(id);

  const handleSave = () => {
    handleSubmit(new Event('submit'));
  };

  return (
    <Layout title={isEditMode ? "Edit Form" : "Create Form"}>
      <FormBuilderHeader 
        isSaving={isSaving} 
        isEditMode={isEditMode} 
        onSave={handleSave}
      />
      
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <FormBuilderTabs 
          formData={formData}
          onTitleChange={handleTitleChange}
          onDescriptionChange={handleDescriptionChange}
          onPrivateChange={handlePrivateChange}
          updateField={updateField}
          removeField={removeField}
          allowedUserEmail={allowedUserEmail}
          setAllowedUserEmail={setAllowedUserEmail}
          addAllowedUser={addAllowedUser}
          removeAllowedUser={removeAllowedUser}
        />
      </form>
    </Layout>
  );
};

export default FormBuilder;
