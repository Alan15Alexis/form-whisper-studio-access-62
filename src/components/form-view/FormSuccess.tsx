
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/types/form";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface FormSuccessProps {
  formValues: Record<string, any>;
  fields: FormField[];
  showTotalScore?: boolean;
  scoreRanges?: any[];
}

const FormSuccess = ({ formValues, fields, showTotalScore, scoreRanges = [] }: FormSuccessProps) => {
  const navigate = useNavigate();

  // Check if scoring is enabled but no ranges are configured
  const hasFieldsWithNumericValues = fields.some(field => field.hasNumericValues);
  const scoringEnabledButNoRanges = showTotalScore && hasFieldsWithNumericValues && scoreRanges.length === 0;

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">¡Respuesta Enviada!</CardTitle>
          <CardDescription>
            Tu respuesta ha sido registrada exitosamente
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {scoringEnabledButNoRanges && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Información sobre puntuación:</strong> Este formulario tiene campos con valores numéricos, 
                pero aún no se han configurado rangos y mensajes de retroalimentación específicos para este formulario. 
                Los rangos de puntuación dependen de cada formulario y deben ser configurados por el administrador.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-center text-muted-foreground">
            <p>Gracias por tu tiempo y participación</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate("/assigned-forms")} className="px-8">
            Volver a formularios
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormSuccess;
