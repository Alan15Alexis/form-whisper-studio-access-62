
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FormActions from "@/components/form-builder/FormActions";

interface FormBuilderHeaderProps {
  isSaving: boolean;
  isEditMode: boolean;
  onSave: () => void;
}

const FormBuilderHeader = ({ isSaving, isEditMode, onSave }: FormBuilderHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6 flex justify-between items-center">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <FormActions isSaving={isSaving} onSave={onSave} />
    </div>
  );
};

export default FormBuilderHeader;
