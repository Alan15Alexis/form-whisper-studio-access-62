import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/types/form";
import { Link } from "react-router-dom";
import { ArrowRightIcon, Edit2Icon, Share2Icon, TrashIcon, Users2Icon } from "lucide-react";
import { useState } from "react";
import ShareFormDialog from "./ShareFormDialog";
import { format } from "date-fns";

interface FormCardProps {
  form: Form;
  onEdit?: (form: Form) => void;
  onDelete?: (id: string) => Promise<void>;
}

const FormCard = ({ form, onEdit, onDelete }: FormCardProps) => {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const cardStyle = form.formColor ? {
    backgroundColor: `${form.formColor}05`,
    borderLeft: `4px solid ${form.formColor}`,
    boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px ${form.formColor}20`
  } : {};
  
  const buttonStyle = form.formColor ? {
    backgroundColor: form.formColor,
    borderColor: form.formColor
  } : {};

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const questionCount = Array.isArray(form.fields) ? form.fields.length : 0;

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
            {form.isPrivate ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                <Users2Icon className="mr-1 h-3 w-3" />
                Privado
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                Público
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Creado: {formatDate(form.createdAt)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow">
          {form.description && (
            <p className="text-gray-600 mb-3 text-sm line-clamp-2">{form.description}</p>
          )}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{questionCount} {questionCount === 1 ? 'pregunta' : 'preguntas'}</span>
            {form.isPrivate && (
              <>
                <span>•</span>
                <span>{form.allowedUsers?.length || 0} usuarios permitidos</span>
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2Icon className="mr-2 h-3 w-3" />
                Compartir
              </Button>
              
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(form)}>
                  <Edit2Icon className="mr-2 h-3 w-3" />
                  Editar
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button style={buttonStyle} asChild size="sm">
                <Link to={`/forms/${form.id}`} state={{ formData: form }}>
                  <ArrowRightIcon className="mr-2 h-3 w-3" />
                  Ver
                </Link>
              </Button>
              
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDelete(form.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>

      <ShareFormDialog 
        open={showShareDialog} 
        onClose={() => setShowShareDialog(false)}
        formId={form.id}
        formTitle={form.title}
        isPrivate={form.isPrivate}
        allowedUsers={form.allowedUsers || []}
      />
    </>
  );
};

export default FormCard;
