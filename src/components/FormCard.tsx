
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/types/form";
import { Link } from "react-router-dom";
import { Edit, Eye, Trash, Lock, Unlock, BarChart, Share2 } from "lucide-react";
import { useForm } from "@/contexts/FormContext";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import ShareFormDialog from "./ShareFormDialog";

interface FormCardProps {
  form: Form;
}

const FormCard = ({ form }: FormCardProps) => {
  const { deleteForm, generateAccessLink } = useForm();
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteForm(form.id);
    setIsDeleting(false);
  };

  const shareUrl = generateAccessLink(form.id);

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center">
              {form.title}
              {form.isPrivate ? (
                <Lock className="ml-2 h-4 w-4 text-amber-500" />
              ) : (
                <Unlock className="ml-2 h-4 w-4 text-green-500" />
              )}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Created {format(new Date(form.createdAt), 'MMM d, yyyy')}
            </CardDescription>
          </div>
          <Badge variant={form.isPrivate ? "outline" : "secondary"}>
            {form.isPrivate ? 'Private' : 'Public'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm flex-grow">
        {form.description && (
          <p className="text-gray-600 mb-3">{form.description}</p>
        )}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>{form.fields.length} fields</span>
          {form.isPrivate && (
            <>
              <span>•</span>
              <span>{form.allowedUsers.length} allowed users</span>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-3 grid grid-cols-4 gap-2">
        <Button 
          asChild 
          variant="ghost" 
          className="btn-minimal btn-outline w-full h-9"
        >
          <Link to={`/forms/${form.id}`}>
            <Eye className="h-4 w-4" />
            <span className="ml-1">Ver</span>
          </Link>
        </Button>
        <Button 
          asChild 
          variant="ghost" 
          className="btn-minimal btn-outline w-full h-9"
        >
          <Link to={`/forms/${form.id}/edit`}>
            <Edit className="h-4 w-4" />
            <span className="ml-1">Editar</span>
          </Link>
        </Button>
        <Button 
          asChild 
          variant="ghost" 
          className="btn-minimal btn-outline w-full h-9"
        >
          <Link to={`/forms/${form.id}/responses`}>
            <BarChart className="h-4 w-4" />
            <span className="ml-1">Respuestas</span>
          </Link>
        </Button>
        <Button 
          variant="ghost" 
          className="btn-minimal btn-outline w-full h-9"
          onClick={() => setShareDialogOpen(true)}
        >
          <Share2 className="h-4 w-4" />
          <span className="ml-1">Compartir</span>
        </Button>
        
        <div className="col-span-4 mt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="btn-minimal w-full h-9 hover:bg-red-50 hover:text-red-600 border border-gray-200"
              >
                <Trash className="h-4 w-4" />
                <span className="ml-1">Eliminar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Eliminará permanentemente el formulario y todos los datos asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>

      {/* Share Dialog */}
      <ShareFormDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareUrl={shareUrl}
        formTitle={form.title}
      />
    </Card>
  );
};

export default FormCard;
