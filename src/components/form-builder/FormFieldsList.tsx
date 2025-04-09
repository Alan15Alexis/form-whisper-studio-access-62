
import { FormField, Form } from "@/types/form";
import { Button } from "@/components/ui/button";
import FormFieldEditor from "@/components/FormFieldEditor";
import { Plus } from "lucide-react";

interface FormFieldsListProps {
  formData: Partial<Form>;
  addField: () => void;
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
}

const FormFieldsList = ({ formData, addField, updateField, removeField }: FormFieldsListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Form Fields</h3>
        <Button type="button" onClick={addField} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Add Field
        </Button>
      </div>
      
      <div className="space-y-4">
        {formData.fields && formData.fields.length > 0 ? (
          formData.fields.map(field => (
            <FormFieldEditor
              key={field.id}
              field={field}
              onChange={(updatedField) => updateField(field.id, updatedField)}
              onDelete={() => removeField(field.id)}
            />
          ))
        ) : (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <p className="text-gray-500 mb-4">No fields added yet</p>
            <Button type="button" onClick={addField} variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Add Your First Field
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormFieldsList;
