
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRightIcon, CheckIcon, EyeIcon, XIcon, Edit2 } from "lucide-react";
import { Form } from "@/types/form";

interface AssignedFormCardActionsProps {
  form: Form;
  isCompleted: boolean;
  onRemove?: (formId: string) => void;
  onViewCompletionInfo: () => void;
  onViewResponse: () => void;
  onEditResponse: () => void;
}

const AssignedFormCardActions = ({ 
  form, 
  isCompleted, 
  onRemove, 
  onViewCompletionInfo,
  onViewResponse,
  onEditResponse
}: AssignedFormCardActionsProps) => {
  const buttonStyle = form.formColor ? {
    backgroundColor: form.formColor,
    borderColor: form.formColor
  } : {};

  return (
    <CardFooter className="pt-4">
      <div className="flex items-center justify-end space-x-2 w-full">
        {/* Hide button */}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(form.id)}
            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
            title="Ocultar"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Ocultar</span>
          </Button>
        )}
        
        {isCompleted ? (
          <>
            {/* Completion info button */}
            <Button 
              variant="outline" 
              onClick={onViewCompletionInfo}
              size="icon"
              className="h-8 w-8"
              title="Completado"
            >
              <CheckIcon className="h-4 w-4" />
              <span className="sr-only">Completado</span>
            </Button>
            
            {/* View responses button - only if allowed */}
            {form.allowViewOwnResponses && (
              <Button 
                variant="outline" 
                onClick={onViewResponse}
                size="icon"
                className="h-8 w-8"
                title="Ver respuestas"
              >
                <EyeIcon className="h-4 w-4" />
                <span className="sr-only">Ver respuestas</span>
              </Button>
            )}
            
            {/* Edit responses button - only if allowed */}
            {form.allowEditOwnResponses && (
              <Button 
                style={buttonStyle}
                onClick={onEditResponse}
                size="icon"
                className="h-8 w-8"
                title="Editar respuestas"
              >
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Editar respuestas</span>
              </Button>
            )}
          </>
        ) : (
          /* Start button for not completed forms */
          <Button style={buttonStyle} asChild size="icon" className="h-8 w-8" title="Empezar ahora">
            <Link to={`/forms/${form.id}`} state={{ formData: form }}>
              <ArrowRightIcon className="h-4 w-4" />
              <span className="sr-only">Empezar ahora</span>
            </Link>
          </Button>
        )}
      </div>
    </CardFooter>
  );
};

export default AssignedFormCardActions;
