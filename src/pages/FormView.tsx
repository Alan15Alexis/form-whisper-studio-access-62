
import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "@/contexts/form";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import FormHeader from "@/components/form-view/FormHeader";
import FormQuestion from "@/components/form-view/FormQuestion";
import FormProgressBar from "@/components/form-view/FormProgressBar";
import FormSuccess from "@/components/form-view/FormSuccess";
import FormScoreCard from "@/components/form-view/FormScoreCard";
import FormAccess from "@/components/form-view/FormAccess";
import FormNotFound from "@/components/form-view/FormNotFound";
import { useFormResponses } from "@/hooks/useFormResponses";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Form } from "@/types/form";

const FormView = () => {
  const { id } = useParams<{ id: string }>();
  const { getForm, validateAccessToken } = useForm();
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [form, setForm] = useState<Form | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  const {
    formResponses,
    isSubmitting,
    isSubmitSuccess,
    showScoreCard,
    currentQuestionIndex,
    isEditMode,
    calculatedScoreData,
    handleFieldChange,
    handleSubmit,
    handleNext,
    handlePrevious,
    handleScoreCardNext,
  } = useFormResponses(form);

  useEffect(() => {
    const loadFormFromSupabase = async () => {
      if (!id) {
        setLoadingError("No form ID provided");
        setLoading(false);
        return;
      }

      console.log("FormView - Loading form with ID:", id);

      try {
        // First try to get from context (local storage)
        let foundForm = getForm(id);
        
        if (foundForm) {
          console.log("FormView - Found form in local storage:", {
            title: foundForm.title,
            showTotalScore: foundForm.showTotalScore,
            scoreRanges: foundForm.scoreRanges?.length || 0
          });
        } else {
          console.log("FormView - Form not found in local storage, checking Supabase...");
          
          // Try to fetch from Supabase by ID
          const numericId = parseInt(id);
          if (!isNaN(numericId)) {
            const { data: formData, error } = await supabase
              .from('formulario_construccion')
              .select('*')
              .eq('id', numericId)
              .single();
            
            if (!error && formData) {
              console.log("FormView - Found form in Supabase:", {
                id: formData.id,
                title: formData.titulo,
                configuration: formData.configuracion,
                scoreRanges: formData.rangos_mensajes
              });
              
              // Convert Supabase data to our form format with proper score ranges handling
              const config = formData.configuracion || {};
              const showTotalScore = Boolean(config.showTotalScore);
              
              // Get score ranges with proper priority
              let scoreRanges = [];
              if (formData.rangos_mensajes && Array.isArray(formData.rangos_mensajes)) {
                scoreRanges = [...formData.rangos_mensajes];
                console.log("FormView - Using score ranges from rangos_mensajes:", scoreRanges);
              } else if (config.scoreRanges && Array.isArray(config.scoreRanges)) {
                scoreRanges = [...config.scoreRanges];
                console.log("FormView - Using score ranges from configuracion:", scoreRanges);
              }
              
              foundForm = {
                id: formData.id.toString(),
                title: formData.titulo || 'Untitled Form',
                description: formData.descripcion || '',
                fields: formData.preguntas || [],
                isPrivate: Boolean(config.isPrivate),
                allowedUsers: formData.acceso || [],
                createdAt: formData.created_at,
                updatedAt: formData.created_at,
                accessLink: '',
                ownerId: formData.administrador || 'unknown',
                enableScoring: showTotalScore,
                showTotalScore: showTotalScore,
                formColor: config.formColor,
                allowViewOwnResponses: Boolean(config.allowViewOwnResponses),
                allowEditOwnResponses: Boolean(config.allowEditOwnResponses),
                httpConfig: config.httpConfig,
                scoreRanges: scoreRanges,
                scoreConfig: {
                  enabled: showTotalScore,
                  ranges: scoreRanges
                }
              };
              
              console.log("FormView - Converted form:", {
                showTotalScore: foundForm.showTotalScore,
                scoreRanges: foundForm.scoreRanges?.length || 0
              });
            } else {
              console.error("FormView - Form not found in Supabase:", error);
              setLoadingError("Form not found in database");
            }
          } else {
            console.error("FormView - Invalid form ID format:", id);
            setLoadingError("Invalid form ID format");
          }
        }

        if (foundForm) {
          setForm(foundForm);
          
          // Check access
          const searchParams = new URLSearchParams(location.search);
          const token = searchParams.get('token');
          
          if (!foundForm.isPrivate) {
            setHasAccess(true);
          } else if (token && validateAccessToken(foundForm.id, token)) {
            setHasAccess(true);
          } else if (currentUser && foundForm.allowedUsers?.includes(currentUser.email)) {
            setHasAccess(true);
          } else if (isAuthenticated && currentUser?.role === "admin") {
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
        } else {
          setLoadingError("Form not found");
        }
      } catch (error) {
        console.error("FormView - Error loading form:", error);
        setLoadingError("Error loading form data");
      }
      
      setLoading(false);
    };

    loadFormFromSupabase();
  }, [id, getForm, validateAccessToken, currentUser, isAuthenticated, location.search]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando formulario...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loadingError || !form) {
    return (
      <FormNotFound 
        onBackClick={() => navigate('/')} 
        errorMessage={loadingError || "Form not found"}
      />
    );
  }

  if (form.isPrivate && !hasAccess) {
    return (
      <FormAccess 
        onAccessGranted={() => setHasAccess(true)}
        isUserAllowed={(email: string) => form.allowedUsers?.includes(email) || false}
      />
    );
  }

  if (isSubmitSuccess) {
    return (
      <FormSuccess 
        formValues={formResponses}
        fields={form.fields}
        showTotalScore={form.showTotalScore}
      />
    );
  }

  if (showScoreCard) {
    console.log("FormView - Rendering score card with:", {
      scoreRanges: form.scoreRanges?.length || 0,
      calculatedScoreData,
      showTotalScore: form.showTotalScore
    });
    
    return (
      <FormScoreCard 
        formValues={formResponses}
        fields={form.fields}
        formTitle={form.title}
        onNext={handleScoreCardNext}
        scoreData={calculatedScoreData}
        scoreRanges={form.scoreRanges || []}
      />
    );
  }

  const totalQuestions = form.fields.length;
  const currentField = form.fields[currentQuestionIndex];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <FormHeader 
            currentQuestion={currentQuestionIndex}
            totalQuestions={totalQuestions}
            onBackClick={() => navigate('/')}
          />
          
          <div className="mb-8">
            <FormProgressBar 
              currentIndex={currentQuestionIndex}
              totalFields={totalQuestions}
              formColor={form.formColor}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-lg border-0">
                  <CardContent className="p-8">
                    <FormQuestion
                      field={currentField}
                      value={formResponses[currentField.id]}
                      onChange={(value) => handleFieldChange(currentField.id, value)}
                      isFirstQuestion={currentQuestionIndex === 0}
                      isLastQuestion={currentQuestionIndex === totalQuestions - 1}
                      handlePrevious={handlePrevious}
                      handleNext={handleNext}
                      handleSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                      isAdminPreview={false}
                      isEditMode={isEditMode}
                      formColor={form.formColor}
                      title={form.title}
                      description={form.description}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default FormView;
