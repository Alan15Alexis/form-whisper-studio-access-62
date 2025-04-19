
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/types/form";
import { useFormScoring } from "@/hooks/form-builder/useFormScoring";
import { useNavigate } from "react-router-dom";

interface FormSuccessProps {
  formValues: Record<string, any>;
  fields: FormField[];
  showTotalScore?: boolean;
}

const FormSuccess = ({ formValues, fields, showTotalScore }: FormSuccessProps) => {
  const navigate = useNavigate();
  const { calculateTotalScore, getScoreFeedback, shouldShowScoreCard } = useFormScoring();
  
  const currentScore = showTotalScore ? calculateTotalScore(formValues, fields || []) : 0;
  const scoreFeedback = showTotalScore ? getScoreFeedback(currentScore, fields || []) : null;
  const showScore = shouldShowScoreCard(fields || [], showTotalScore);

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Card className="shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">¡Gracias por responder!</CardTitle>
          <CardDescription className="text-base mt-2">
            Tu respuesta ha sido registrada con éxito
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 py-6">
          {showScore && (
            <div className="p-6 bg-primary/5 rounded-lg space-y-3 border">
              <h3 className="text-xl font-medium text-center mb-4">Resultado</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-lg">Puntuación Total:</span>
                <span className="text-3xl font-bold text-primary">{currentScore}</span>
              </div>
              
              {scoreFeedback && (
                <div className="mt-4 p-4 bg-background rounded border text-center">
                  <p className="text-lg">{scoreFeedback}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={() => navigate("/")}>
            Volver al inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormSuccess;
