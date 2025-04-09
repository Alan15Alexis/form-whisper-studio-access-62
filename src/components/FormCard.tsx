
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
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
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
      <CardContent className="text-sm">
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
      <CardFooter className="flex justify-between gap-2 pt-3">
        <div className="flex gap-2 w-full">
          <Button asChild variant="outline" className="flex-1">
            <Link to={`/forms/${form.id}`}>
              <Eye className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">View</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to={`/forms/${form.id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          </Button>
        </div>
        <div className="flex gap-2 w-full">
          <Button asChild variant="outline" className="flex-1">
            <Link to={`/forms/${form.id}/responses`}>
              <BarChart className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Responses</span>
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600">
                <Trash className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the form and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
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
