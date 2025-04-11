
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/types/form";
import { Link } from "react-router-dom";
import { Edit, Eye, Trash, Lock, Unlock, BarChart } from "lucide-react";
import { useForm } from "@/contexts/FormContext";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface FormCardProps {
  form: Form;
}

const FormCard = ({ form }: FormCardProps) => {
  const { deleteForm } = useForm();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteForm(form.id);
    setIsDeleting(false);
  };

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
      <CardFooter className="pt-3 grid grid-cols-2 gap-2">
        <div className="flex gap-2">
          <Button 
            asChild 
            variant="ghost" 
            className="btn-minimal flex-1 h-9 hover:bg-gray-50 hover:text-[#686df3]"
          >
            <Link to={`/forms/${form.id}`}>
              <Eye className="h-4 w-4" />
              <span className="ml-1">Ver</span>
            </Link>
          </Button>
          <Button 
            asChild 
            variant="ghost" 
            className="btn-minimal flex-1 h-9 hover:bg-gray-50 hover:text-[#686df3]"
          >
            <Link to={`/forms/${form.id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="ml-1">Editar</span>
            </Link>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button 
            asChild 
            variant="ghost" 
            className="btn-minimal flex-1 h-9 hover:bg-gray-50 hover:text-[#686df3]"
          >
            <Link to={`/forms/${form.id}/responses`}>
              <BarChart className="h-4 w-4" />
              <span className="ml-1">Respuestas</span>
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="btn-minimal flex-1 h-9 hover:bg-red-50 hover:text-red-600"
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
    </Card>
  );
};

export default FormCard;
