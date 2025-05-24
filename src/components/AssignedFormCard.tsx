import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock, Users, FileText } from "lucide-react";
import { Form } from "@/types/form";
import { useForm } from "@/contexts/form/FormContext";
import { format } from "date-fns";

interface AssignedFormCardProps {
  form: Form;
}

const AssignedFormCard: React.FC<AssignedFormCardProps> = ({ form }) => {
  const navigate = useNavigate();
  const { isUserAllowed } = useForm();

  const canAccessForm = () => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return false;
    return isUserAllowed(form.id, userEmail);
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{form.title}</CardTitle>
        <CardDescription>{form.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          Created: {form.createdAt && format(new Date(form.createdAt), "MMM d, yyyy")}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          Access: {form.isPrivate ? "Private" : "Public"}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="h-4 w-4" />
          Fields: {form.fields.length}
        </div>
      </CardContent>
      <CardContent>
        <Button onClick={() => navigate(`/forms/${form.id}`)} disabled={form.isPrivate && !canAccessForm()}>
          {form.isPrivate && !canAccessForm() ? "Access Denied" : "View Form"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AssignedFormCard;
