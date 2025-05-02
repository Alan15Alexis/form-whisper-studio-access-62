
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/types/form";
import { Link } from "react-router-dom";
import { CheckCircle2, CircleDot, FileText, SendHorizontal, Trash2 } from "lucide-react";
import { useForm } from "@/contexts/form";
import { format } from "date-fns";

interface AssignedFormCardProps {
  form: Form;
  onRemove?: (formId: string) => void;
}

const AssignedFormCard = ({ form, onRemove }: AssignedFormCardProps) => {
  const { getFormResponses } = useForm();
  const responses = getFormResponses(form.id);
  const hasResponded = responses.length > 0;

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRemove) onRemove(form.id);
  };

  const canEdit = !!form.allowEditOwnResponses;
  const canView = !!form.allowViewOwnResponses;
  
  // Create a more prominent card style based on form color
  const cardStyle = form.formColor ? {
    backgroundColor: `${form.formColor}05`, // Very light background color
    borderLeft: `4px solid ${form.formColor}`,
    boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px ${form.formColor}20`
  } : {};
  
  // Apply a subtle background color for the badge if form color is set
  const badgeStyle = form.formColor ? {
    backgroundColor: hasResponded ? form.formColor : `${form.formColor}15`,
    borderColor: `${form.formColor}30`
  } : {};

  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full"
      style={cardStyle}
    >
      <CardHeader className="pb-3" style={form.formColor ? { borderBottom: `1px solid ${form.formColor}20` } : {}}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl" style={{ color: form.formColor || 'inherit' }}>
              {form.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Created {format(new Date(form.createdAt), 'MMM d, yyyy')}
            </CardDescription>
          </div>
          <Badge 
            variant={hasResponded ? "default" : "secondary"}
            style={form.formColor ? badgeStyle : {}}
          >
            {hasResponded ? (
              <><CheckCircle2 className="mr-1 h-3 w-3" /> Responded</>
            ) : (
              <><CircleDot className="mr-1 h-3 w-3" /> Pending</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm flex-grow">
        {form.description && (
          <p className="text-gray-600 mb-3">{form.description}</p>
        )}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>{form.fields.length} fields</span>
        </div>
      </CardContent>
      <CardFooter 
        className="pt-3 grid grid-cols-2 gap-2"
        style={form.formColor ? { borderTop: `1px solid ${form.formColor}10` } : {}}
      >
        {(!hasResponded || canEdit) && (
          <Button 
            asChild 
            variant={hasResponded ? "secondary" : "default"}
            style={form.formColor ? {
              backgroundColor: hasResponded ? `${form.formColor}15` : form.formColor,
              borderColor: form.formColor,
              color: hasResponded ? form.formColor : "#fff"
            } : {}}
          >
            <Link to={`/forms/${form.id}`}>
              <SendHorizontal className="mr-2 h-4 w-4" />
              {hasResponded ? "Edit Response" : "Respond"}
            </Link>
          </Button>
        )}
        {canView && hasResponded && (
          <Button 
            asChild 
            variant="outline"
            style={form.formColor ? {
              borderColor: `${form.formColor}40`,
              color: form.formColor
            } : {}}
          >
            <Link to={`/forms/${form.id}/responses`}>
              <FileText className="mr-2 h-4 w-4" />
              View Responses
            </Link>
          </Button>
        )}
        {onRemove && (
          <Button
            type="button"
            variant="outline"
            className="col-span-2 mt-1"
            onClick={handleRemove}
            style={form.formColor ? {
              borderColor: `${form.formColor}40`,
              color: form.formColor
            } : {}}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Quitar de mi vista
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AssignedFormCard;
