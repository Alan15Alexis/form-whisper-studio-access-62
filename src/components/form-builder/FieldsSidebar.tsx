
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TypeIcon, ClipboardCheck, SquareCheck, ListIcon, Calendar, RadioIcon, StarIcon, Gauge, CircleDot, ListTodo } from "lucide-react";

interface FieldsSidebarProps {
  onAddField: (fieldType: string) => void;
}

const FieldsSidebar = ({ onAddField }: FieldsSidebarProps) => {
  const fieldTypes = [
    { type: "text", label: "Text", icon: TypeIcon },
    { type: "textarea", label: "Text Area", icon: ClipboardCheck },
    { type: "checkbox", label: "Checkbox", icon: SquareCheck },
    { type: "select", label: "Dropdown", icon: ListIcon },
    { type: "radio", label: "Radio", icon: RadioIcon },
    { type: "date", label: "Date", icon: Calendar },
    { type: "rating", label: "Rating", icon: StarIcon },
    { type: "slider", label: "Slider", icon: Gauge },
    { type: "boolean", label: "Yes/No", icon: CircleDot },
    { type: "checklist", label: "Checklist", icon: ListTodo },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-3">Add Field</h3>
        <div className="grid grid-cols-1 gap-2">
          {fieldTypes.map((field) => (
            <Button
              key={field.type}
              variant="outline"
              className="justify-start h-auto py-2 px-3"
              onClick={() => onAddField(field.type)}
            >
              <field.icon className="mr-2 h-4 w-4" />
              <span>{field.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FieldsSidebar;
