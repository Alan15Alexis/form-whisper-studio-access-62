
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "lucide-react";
import { Form } from "@/types/form";
import { format } from "date-fns";

interface AssignedFormCardHeaderProps {
  form: Form;
  isCompleted: boolean;
}

const AssignedFormCardHeader = ({ form, isCompleted }: AssignedFormCardHeaderProps) => {
  // Format date or use fallback
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  return (
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
  );
};

export default AssignedFormCardHeader;
