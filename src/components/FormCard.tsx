
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/types/form";
import { Link, useNavigate } from "react-router-dom";
import { Edit, Share, Trash, ClipboardCheck, Eye } from "lucide-react";
import { useForm } from "@/contexts/form";
import { format } from "date-fns";
import ShareFormDialog from "./ShareFormDialog";
import ViewResponseDialog from "./ViewResponseDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FormCardProps {
  form: Form;
}

const FormCard = ({ form }: FormCardProps) => {
  const { deleteForm } = useForm();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isViewResponsesOpen, setIsViewResponsesOpen] = useState(false);
  
  const cardStyle = form.formColor ? {
    backgroundColor: `${form.formColor}05`,
    borderLeft: `4px solid ${form.formColor}`,
    boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px ${form.formColor}20`
  } : {};
  
  const buttonStyle = form.formColor ? {
    backgroundColor: form.formColor,
    borderColor: form.formColor
  } : {};

  const handleDelete = async () => {
    await deleteForm(form.id);
    setIsDeleteDialogOpen(false);
  };

  const handleEdit = () => {
    navigate(`/forms/${form.id}/edit`);
  };

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
  
  const privateText = form.isPrivate ? 'Privado' : 'Público';
  
  const accessText = form.isPrivate ? 'Solo usuarios autorizados' : 'Cualquier persona';
  
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
            <Badge variant="outline">
              {privateText} - {accessText}
            </Badge>
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Creado: {formatDate(form.createdAt)}
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
        
        <CardFooter className="flex justify-between items-center pt-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/forms/${form.id}/edit`)} title="Editar">
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => setIsShareDialogOpen(true)} title="Compartir">
              <Share className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => navigate(`/forms/${form.id}/responses`)} title="Ver análisis">
              <ClipboardCheck className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => setIsViewResponsesOpen(true)} title="Ver respuestas">
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-destructive"
              title="Eliminar"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button asChild>
              <Link to={`/forms/${form.id}/edit`} className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>

      <ShareFormDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        formId={form.id}
        formTitle={form.title}
        isPrivate={form.isPrivate}
        allowedUsers={form.allowedUsers}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Deseas eliminar este formulario?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {isViewResponsesOpen && (
        <ViewResponseDialog
          formId={form.id}
          formTitle={form.title}
          fields={form.fields}
          open={isViewResponsesOpen}
          onClose={() => setIsViewResponsesOpen(false)}
          adminView={true}
        />
      )}
    </>
  );
};

export default FormCard;
