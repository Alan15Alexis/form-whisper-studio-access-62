
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface FormActionsProps {
  isSaving: boolean;
  onSave: () => void;
}

const FormActions = ({ isSaving, onSave }: FormActionsProps) => {
  return (
    <Button 
      onClick={onSave}
      disabled={isSaving} 
      className="btn-primary px-6 py-2 rounded-md shadow-sm hover:shadow transition-all"
    >
      <Save className="mr-2 h-4 w-4" />
      {isSaving ? "Guardando..." : "Guardar"}
    </Button>
  );
};

export default FormActions;
