
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface FormActionsProps {
  isSaving: boolean;
  isEditMode: boolean;
}

const FormActions = ({ isSaving, isEditMode }: FormActionsProps) => {
  return (
    <div className="mt-8 flex justify-end">
      <Button type="submit" disabled={isSaving} className="px-8">
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Guardando..." : isEditMode ? "Actualizar Formulario" : "Guardar Formulario"}
      </Button>
    </div>
  );
};

export default FormActions;
