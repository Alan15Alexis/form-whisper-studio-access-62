
import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "@/contexts/form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Form as FormType } from "@/types/form";
import { useFormScoring } from "@/hooks/form-builder/useFormScoring";

/**
 * Custom hook to handle form responses and submission
 */
export function useFormResponses(form: FormType | null) {
  const { id } = useParams();
  const { submitFormResponse } = useForm();
  const { currentUser } = useAuth();
  const location = useLocation();
  const isEditMode = location.state?.editMode || new URLSearchParams(location.search).get('edit') === 'true';
  const navigate = useNavigate();
  const { fetchScoreRangesFromDB } = useFormScoring();
  
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);
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
    
    if (!form || !id) return;
    
    // Check if the current user is an admin in preview mode
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
      console.log("Submitting form responses:", formResponses);
      console.log("Form fields:", form.fields);
      
      // Check if we have any file fields and log them
      const fileFields = form.fields.filter(field => 
        field.type === 'image-upload' || 
        field.type === 'file-upload' || 
        field.type === 'drawing' || 
        field.type === 'signature'
      );
      
      if (fileFields.length > 0) {
        console.log(`Form has ${fileFields.length} file fields:`, fileFields.map(f => f.id));
        
        // Log if any of these fields have values in the responses
        fileFields.forEach(field => {
          const value = formResponses[field.id];
          if (value) {
            if (typeof value === 'string' && value.startsWith('data:')) {
              console.log(`Field ${field.id} has base64 data`);
            } else if (value instanceof File) {
              console.log(`Field ${field.id} has File: ${value.name}, ${value.type}, ${value.size}`);
            } else if (typeof value === 'string') {
              console.log(`Field ${field.id} has string value:`, value.substring(0, 100) + '...');
            } else {
              console.log(`Field ${field.id} has value of type:`, typeof value);
            }
          } else {
            console.log(`Field ${field.id} has no value`);
          }
        });
      }
      
      // Pass the form from location to the submit function to ensure we have the form data
      const result = await submitFormResponse(id, formResponses, form);
      console.log("Form submission result:", result);
      
      // Check both local form configuration AND database ranges
      const hasNumericFields = form.fields.some(f => f.hasNumericValues);
      const localScoringEnabled = (form.showTotalScore || form.enableScoring) && hasNumericFields;
      
      // Also check if there are score ranges in the database
      let dbRangesExist = false;
      if (id && hasNumericFields) {
        try {
          const dbRanges = await fetchScoreRangesFromDB(id);
          dbRangesExist = dbRanges.length > 0;
          console.log("Database ranges check:", { dbRangesExist, rangesCount: dbRanges.length });
        } catch (error) {
          console.error("Error checking database ranges:", error);
        }
      }
      
      const shouldShowScore = localScoringEnabled || dbRangesExist;
      
      console.log("Score check:", { 
        showTotalScore: form.showTotalScore, 
        enableScoring: form.enableScoring,
        hasNumericFields,
        localScoringEnabled,
        dbRangesExist,
        shouldShowScore
      });
      
      if (shouldShowScore) {
        // Show score card first - NO TOAST HERE to avoid interference
        console.log("Setting showScoreCard to true (local or DB ranges found)");
        setShowScoreCard(true);
      } else {
        // Show toast and go directly to thank you card if no score to show
        toast({
          title: isEditMode ? "Respuesta actualizada correctamente" : "Respuesta enviada correctamente",
          description: isEditMode ? "Gracias por actualizar tus respuestas" : "Gracias por completar este formulario",
        });
        
        setIsSubmitSuccess(true);
        // Redirect after showing success
        setTimeout(() => {
          navigate("/assigned-forms", { replace: true });
        }, 5000);
      }
      
    } catch (error) {
      console.error("Error submitting form:", error);
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

  // Function to handle navigation from score card to thank you card
  const handleScoreCardNext = () => {
    console.log("Score card next clicked - moving to thank you card");
    
    // Hide score card
    setShowScoreCard(false);
    
    // Show success toast now (after score card)
    toast({
      title: isEditMode ? "Respuesta actualizada correctamente" : "Respuesta enviada correctamente",
      description: isEditMode ? "Gracias por actualizar tus respuestas" : "Gracias por completar este formulario",
    });
    
    // Show thank you card
    setIsSubmitSuccess(true);
    
    // Redirect after showing the thank you card
    setTimeout(() => {
      navigate("/assigned-forms", { replace: true });
    }, 5000);
  };

  const { isAuthenticated } = useAuth();
  
  return {
    formResponses,
    isSubmitting,
    isSubmitSuccess,
    showScoreCard,
    currentQuestionIndex,
    uploadProgress,
    isEditMode,
    handleFieldChange,
    handleSubmit,
    handleNext,
    handlePrevious,
    handleScoreCardNext,
    setIsSubmitSuccess,
    setShowScoreCard
  };
}
