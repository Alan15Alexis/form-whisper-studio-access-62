
import { useFormPermissions } from "@/hooks/useFormPermissions";
import { Form } from "@/types/form";

interface FormFieldsHeaderProps {
  fieldsCount: number;
  formData: Partial<Form>;
}

const FormFieldsHeader = ({ fieldsCount, formData }: FormFieldsHeaderProps) => {
  const { getPermissionSummary, getUserRole } = useFormPermissions();

  const permissionSummary = formData.id ? getPermissionSummary(formData.id) : null;
  const userRole = getUserRole(formData as Form);

  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">
        Campos del Formulario ({fieldsCount})
      </h3>
      {permissionSummary && (
        <div className="text-sm text-gray-500">
          Rol: <span className="font-medium capitalize">{userRole}</span>
          {permissionSummary.debugInfo.collaboratorCount > 0 && (
            <span className="ml-2">
              • {permissionSummary.debugInfo.collaboratorCount} colaborador(es)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FormFieldsHeader;
