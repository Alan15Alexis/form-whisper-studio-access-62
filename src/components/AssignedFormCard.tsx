
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Form } from "@/types/form";
import AssignedFormCardHeader from "./assigned-forms/AssignedFormCardHeader";
import AssignedFormCardContent from "./assigned-forms/AssignedFormCardContent";
import AssignedFormCardActions from "./assigned-forms/AssignedFormCardActions";
import CompletionInfoDialog from "./assigned-forms/CompletionInfoDialog";

interface AssignedFormCardProps {
  form: Form;
  isCompleted: boolean;
  onHide?: (formId: string) => void;
}

const AssignedFormCard = ({ form, isCompleted, onHide }: AssignedFormCardProps) => {
  const [showCompletionInfo, setShowCompletionInfo] = useState(false);

  return (
    <>
      <Card className="w-full hover:shadow-md transition-shadow duration-200 flex flex-col">
        <AssignedFormCardHeader form={form} isCompleted={isCompleted} />
        <AssignedFormCardContent form={form} />
        <AssignedFormCardActions
          form={form}
          isCompleted={isCompleted}
          onHide={onHide}
          onShowCompletionInfo={() => setShowCompletionInfo(true)}
        />
      </Card>

      <CompletionInfoDialog
        form={form}
        open={showCompletionInfo}
        onClose={() => setShowCompletionInfo(false)}
      />
    </>
  );
};

export default AssignedFormCard;
