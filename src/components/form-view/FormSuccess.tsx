
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/types/form";
import { useNavigate } from "react-router-dom";

interface FormSuccessProps {
  formValues: Record<string, any>;
  fields: FormField[];
  showTotalScore?: boolean;
}

const FormSuccess = ({ formValues, fields, showTotalScore }: FormSuccessProps) => {
  const navigate = useNavigate();

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
