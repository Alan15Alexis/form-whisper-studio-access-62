
import { FormField } from "@/types/form";

interface DragDropContextProps {
  formData: { fields?: FormField[] };
  setFormData: (data: any) => void;
  addField: (type: string) => void; // Use the centralized addField function
}

export function useDragAndDrop({ formData, setFormData, addField }: DragDropContextProps) {
  const handleDragEnd = (result: import("react-beautiful-dnd").DropResult) => {
    const { source, destination } = result;
    
    if (!destination) return;
    
    if (source.droppableId === "FIELDS_SIDEBAR" && destination.droppableId === "FORM_FIELDS") {
      // Extract the field type from the dragged item's ID
      const draggedFieldType = result.draggableId.replace('field-', '');
      
      console.log("useDragAndDrop - Adding field via drag:", draggedFieldType);
      
      // Use the centralized addField function
      addField(draggedFieldType);
      
      return;
    }
    
    if (source.droppableId === "FORM_FIELDS" && destination.droppableId === "FORM_FIELDS") {
      if (!formData.fields) return;
      
      const reorderedFields = Array.from(formData.fields);
      const [removed] = reorderedFields.splice(source.index, 1);
      reorderedFields.splice(destination.index, 0, removed);
      
      setFormData({
        ...formData,
        fields: reorderedFields,
      });
    }
  };

  return { handleDragEnd };
}
