import React, { useState } from "react";
import { 
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { FieldCategory } from "@/types/form";
import { cn } from "@/lib/utils";
import { renderIcon } from "@/lib/utils";

const fieldCategories: FieldCategory[] = [
  {
    id: "essential",
    title: "🔹 Esenciales",
    fields: [
      { type: "welcome", icon: "MessageSquare", label: "Mensaje de bienvenida" },
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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    fieldCategories.reduce((acc, category) => ({ ...acc, [category.id]: true }), {})
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
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
                  <div 
                    className="flex items-center justify-between cursor-pointer mb-1 p-1 hover:bg-muted/50 rounded-md"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <h3 className="text-sm font-medium">{category.title}</h3>
                    {expandedCategories[category.id] ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  {expandedCategories[category.id] && (
                    <div className="space-y-1 pl-2">
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
                  )}
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
