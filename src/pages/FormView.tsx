import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useForm } from "@/contexts/form";
import { useAuth } from "@/contexts/AuthContext";
import { FormField as FormFieldType, Form as FormType } from "@/types/form";
import FormField from "@/components/form-view/FormField";
import { ArrowLeft, ArrowRight, Send, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import FormAccess from "@/components/form-view/FormAccess";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FormSuccess from "@/components/form-view/FormSuccess";

const FormView = () => {
  const { id, token } = useParams();
  const { forms, submitFormResponse, validateAccessToken, isUserAllowed, getForm } = useForm();
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();
  const formFromLocation = location.state?.formData;
  const isEditMode = location.state?.editMode || new URLSearchParams(location.search).get('edit') === 'true';
  const [form, setForm] = useState<FormType | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessValidated, setAccessValidated] = useState(false);
  const [validationLoading, setValidationLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const navigate = useNavigate();

  // Validate access token if provided
  useEffect(() => {
    const validateAccess = async () => {
      if (id) {
        // First check if we have the form from the location state
        if (formFromLocation) {
          console.log("Using form data from location state:", formFromLocation);
          setForm(formFromLocation);
          setAccessValidated(true);
          setValidationLoading(false);
          return;
        }
        
        // Otherwise, try to get the form from the context
        const foundForm = forms.find(form => form.id === id);
        
        // If form doesn't exist, end validation
        if (!foundForm) {
          console.log("Form not found with ID:", id);
          setValidationLoading(false);
          return;
        }
        
        // If form is not private, allow access
        if (!foundForm.isPrivate) {
          setForm(foundForm);
          setAccessValidated(true);
          setValidationLoading(false);
          return;
        }
        
        // If form is private, check authentication or token
        if (foundForm.isPrivate) {
          // If user is authenticated and has access to the form
          if (isAuthenticated && currentUser) {
            // Admin has access to all forms
            if (currentUser.role === "admin") {
              setForm(foundForm);
              setAccessValidated(true);
              setValidationLoading(false);
              return;
            }
            
            // Check if user is in allowed users
            if (isUserAllowed(foundForm.id, currentUser.email)) {
              setForm(foundForm);
              setAccessValidated(true);
              setValidationLoading(false);
              return;
            }
          }
          
          // If token is provided, validate it
          if (token) {
            try {
              const valid = await validateAccessToken(foundForm.id, token);
              if (valid) {
                setForm(foundForm);
                setAccessValidated(true);
                setValidationLoading(false);
                return;
              }
            } catch (error) {
              console.error("Error validating token:", error);
            }
          }
          
          // If we get here, set the form but don't validate access yet
          // This will show the FormAccess component to validate email
          setForm(foundForm);
        }
        
        setValidationLoading(false);
      }
    };
    
    validateAccess();
  }, [id, token, isAuthenticated, currentUser, forms, validateAccessToken, isUserAllowed, formFromLocation]);

  // New effect to load existing responses when in edit mode
  useEffect(() => {
    if (isEditMode && form && currentUser) {
      const userEmail = currentUser?.email || localStorage.getItem('userEmail');
      
      // Fetch the user's previous response for this form
      const fetchExistingResponse = async () => {
        try {
          const { data, error } = await supabase
            .from('formulario')
            .select('respuestas')
            .eq('nombre_formulario', form.title)
            .eq('nombre_invitado', userEmail)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (error) throw error;
          
          if (data && data.length > 0 && data[0].respuestas) {
            // Convert the responses back to the format our form expects
            const storedResponses = data[0].respuestas;
            const fieldResponses: Record<string, any> = {};
            
            // Map the labeled responses back to field IDs
            form.fields.forEach(field => {
              const fieldLabel = field.label || `Pregunta ${field.id.substring(0, 5)}`;
              if (storedResponses[fieldLabel] !== undefined) {
                fieldResponses[field.id] = storedResponses[fieldLabel];
              }
            });
            
            setFormResponses(fieldResponses);
            toast({
              title: "Respuestas cargadas",
              description: "Puede editar sus respuestas anteriores",
            });
          }
        } catch (error) {
          console.error("Error loading previous responses:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las respuestas anteriores",
            variant: "destructive",
          });
        }
      };
      
      if (form.allowEditOwnResponses) {
        fetchExistingResponse();
      }
    }
  }, [form, isEditMode, currentUser]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form || !id) return;
    
    // Check if the current user is an admin in preview mode
    // Admins cannot submit responses in preview mode, show a toast instead
    if (isAuthenticated && currentUser?.role === "admin") {
      toast({
        title: "Vista previa",
        description: "Esto es solo una vista previa, no se puede responder formulario desde esta vista",
        variant: "default",
      });
      return;
    }
    
    // Check if all required fields are filled
    const missingFields = form.fields
      .filter(field => field.required && !formResponses[field.id])
      .map(field => field.label || `Campo #${field.id}`);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos requeridos faltantes",
        description: `Por favor completa los siguientes campos: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Pass the form from location to the submit function to ensure we have the form data
      await submitFormResponse(id, formResponses, formFromLocation || form);
      toast({
        title: isEditMode ? "Respuesta actualizada correctamente" : "Respuesta enviada correctamente",
        description: isEditMode ? "Gracias por actualizar tus respuestas" : "Gracias por completar este formulario",
      });
      
      setIsSubmitSuccess(true);

      // Redirigir después de 2 segundos para mostrar el mensaje de éxito
      setTimeout(() => {
        // Always redirect to assigned forms page
        navigate("/assigned-forms", { replace: true });
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Error al enviar respuesta",
        description: "Por favor intenta nuevamente más tarde",
        variant: "destructive",
      });
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccessGranted = () => {
    setAccessValidated(true);
  };

  const handleNext = () => {
    if (form && currentQuestionIndex < form.fields.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleBackNavigation = () => {
    // If user is admin, navigate to dashboard-admin
    if (isAuthenticated && currentUser?.role === "admin") {
      navigate("/dashboard-admin");
    } else {
      // For regular users or unauthenticated users, navigate to assigned forms
      navigate("/assigned-forms");
    }
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
          isUserAllowed={(email) => isUserAllowed(form.id, email)}
        />
      </Layout>
    );
  }

  if (!form) {
    return (
      <Layout hideNav>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Formulario no encontrado</h1>
            <p className="text-gray-600 mb-6">
              El formulario que estás buscando no existe o ha sido eliminado.
            </p>
            <Button variant="outline" onClick={handleBackNavigation}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
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
  
  const cardStyle = form.formColor ? { 
    borderTop: `4px solid ${form.formColor}`,
    boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
  } : {};

  const buttonStyle = form.formColor ? {
    backgroundColor: form.formColor,
    borderColor: form.formColor
  } : {};
  
  // Check if user is an admin in preview mode
  const isAdminPreview = isAuthenticated && currentUser?.role === "admin";

  return (
    <Layout hideNav>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="outline" onClick={handleBackNavigation}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="text-sm text-gray-500">
            Pregunta {currentQuestionIndex + 1} de {form.fields.length}
          </div>
        </div>

        <Card style={cardStyle} className="mb-6">
          <CardHeader>
            <CardTitle 
              style={form.formColor ? { color: form.formColor } : {}}
              className="text-2xl font-bold"
            >
              {form.title}
              {isAdminPreview && (
                <span className="ml-2 text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Vista previa
                </span>
              )}
              {isEditMode && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Modo edición
                </span>
              )}
            </CardTitle>
            {form.description && (
              <CardDescription className="text-gray-600">
                {form.description}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="form-field border-0 shadow-none p-0">
              <FormField
                field={currentField}
                value={formResponses[currentField.id] || ""}
                onChange={(value) => handleFieldChange(currentField.id, value)}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstQuestion}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            
            <div>
              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={buttonStyle}
                >
                  {isEditMode ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Guardando..." : "Guardar cambios"}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Enviando..." : isAdminPreview ? "Vista previa" : "Enviar respuesta"}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  style={buttonStyle}
                >
                  Siguiente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
        
        {/* Progress indicator */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="h-2.5 rounded-full" 
            style={{ 
              width: `${((currentQuestionIndex + 1) / form.fields.length) * 100}%`,
              backgroundColor: form.formColor || '#686df3'
            }}
          ></div>
        </div>
      </div>
    </Layout>
  );
};

export default FormView;
