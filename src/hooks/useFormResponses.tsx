
import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "@/contexts/form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Form as FormType } from "@/types/form";

/**
 * Custom hook to handle form responses and submission
 */
export function useFormResponses(form: FormType | null) {
  const { id } = useParams();
  const { submitFormResponse } = useForm();
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const isEditMode = location.state?.editMode || new URLSearchParams(location.search).get('edit') === 'true';
  const navigate = useNavigate();
  
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Load existing responses when in edit mode
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
    console.log(`Field changed: ${fieldId} with value:`, value);
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form:', form?.title);
    console.log('Current User:', currentUser);
    console.log('Is Authenticated:', isAuthenticated);
    console.log('Form Responses:', formResponses);
    
    if (!form || !id) {
      console.error('Missing form or ID');
      return;
    }
    
    // Check if the current user is an admin in preview mode
    // Admins cannot submit responses in preview mode, show a toast instead
    if (isAuthenticated && currentUser?.role === "admin") {
      console.log('Admin in preview mode, blocking submission');
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
      console.log('Missing required fields:', missingFields);
      toast({
        title: "Campos requeridos faltantes",
        description: `Por favor completa los siguientes campos: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Submitting form responses with submitFormResponse function...");
      
      // Pass the form from location to the submit function to ensure we have the form data
      const result = await submitFormResponse(id, formResponses, form);
      console.log("Form submission result:", result);
      
      toast({
        title: isEditMode ? "Respuesta actualizada correctamente" : "Respuesta enviada correctamente",
        description: isEditMode ? "Gracias por actualizar tus respuestas" : "Gracias por completar este formulario",
      });
      
      setIsSubmitSuccess(true);

      // Redirigir después de 2 segundos para mostrar el mensaje de éxito
      setTimeout(() => {
        // Always redirect to assigned forms page
        navigate("/assigned-forms", { replace: true });
      }, 5000); // Extended to 5 seconds to give more time to see file uploads in the success screen
      
    } catch (error) {
      console.error("=== FORM SUBMISSION ERROR ===", error);
      toast({
        title: "Error al enviar respuesta",
        description: error instanceof Error ? error.message : "Por favor intenta nuevamente más tarde",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
  
  return {
    formResponses,
    isSubmitting,
    isSubmitSuccess,
    currentQuestionIndex,
    uploadProgress,
    isEditMode,
    handleFieldChange,
    handleSubmit,
    handleNext,
    handlePrevious,
    setIsSubmitSuccess
  };
}
