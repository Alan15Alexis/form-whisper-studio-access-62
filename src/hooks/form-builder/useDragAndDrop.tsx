
import { FormField } from "@/types/form";

interface DragDropContextProps {
  formData: { fields?: FormField[] };
  setFormData: (data: any) => void;
}

export function useDragAndDrop({ formData, setFormData }: DragDropContextProps) {
  const handleDragEnd = (result: import("react-beautiful-dnd").DropResult) => {
    const { source, destination } = result;
    
    if (!destination) return;
    
    if (source.droppableId === "FIELDS_SIDEBAR" && destination.droppableId === "FORM_FIELDS") {
      // This case should be handled outside the hook since we don't have addField function
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
