
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FormActionsProps {
  isSaving: boolean;
  onSave: () => void;
}

const FormActions = ({ isSaving, onSave }: FormActionsProps) => {
  return (
    <Button 
      onClick={() => {
        onSave();
        toast({
          title: "Guardando formulario",
          description: "Guardando todos los cambios del formulario...",
        });
      }}
      disabled={isSaving} 
      className="btn-primary px-6 py-2 rounded-md shadow-sm hover:shadow transition-all"
    >
      <Save className="mr-2 h-4 w-4" />
      {isSaving ? "Guardando..." : "Guardar"}
    </Button>
  );
};

export default FormActions;
