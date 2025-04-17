
import React from "react";
import { 
  Type, 
  AlignLeft, 
  Radio, 
  CheckSquare, 
  Check, 
  X, 
  ChevronDown,
  Image,
  Hash,
  User,
  Mail,
  MapPin,
  Phone,
  Upload,
  FileUp,
  PenTool,
  Grid3X3,
  Star,
  BarChart,
  Timer,
  Calendar,
  Clock,
  FileText,
  Edit3
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { FieldCategory } from "@/types/form";
import { cn } from "@/lib/utils";

const fieldCategories: FieldCategory[] = [
  {
    id: "essential",
    title: "🔹 Esenciales",
    fields: [
      { type: "text", icon: "Type", label: "Texto corto" },
      { type: "textarea", icon: "AlignLeft", label: "Texto largo" },
      { type: "radio", icon: "Radio", label: "Selección individual" },
      { type: "yesno", icon: "Check", label: "Sí / No" },
      { type: "checkbox", icon: "CheckSquare", label: "Selección múltiple" },
      { type: "select", icon: "ChevronDown", label: "Selección desplegable" },
      { type: "image-select", icon: "Image", label: "Selección de imagen" },
      { type: "number", icon: "Hash", label: "Número" }
    ]
  },
  {
    id: "contact",
    title: "📇 Detalles de contacto",
    fields: [
      { type: "fullname", icon: "User", label: "Nombre completo" },
      { type: "email", icon: "Mail", label: "Email" },
      { type: "address", icon: "MapPin", label: "Dirección" },
      { type: "phone", icon: "Phone", label: "Teléfono" }
    ]
  },
  {
    id: "uploads",
    title: "📤 Cargas",
    fields: [
      { type: "image-upload", icon: "Image", label: "Subir imagen" },
      { type: "file-upload", icon: "FileUp", label: "Subir archivo" },
      { type: "drawing", icon: "PenTool", label: "Dibujo" }
    ]
  },
  {
    id: "ratings",
    title: "⭐ Escalas de calificación",
    fields: [
      { type: "matrix", icon: "Grid3X3", label: "Matriz de selección" },
      { type: "opinion-scale", icon: "BarChart", label: "Escala de opinión" },
      { type: "star-rating", icon: "Star", label: "Calificación de estrellas" },
      { type: "ranking", icon: "BarChart", label: "Clasificación" }
    ]
  },
  {
    id: "datetime",
    title: "📅 Fecha y hora",
    fields: [
      { type: "timer", icon: "Timer", label: "Temporizador" },
      { type: "date", icon: "Calendar", label: "Fecha" },
      { type: "time", icon: "Clock", label: "Hora" }
    ]
  },
  {
    id: "legal",
    title: "📜 Legales y consentimiento",
    fields: [
      { type: "terms", icon: "FileText", label: "Términos y condiciones" },
      { type: "signature", icon: "Edit3", label: "Signature" }
    ]
  }
];

const FieldsSidebar = () => {
  // Function to render the icon based on its name
  const renderIcon = (iconName: string) => {
    const iconSize = 16;
    const iconProps = { size: iconSize, className: "text-primary" };

    switch(iconName) {
      case "Type": return <Type {...iconProps} />;
      case "AlignLeft": return <AlignLeft {...iconProps} />;
      case "Radio": return <Radio {...iconProps} />;
      case "Check": return <Check {...iconProps} />;
      case "X": return <X {...iconProps} />;
      case "CheckSquare": return <CheckSquare {...iconProps} />;
      case "ChevronDown": return <ChevronDown {...iconProps} />;
      case "Image": return <Image {...iconProps} />;
      case "Hash": return <Hash {...iconProps} />;
      case "User": return <User {...iconProps} />;
      case "Mail": return <Mail {...iconProps} />;
      case "MapPin": return <MapPin {...iconProps} />;
      case "Phone": return <Phone {...iconProps} />;
      case "Upload": return <Upload {...iconProps} />;
      case "FileUp": return <FileUp {...iconProps} />;
      case "PenTool": return <PenTool {...iconProps} />;
      case "Grid3X3": return <Grid3X3 {...iconProps} />;
      case "Star": return <Star {...iconProps} />;
      case "BarChart": return <BarChart {...iconProps} />;
      case "Timer": return <Timer {...iconProps} />;
      case "Calendar": return <Calendar {...iconProps} />;
      case "Clock": return <Clock {...iconProps} />;
      case "FileText": return <FileText {...iconProps} />;
      case "Edit3": return <Edit3 {...iconProps} />;
      default: return <Type {...iconProps} />;
    }
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Campos de Formulario</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Droppable droppableId="FIELDS_SIDEBAR" isDropDisabled={true}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {fieldCategories.map((category) => (
                <div key={category.id} className="mb-4">
                  <h3 className="text-sm font-medium mb-2">{category.title}</h3>
                  <div className="space-y-1">
                    {category.fields.map((field, index) => (
                      <Draggable
                        key={`${category.id}-${field.type}`}
                        draggableId={`field-${field.type}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "flex items-center gap-2 p-2 text-sm rounded-md cursor-move",
                              "hover:bg-primary/5 transition-colors",
                              snapshot.isDragging && "bg-primary/10 shadow-md"
                            )}
                          >
                            {renderIcon(field.icon)}
                            <span>{field.label}</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                </div>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
};

export default FieldsSidebar;
