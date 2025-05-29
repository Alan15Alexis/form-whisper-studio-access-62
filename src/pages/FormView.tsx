
import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import FormField from "@/components/form-view/FormField";
import FormAccess from "@/components/form-view/FormAccess";
import FormSuccess from "@/components/form-view/FormSuccess";
import FormScoreCard from "@/components/form-view/FormScoreCard";
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
    showScoreCard,
    currentQuestionIndex, 
    isEditMode,
    handleFieldChange, 
    handleSubmit, 
    handleNext, 
    handlePrevious,
    handleScoreCardNext
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

  // Create an adapter function that only takes email parameter
  // but internally calls isUserAllowed with the current form's ID
  const checkUserAllowed = (email: string) => {
    if (!form || !form.id) return false;
    return isUserAllowed(form.id, email);
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
          isUserAllowed={checkUserAllowed}
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

  // Show score card if enabled and form was just submitted
  if (showScoreCard) {
    console.log("Showing score card with form data:", {
      showTotalScore: form.showTotalScore,
      enableScoring: form.enableScoring,
      hasNumericFields: form.fields.some(f => f.hasNumericValues)
    });
    
    return (
      <Layout hideNav>
        <FormScoreCard 
          formValues={formResponses} 
          fields={form.fields}
          formTitle={form.title}
          onNext={handleScoreCardNext}
        />
      </Layout>
    );
  }

  // If submit success, show success page (now without score since score card was shown first)
  if (isSubmitSuccess) {
    console.log("Showing success page");
    
    return (
      <Layout hideNav>
        <FormSuccess 
          formValues={formResponses} 
          fields={form.fields}
          showTotalScore={false} // Never show score here since it was shown in score card
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
