
import { FormField } from "@/types/form";
import { useFormPermissions } from "@/hooks/useFormPermissions";

interface DragDropContextProps {
  formData: { fields?: FormField[], id?: string };
  setFormData: (data: any) => void;
  addField: (type: string) => void;
}

export function useDragAndDrop({ formData, setFormData, addField }: DragDropContextProps) {
  const { canEditFormById } = useFormPermissions();

  const handleDragEnd = (result: import("react-beautiful-dnd").DropResult) => {
    const { source, destination } = result;
    
    console.log("useDragAndDrop - handleDragEnd:", {
      sourceDroppableId: source.droppableId,
      destinationDroppableId: destination?.droppableId,
      draggableId: result.draggableId,
      formId: formData.id
    });
    
    if (!destination) {
      console.log("useDragAndDrop - No destination, aborting");
      return;
    }

    // Check permissions for any drag operation
    const canEdit = formData.id ? canEditFormById(formData.id) : true;
    if (!canEdit) {
      console.warn("useDragAndDrop - Drag operation blocked: insufficient permissions");
      return;
    }
    
    if (source.droppableId === "FIELDS_SIDEBAR" && destination.droppableId === "FORM_FIELDS") {
      // Extract the field type from the dragged item's ID
      const draggedFieldType = result.draggableId.replace('field-', '');
      
      console.log("useDragAndDrop - Adding field via drag:", {
        draggedFieldType,
        canEdit,
        formId: formData.id
      });
      
      // Use the centralized addField function
      addField(draggedFieldType);
      
      return;
    }
    
    if (source.droppableId === "FORM_FIELDS" && destination.droppableId === "FORM_FIELDS") {
      if (!formData.fields) {
        console.log("useDragAndDrop - No fields to reorder");
        return;
      }
      
      console.log("useDragAndDrop - Reordering fields:", {
        fromIndex: source.index,
        toIndex: destination.index,
        totalFields: formData.fields.length
      });
      
      const reorderedFields = Array.from(formData.fields);
      const [removed] = reorderedFields.splice(source.index, 1);
      reorderedFields.splice(destination.index, 0, removed);
      
      setFormData({
        ...formData,
        fields: reorderedFields,
      });

      console.log("useDragAndDrop - Fields reordered successfully");
    }
  };

  return { handleDragEnd };
}
