
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/types/form";
import { useFormScoring } from "@/hooks/form-builder/useFormScoring";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useEffect } from "react";

interface FormSuccessProps {
  formValues: Record<string, any>;
  fields: FormField[];
  showTotalScore?: boolean;
}

const FormSuccess = ({ formValues, fields, showTotalScore }: FormSuccessProps) => {
  const navigate = useNavigate();
  const { calculateTotalScore, getScoreFeedback, shouldShowScoreCard } = useFormScoring();
  
  const currentScore = calculateTotalScore(formValues, fields || []);
  const scoreFeedback = getScoreFeedback(currentScore, fields || []);
  const showScore = shouldShowScoreCard(fields || [], showTotalScore);

  console.log("FormSuccess render:", { showTotalScore, currentScore, scoreFeedback, showScore });
  
  // Debug scores and feedback in more detail
  useEffect(() => {
    console.log("Form values:", formValues);
    console.log("Form fields:", fields);
    console.log("Score feedback:", scoreFeedback);
    console.log("Show total score flag:", showTotalScore);
    console.log("Fields with numeric values:", fields?.filter(f => f.hasNumericValues));
  }, [formValues, fields, scoreFeedback, showTotalScore]);
  
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
                <Badge variant="outline" className="text-2xl font-bold px-4 py-2 bg-primary/10">
                  {currentScore}
                </Badge>
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
          <Button onClick={() => navigate("/assigned-forms")}>
            Volver a mis formularios
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormSuccess;
