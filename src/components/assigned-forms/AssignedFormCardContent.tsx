
import { CardContent } from "@/components/ui/card";
import { Form } from "@/types/form";

interface AssignedFormCardContentProps {
  form: Form;
}

const AssignedFormCardContent = ({ form }: AssignedFormCardContentProps) => {
  // Get question count safely
  const questionCount = Array.isArray(form.fields) ? form.fields.length : 0;

  return (
    <CardContent className="flex-grow">
      {form.description && (
        <p className="text-gray-600 mb-3 text-sm line-clamp-2">{form.description}</p>
      )}
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <span>{questionCount} {questionCount === 1 ? 'pregunta' : 'preguntas'}</span>
      </div>
    </CardContent>
  );
};

export default AssignedFormCardContent;
