
import React from "react";
import { FormField } from "@/types/form";
import FormFieldComponent from "./FormField";
import { Card, CardContent, CardFooter, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Send } from "lucide-react";

interface FormQuestionProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  handlePrevious: () => void;
  handleNext: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isAdminPreview: boolean;
  isEditMode: boolean;
  formColor?: string;
  title: string;
  description?: string;
}

const FormQuestion = ({
  field,
  value,
  onChange,
  isFirstQuestion,
  isLastQuestion,
  handlePrevious,
  handleNext,
  handleSubmit,
  isSubmitting,
  isAdminPreview,
  isEditMode,
  formColor,
  title,
  description
}: FormQuestionProps) => {
  const cardStyle = formColor ? { 
    borderTop: `4px solid ${formColor}`,
    boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
  } : {};

  const buttonStyle = formColor ? {
    backgroundColor: formColor,
    borderColor: formColor
  } : {};

  // Handlers para manejar los eventos de clic explícitamente
  const handlePreviousClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePrevious();
  };

  const handleNextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleNext();
  };

  const handleSubmitClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSubmit(e as any);
  };

  return (
    <Card style={cardStyle} className="mb-6">
      <CardHeader>
        <CardTitle 
          style={formColor ? { color: formColor } : {}}
          className="text-2xl font-bold"
        >
          {title}
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
        {description && (
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="form-field border-0 shadow-none p-0">
          <FormFieldComponent
            field={field}
            value={value || ""}
            onChange={(value) => onChange(value)}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousClick}
          disabled={isFirstQuestion}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        
        <div>
          {isLastQuestion ? (
            <Button
              type="button"
              onClick={handleSubmitClick}
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
              type="button"
              onClick={handleNextClick}
              style={buttonStyle}
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default FormQuestion;
