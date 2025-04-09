
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form } from "@/types/form";

interface FormBasicInfoProps {
  formData: Partial<Form>;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

const FormBasicInfo = ({ formData, onTitleChange, onDescriptionChange }: FormBasicInfoProps) => {
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onDescriptionChange(e.target.value);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-lg font-medium">Form Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="Enter form title"
            required
            className="text-lg"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description" className="text-lg font-medium">Description (Optional)</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={handleDescriptionChange}
            placeholder="Enter form description"
            rows={3}
          />
        </div>
      </div>
    </Card>
  );
};

export default FormBasicInfo;
