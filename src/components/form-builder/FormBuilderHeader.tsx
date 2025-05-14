
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FormActions from "@/components/form-builder/FormActions";

interface FormBuilderHeaderProps {
  isSaving: boolean;
  isEditMode: boolean;
  onSave: () => void;
  formTitle: string;
}

const FormBuilderHeader = ({ isSaving, isEditMode, onSave, formTitle }: FormBuilderHeaderProps) => {
  const navigate = useNavigate();

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/dashboard-admin");
  };

  return (
    <div className="mb-6 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" onClick={handleBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-xl font-semibold">{formTitle || 'New Form'}</h1>
      </div>
      
      <FormActions isSaving={isSaving} onSave={onSave} />
    </div>
  );
};

export default FormBuilderHeader;
