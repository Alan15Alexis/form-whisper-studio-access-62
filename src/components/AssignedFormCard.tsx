
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

interface AssignedFormCardProps {
  form: Form;
  onRemove?: (formId: string) => void;
  isCompleted?: boolean; // Status from Supabase specific to current user
}

const AssignedFormCard = ({ form, onRemove, isCompleted = false }: AssignedFormCardProps) => {
  const { getFormResponses } = useForm();
  const navigate = useNavigate();
  const [showResponseDialog, setShowResponseDialog] = useState(false);
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

  // Get question count safely
  const questionCount = Array.isArray(form.fields) ? form.fields.length : 0;
  
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
            <p className="text-gray-600 mb-3 text-sm">{form.description}</p>
          )}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{questionCount} {questionCount === 1 ? 'pregunta' : 'preguntas'}</span>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center pt-4 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove && onRemove(form.id)}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <XIcon className="h-4 w-4 mr-1" />
            Ocultar
          </Button>
            
          {isCompleted ? (
            <div className="flex gap-2">
              {/* Only show view button if allowed */}
              {canViewOwnResponses && (
                <Button 
                  variant="outline" 
                  onClick={handleViewResponse}
                  size="sm"
                >
                  <EyeIcon className="mr-1 h-4 w-4" />
                  Ver
                </Button>
              )}
              
              {/* Only show edit button if allowed */}
              {canEditOwnResponses && (
                <Button 
                  style={buttonStyle}
                  onClick={handleEditResponse}
                  size="sm"
                >
                  <Edit2 className="mr-1 h-4 w-4" />
                  Editar
                </Button>
              )}
              
              {/* Show default view button if no permissions */}
              {!canViewOwnResponses && !canEditOwnResponses && (
                <Button 
                  variant="outline"
                  onClick={handleViewResponse}
                  size="sm"
                >
                  <CheckIcon className="mr-1 h-4 w-4" />
                  Completado
                </Button>
              )}
            </div>
          ) : (
            <Button style={buttonStyle} asChild>
              <Link to={`/forms/${form.id}`} state={{ formData: form }} className="flex items-center">
                <ArrowRightIcon className="mr-1 h-4 w-4" />
                Empezar ahora
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>

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
