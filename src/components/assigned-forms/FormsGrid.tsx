
import React from "react";
import { Form } from "@/types/form";
import AssignedFormCard from "@/components/AssignedFormCard";

interface FormsGridProps {
  forms: Form[];
  formStatus: Record<string, boolean>;
  onHideForm: (formId: string) => void;
}

const FormsGrid = ({ forms, formStatus, onHideForm }: FormsGridProps) => {
  if (forms.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.map((form) => (
        <AssignedFormCard
          key={form.id}
          form={form}
          onRemove={onHideForm}
          isCompleted={formStatus[form.id]}
        />
      ))}
    </div>
  );
};

export default FormsGrid;
