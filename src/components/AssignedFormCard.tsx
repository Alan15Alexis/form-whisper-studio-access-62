import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/types/form";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRightIcon, CheckIcon, EyeIcon, XIcon, Edit2 } from "lucide-react";
import { useForm } from "@/contexts/form";
import { format } from "date-fns";
import { useState } from "react";
import ViewResponseDialog from "./ViewResponseDialog";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AssignedFormCardProps {
  form: Form;
  onRemove?: (formId: string) => void;
  isCompleted?: boolean;
}

const AssignedFormCard = ({ form, onRemove, isCompleted = false }: AssignedFormCardProps) => {
  const { getFormResponses } = useForm();
  const navigate = useNavigate();
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showCompletionInfo, setShowCompletionInfo] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Check if form has local responses or if it's completed in the database for this user
  const hasResponded = getFormResponses(form.id).length > 0 || isCompleted;
  
  // Get form configuration for viewing and editing responses
  const canViewOwnResponses = form.allowViewOwnResponses;
  const canEditOwnResponses = form.allowEditOwnResponses;
  
  const cardStyle = form.formColor ? {
    backgroundColor: `${form.formColor}05`,
    borderLeft: `4px solid ${form.formColor}`,
    boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px ${form.formColor}20`
  } : {};
  
  const buttonStyle = form.formColor ? {
    backgroundColor: form.formColor,
    borderColor: form.formColor
  } : {};

  // Format date or use fallback
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  // Format date with time or use fallback
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Fecha y hora no disponible';
    }
  };

  // Get question count safely
  const questionCount = Array.isArray(form.fields) ? form.fields.length : 0;
  
  // Handle view completion info
  const handleViewCompletionInfo = () => {
    setShowCompletionInfo(true);
  };
  
  // Handle view form response
  const handleViewResponse = () => {
    setIsEditMode(false);
    setShowResponseDialog(true);
  };
  
  // Handle edit form response
  const handleEditResponse = () => {
    if (canEditOwnResponses) {
      // Navigate to form view with edit mode param
      navigate(`/forms/${form.id}?edit=true`, { 
        state: { 
          formData: form,
          editMode: true
        } 
      });
    }
  };

  return (
    <>
      <Card 
        className="overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col h-full" 
        style={cardStyle}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl" style={{ color: form.formColor || 'inherit' }}>
              {form.title}
            </CardTitle>
            {isCompleted ? (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                <CheckIcon className="mr-1 h-3 w-3" />
                Completado
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                Pendiente
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Asignado: {formatDate(form.createdAt)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow">
          {form.description && (
            <p className="text-gray-600 mb-3 text-sm line-clamp-2">{form.description}</p>
          )}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{questionCount} {questionCount === 1 ? 'pregunta' : 'preguntas'}</span>
          </div>
        </CardContent>
        
        <CardFooter className="pt-4">
          {/* Updated to horizontal layout with only icons */}
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
                  onClick={handleViewCompletionInfo}
                  size="icon"
                  className="h-8 w-8"
                  title="Completado"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span className="sr-only">Completado</span>
                </Button>
                
                {/* View responses button - only if allowed */}
                {canViewOwnResponses && (
                  <Button 
                    variant="outline" 
                    onClick={handleViewResponse}
                    size="icon"
                    className="h-8 w-8"
                    title="Ver respuestas"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span className="sr-only">Ver respuestas</span>
                  </Button>
                )}
                
                {/* Edit responses button - only if allowed */}
                {canEditOwnResponses && (
                  <Button 
                    style={buttonStyle}
                    onClick={handleEditResponse}
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
      </Card>

      {/* Completion Info Dialog */}
      <Dialog open={showCompletionInfo} onOpenChange={setShowCompletionInfo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: form.formColor || 'inherit' }}>Formulario Completado</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <p><strong>Formulario:</strong> {form.title}</p>
            <p><strong>Fecha de envío:</strong> {formatDateTime(form.updatedAt)}</p>
            <p className="text-sm text-gray-500">Este formulario ya ha sido completado correctamente.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keep the existing ViewResponseDialog for when view is explicitly requested */}
      {showResponseDialog && (
        <ViewResponseDialog 
          formId={form.id} 
          formTitle={form.title}
          fields={form.fields}
          open={showResponseDialog} 
          onClose={() => setShowResponseDialog(false)} 
        />
      )}
    </>
  );
};

export default AssignedFormCard;
