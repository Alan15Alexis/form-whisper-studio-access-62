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

const FormView = () => {
  const { id } = useParams<{ id: string }>();
  const { getForm, validateAccessToken } = useForm();
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(getForm(id || ''));
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
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
        setLoading(false);
        return;
      }

      // First try to get from context
      let foundForm = getForm(id);
      
      if (!foundForm) {
        try {
          // Try to fetch from Supabase by ID
          const numericId = parseInt(id);
          if (!isNaN(numericId)) {
            const { data: formData, error } = await supabase
              .from('formulario_construccion')
              .select('*')
              .eq('id', numericId)
              .single();
            
            if (!error && formData) {
              // Convert Supabase data to our form format
              foundForm = {
                id: formData.id.toString(),
                title: formData.titulo || 'Untitled Form',
                description: formData.descripcion || '',
                fields: formData.preguntas || [],
                isPrivate: formData.configuracion?.isPrivate || false,
                allowedUsers: formData.acceso || [],
                createdAt: formData.created_at,
                updatedAt: formData.created_at,
                accessLink: '',
                ownerId: formData.administrador || 'unknown',
                enableScoring: formData.configuracion?.enableScoring || false,
                showTotalScore: formData.configuracion?.showTotalScore || false,
                formColor: formData.configuracion?.formColor,
                allowViewOwnResponses: formData.configuracion?.allowViewOwnResponses || false,
                allowEditOwnResponses: formData.configuracion?.allowEditOwnResponses || false,
                httpConfig: formData.configuracion?.httpConfig,
                scoreRanges: formData.rangos_mensajes || []
              };
            }
          }
        } catch (error) {
          console.error("Error loading form from Supabase:", error);
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
      }
      
      setLoading(false);
    };

    loadFormFromSupabase();
  }, [id, getForm, validateAccessToken, currentUser, isAuthenticated, location.search]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!form) {
    return <FormNotFound onBackClick={() => navigate('/')} />;
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
    return (
      <FormScoreCard 
        formValues={formResponses}
        fields={form.fields}
        formTitle={form.title}
        onNext={handleScoreCardNext}
        scoreData={calculatedScoreData}
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
