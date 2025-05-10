
import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import FormField from "@/components/form-view/FormField";
import FormAccess from "@/components/form-view/FormAccess";
import FormSuccess from "@/components/form-view/FormSuccess";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useFormResponses } from "@/hooks/useFormResponses";
import FormQuestion from "@/components/form-view/FormQuestion";
import FormProgressBar from "@/components/form-view/FormProgressBar";
import FormNotFound from "@/components/form-view/FormNotFound";
import FormHeader from "@/components/form-view/FormHeader";
import { useForm } from "@/contexts/form";

const FormView = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isUserAllowed } = useForm();
  
  // Use custom hooks for form validation and responses
  const { form, accessValidated, validationLoading, setAccessValidated } = useFormValidation();
  const { 
    formResponses, 
    isSubmitting, 
    isSubmitSuccess, 
    currentQuestionIndex, 
    isEditMode,
    handleFieldChange, 
    handleSubmit, 
    handleNext, 
    handlePrevious 
  } = useFormResponses(form);

  const handleBackNavigation = () => {
    // If user is admin, navigate to dashboard-admin
    if (currentUser?.role === "admin") {
      navigate("/dashboard-admin");
    } else {
      // For regular users or unauthenticated users, navigate to assigned forms
      navigate("/assigned-forms");
    }
  };

  const handleAccessGranted = () => {
    setAccessValidated(true);
  };

  if (validationLoading) {
    return (
      <Layout hideNav>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (form && form.isPrivate && !accessValidated) {
    return (
      <Layout hideNav>
        <FormAccess 
          onAccessGranted={handleAccessGranted} 
          isUserAllowed={isUserAllowed}
        />
      </Layout>
    );
  }

  if (!form) {
    return (
      <Layout hideNav>
        <FormNotFound onBackClick={handleBackNavigation} />
      </Layout>
    );
  }

  // If submit success, show success page with the score if enabled
  if (isSubmitSuccess) {
    console.log("Showing success page with score:", form.showTotalScore);
    console.log("Form scoring enabled:", form.enableScoring);
    return (
      <Layout hideNav>
        <FormSuccess 
          formValues={formResponses} 
          fields={form.fields}
          showTotalScore={form.showTotalScore || form.enableScoring}
        />
      </Layout>
    );
  }

  // If we have a form, show the current question in a card
  const currentField = form.fields[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === form.fields.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  
  // Check if user is an admin in preview mode
  const isAdminPreview = currentUser?.role === "admin";

  return (
    <Layout hideNav>
      <div className="max-w-3xl mx-auto">
        <FormHeader 
          currentQuestion={currentQuestionIndex}
          totalQuestions={form.fields.length}
          onBackClick={handleBackNavigation}
        />

        <FormQuestion
          field={currentField}
          value={formResponses[currentField.id]}
          onChange={(value) => handleFieldChange(currentField.id, value)}
          isFirstQuestion={isFirstQuestion}
          isLastQuestion={isLastQuestion}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isAdminPreview={isAdminPreview}
          isEditMode={isEditMode}
          formColor={form.formColor}
          title={form.title}
          description={form.description}
        />
        
        <FormProgressBar 
          currentIndex={currentQuestionIndex}
          totalFields={form.fields.length}
          formColor={form.formColor}
        />
      </div>
    </Layout>
  );
};

export default FormView;
