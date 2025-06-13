
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/types/form";
import { useFormScoring } from "@/hooks/form-builder/useFormScoring";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface FormScoreCardProps {
  formValues: Record<string, any>;
  fields: FormField[];
  formTitle?: string;
  onNext: () => void;
  scoreData?: {
    totalScore: number;
    feedback: string | null;
    timestamp: string;
  } | null;
  scoreRanges?: Array<{
    min: number;
    max: number;
    message: string;
  }>;
}

const FormScoreCard = ({ 
  formValues, 
  fields, 
  formTitle, 
  onNext, 
  scoreData, 
  scoreRanges 
}: FormScoreCardProps) => {
  const { id: formId } = useParams();
  const { calculateTotalScore, getScoreFeedback, validateScoreRanges } = useFormScoring();
  const [scoreFeedback, setScoreFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Calculando puntuación...");
  const [feedbackSource, setFeedbackSource] = useState<string>("");
  const [hasValidRanges, setHasValidRanges] = useState(true);
  
  // Use score data if provided, otherwise calculate
  const currentScore = scoreData?.totalScore ?? calculateTotalScore(formValues, fields || []);
  const providedFeedback = scoreData?.feedback;

  console.log("FormScoreCard render:", { 
    currentScore, 
    formId, 
    fields: fields?.length, 
    scoreData,
    providedFeedback,
    scoreRanges: scoreRanges?.length,
    hasValidRanges: validateScoreRanges(scoreRanges || [])
  });

  // Validate score ranges on mount
  useEffect(() => {
    if (scoreRanges && scoreRanges.length > 0) {
      const isValid = validateScoreRanges(scoreRanges);
      setHasValidRanges(isValid);
      if (!isValid) {
        console.warn("Invalid score ranges detected:", scoreRanges);
      }
    }
  }, [scoreRanges, validateScoreRanges]);

  // Get score feedback with improved handling and validation
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        
        // If we already have feedback from scoreData, use it
        if (providedFeedback) {
          console.log("FormScoreCard - Using provided feedback:", providedFeedback);
          setScoreFeedback(providedFeedback);
          setLoadingMessage("¡Mensaje personalizado encontrado!");
          setFeedbackSource("datos guardados del formulario");
          setIsLoading(false);
          return;
        }
        
        setLoadingMessage("Buscando mensaje personalizado...");
        
        // Validate score ranges before using them
        if (scoreRanges && scoreRanges.length > 0 && !hasValidRanges) {
          console.warn("Skipping feedback lookup due to invalid score ranges");
          setScoreFeedback(null);
          setLoadingMessage("Configuración de rangos inválida");
          setFeedbackSource("");
          setIsLoading(false);
          return;
        }
        
        console.log("FormScoreCard - Getting feedback for score:", currentScore, "with ranges:", scoreRanges);
        
        // Add a small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Use the score ranges passed as prop or from the form
        const feedback = await getScoreFeedback(currentScore, scoreRanges);
        setScoreFeedback(feedback);
        
        console.log("FormScoreCard - Score feedback received:", feedback);
        
        if (feedback) {
          setLoadingMessage("¡Mensaje personalizado encontrado!");
          setFeedbackSource("configuración del formulario");
        } else {
          setLoadingMessage("Sin mensaje personalizado para esta puntuación");
          setFeedbackSource("");
        }
        
      } catch (error) {
        console.error("FormScoreCard - Error getting score feedback:", error);
        setScoreFeedback(null);
        setLoadingMessage("Error al obtener mensaje personalizado");
        setFeedbackSource("");
      } finally {
        // Keep loading state for a moment to show the message
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };
    
    fetchFeedback();
  }, [currentScore, formId, getScoreFeedback, providedFeedback, scoreRanges, hasValidRanges]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="container max-w-2xl mx-auto py-8"
    >
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">¡Formulario Completado!</CardTitle>
          {formTitle && (
            <CardDescription className="text-base">
              {formTitle}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6 py-6">
          <div className="p-6 bg-primary/5 rounded-lg space-y-4 border border-primary/20">
            <h3 className="text-xl font-medium text-center mb-4">Tu Puntuación Total</h3>
            
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-3xl font-bold px-6 py-3 bg-primary/10">
                {currentScore} puntos
              </Badge>
            </div>
            
            {/* Validation warning for invalid ranges */}
            {scoreRanges && scoreRanges.length > 0 && !hasValidRanges && (
              <Alert className="mt-4 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-amber-800">
                  La configuración de rangos de puntuación contiene errores. Los mensajes personalizados pueden no mostrarse correctamente.
                </AlertDescription>
              </Alert>
            )}
            
            {isLoading ? (
              <div className="mt-6 p-4 bg-background rounded border text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">{loadingMessage}</p>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Evaluando puntuación de {currentScore} puntos para formulario {formId}...
                </div>
              </div>
            ) : scoreFeedback ? (
              <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200 text-center">
                <div className="flex items-center justify-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="text-lg font-semibold text-green-800">Tu Resultado Personalizado</h4>
                </div>
                <p className="text-lg font-medium text-gray-800 leading-relaxed mb-3">{scoreFeedback}</p>
                <div className="flex items-center justify-center space-x-2 mt-3">
                  <div className="text-sm text-green-600 bg-green-100 rounded-full px-3 py-1">
                    Puntuación: {currentScore} puntos
                  </div>
                  {feedbackSource && (
                    <div className="text-xs text-blue-600 bg-blue-100 rounded-full px-2 py-1">
                      ✅ Desde {feedbackSource}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-gray-50 rounded border text-center">
                <div className="text-gray-600">
                  <p className="font-medium">Puntuación registrada: {currentScore} puntos</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {scoreRanges && scoreRanges.length > 0 
                      ? "No hay mensaje configurado para esta puntuación específica"
                      : "No hay mensajes personalizados configurados para este formulario"
                    }
                  </p>
                  <div className="mt-3 text-xs text-amber-600 bg-amber-50 rounded px-3 py-2 inline-block">
                    💡 Tip: Los administradores pueden configurar mensajes personalizados para diferentes rangos de puntuación
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center text-muted-foreground">
            <p>Gracias por completar el formulario</p>
            {formId && (
              <p className="text-xs mt-1">ID del formulario: {formId}</p>
            )}
            {scoreRanges && scoreRanges.length > 0 && (
              <p className="text-xs mt-1">Rangos configurados: {scoreRanges.length}</p>
            )}
          </div>
          
          {/* Next button in bottom right */}
          <div className="flex justify-end mt-8">
            <Button 
              onClick={onNext} 
              className="px-8"
              disabled={isLoading}
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FormScoreCard;
