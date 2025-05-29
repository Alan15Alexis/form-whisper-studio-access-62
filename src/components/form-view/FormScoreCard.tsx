
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/types/form";
import { useFormScoring } from "@/hooks/form-builder/useFormScoring";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

interface FormScoreCardProps {
  formValues: Record<string, any>;
  fields: FormField[];
  formTitle?: string;
}

const FormScoreCard = ({ formValues, fields, formTitle }: FormScoreCardProps) => {
  const { id: formId } = useParams();
  const { calculateTotalScore, getScoreFeedback } = useFormScoring();
  const [scoreFeedback, setScoreFeedback] = useState<string | null>(null);
  
  const currentScore = calculateTotalScore(formValues, fields || []);

  console.log("FormScoreCard render:", { currentScore, formId, fields: fields?.length });

  // Fetch score feedback from database
  useEffect(() => {
    const fetchFeedback = async () => {
      if (formId) {
        const feedback = await getScoreFeedback(currentScore, formId, fields);
        setScoreFeedback(feedback);
        console.log("Score feedback from DB:", feedback);
      }
    };
    
    fetchFeedback();
  }, [currentScore, formId, fields, getScoreFeedback]);

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
            
            {scoreFeedback && (
              <div className="mt-6 p-4 bg-background rounded border text-center">
                <h4 className="text-lg font-semibold mb-2 text-primary">Resultado:</h4>
                <p className="text-lg font-medium">{scoreFeedback}</p>
              </div>
            )}
          </div>
          
          <div className="text-center text-muted-foreground">
            <p>Gracias por completar el formulario</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FormScoreCard;
