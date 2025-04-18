
import { FormField, Form } from "@/types/form";
import FormFieldEditor from "@/components/FormFieldEditor";
import { cn } from "@/lib/utils";

interface FormFieldsListProps {
  formData: Partial<Form>;
  updateField: (id: string, updatedField: FormField) => void;
  removeField: (id: string) => void;
}

const FormFieldsList = ({ formData, updateField, removeField }: FormFieldsListProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Campos del Formulario</h3>
      
      <div className="space-y-4 min-h-[200px] p-4 rounded-lg">
        {formData.fields && formData.fields.length > 0 ? (
          formData.fields.map((field) => (
            <div key={field.id}>
              <FormFieldEditor
                field={field}
                onChange={(updatedField) => updateField(field.id, updatedField)}
                onDelete={() => removeField(field.id)}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <p className="text-gray-500">Arrastra campos desde la barra lateral para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormFieldsList;
