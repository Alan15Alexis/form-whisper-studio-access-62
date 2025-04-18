
import { FormField } from "@/types/form";

export function useDragAndDrop(
  addField: (type: string) => void,
  formData: { fields?: FormField[] },
  setFormData: (data: any) => void
) {
  const handleDragEnd = (result: import("react-beautiful-dnd").DropResult) => {
    const { source, destination } = result;
    
    if (!destination) return;
    
    if (source.droppableId === "FIELDS_SIDEBAR" && destination.droppableId === "FORM_FIELDS") {
      const fieldType = source.droppableId === "FIELDS_SIDEBAR" 
        ? result.draggableId.split("-")[1] 
        : "text";
      
      addField(fieldType);
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
