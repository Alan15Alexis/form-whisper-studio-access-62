
import { FormField } from "@/types/form";

interface FormScoringIndicatorProps {
  formShowTotalScore?: boolean;
  fieldsArray: FormField[];
}

const FormScoringIndicator = ({ formShowTotalScore, fieldsArray }: FormScoringIndicatorProps) => {
  if (!formShowTotalScore || !fieldsArray.some(f => f.hasNumericValues)) {
    return null;
  }

  return (
    <div className="mt-4 p-4 border rounded-lg bg-secondary/10">
      <h3 className="font-medium">Puntuación Total</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Este formulario mostrará la puntuación total y los mensajes personalizados 
        según las respuestas seleccionadas.
      </p>
    </div>
  );
};

export default FormScoringIndicator;
