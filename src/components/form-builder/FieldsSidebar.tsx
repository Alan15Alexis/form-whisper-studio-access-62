
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  TypeIcon,
  ClipboardCheck,
  SquareCheck,
  ListIcon,
  Calendar,
  RadioIcon,
  StarIcon,
  Gauge,
  CircleDot,
  ListTodo,
  User,
  Mail,
  Phone,
  Upload,
  FileSpreadsheet,
  PencilLine,
  LayoutGrid,
  Scale,
  Stars,
  Clock,
  LogIn
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FieldsSidebarProps {
  onAddField: (fieldType: string) => void;
}

interface FieldCategory {
  title: string;
  fields: {
    type: string;
    label: string;
    icon: React.ElementType;
  }[];
}

const FieldsSidebar = ({ onAddField }: FieldsSidebarProps) => {
  const [openCategory, setOpenCategory] = useState<string | null>("essential");

  const fieldCategories: FieldCategory[] = [
    {
      title: "Esenciales",
      fields: [
        { type: "text", label: "Texto corto", icon: TypeIcon },
        { type: "textarea", label: "Texto largo", icon: ClipboardCheck },
        { type: "radio", label: "Selección individual", icon: RadioIcon },
        { type: "yesno", label: "Sí / No", icon: CircleDot },
        { type: "checkbox", label: "Selección múltiple", icon: SquareCheck },
        { type: "select", label: "Selección desplegable", icon: ListIcon },
        { type: "image-select", label: "Selección de imagen", icon: TypeIcon },
        { type: "number", label: "Número", icon: TypeIcon }
      ]
    },
    {
      title: "Detalles de contacto",
      fields: [
        { type: "fullname", label: "Nombre completo", icon: User },
        { type: "email", label: "Email", icon: Mail },
        { type: "phone", label: "Teléfono", icon: Phone }
      ]
    },
    {
      title: "Cargas",
      fields: [
        { type: "image-upload", label: "Subir imagen", icon: Upload },
        { type: "file-upload", label: "Subir archivo", icon: FileSpreadsheet },
        { type: "drawing", label: "Dibujo", icon: PencilLine }
      ]
    },
    {
      title: "Escalas de calificación",
      fields: [
        { type: "matrix", label: "Matriz de selección", icon: LayoutGrid },
        { type: "opinion-scale", label: "Escala de opinión", icon: Scale },
        { type: "star-rating", label: "Calificación de estrellas", icon: Stars }
      ]
    },
    {
      title: "Clasificación",
      fields: [
        { type: "date", label: "Fecha", icon: Calendar },
        { type: "time", label: "Hora", icon: Clock }
      ]
    }
  ];

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-3">Agregar Campo</h3>
        <div className="space-y-2">
          {fieldCategories.map((category, index) => (
            <Collapsible
              key={index}
              open={openCategory === category.title.toLowerCase()}
              onOpenChange={() => toggleCategory(category.title.toLowerCase())}
              className="border rounded-md"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center justify-between w-full p-3 h-auto hover:bg-secondary/20"
                >
                  <span className="font-medium">{category.title}</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      openCategory === category.title.toLowerCase() ? "rotate-90" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 gap-2 p-3 pt-0">
                  {category.fields.map((field) => (
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
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FieldsSidebar;
