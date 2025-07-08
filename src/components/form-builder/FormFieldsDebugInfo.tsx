
import { useFormPermissions } from "@/hooks/useFormPermissions";
import { Form, FormField } from "@/types/form";

interface FormFieldsDebugInfoProps {
  formData: Partial<Form>;
  fieldsArray: FormField[];
}

const FormFieldsDebugInfo = ({ formData, fieldsArray }: FormFieldsDebugInfoProps) => {
  const { getPermissionSummary, canEditForm } = useFormPermissions();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const permissionSummary = formData.id ? getPermissionSummary(formData.id) : null;
  const canEdit = canEditForm(formData as Form);

  if (!permissionSummary) {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
      <strong>Debug Info:</strong><br />
      Can Edit: {canEdit ? 'Yes' : 'No'}<br />
      Role: {permissionSummary.role}<br />
      Owner: {permissionSummary.debugInfo.formOwner}<br />
      Collaborators: {JSON.stringify(permissionSummary.debugInfo.collaborators)}<br />
      Current User: {permissionSummary.userEmail}<br />
      Fields Count: {fieldsArray.length}<br />
      Fields: {JSON.stringify(fieldsArray.map(f => ({ id: f.id, type: f.type })))}
    </div>
  );
};

export default FormFieldsDebugInfo;
