
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/contexts/form";
import { Form } from "@/types/form";

export const useFormPermissions = () => {
  const { currentUser } = useAuth();
  const { canUserEditForm, getForm } = useForm();

  const canEditForm = (form: Form | undefined): boolean => {
    if (!form || !currentUser?.email) {
      console.log("useFormPermissions - Cannot edit: no form or user", {
        hasForm: !!form,
        hasUser: !!currentUser?.email,
        userEmail: currentUser?.email
      });
      return false;
    }
    
    const userEmail = currentUser.email.toLowerCase();
    const isOwner = form.ownerId === userEmail;
    const isCollaborator = form.collaborators?.includes(userEmail) || false;
    
    console.log("useFormPermissions - Permission check:", {
      formId: form.id,
      formTitle: form.title,
      userEmail,
      formOwnerId: form.ownerId,
      formCollaborators: form.collaborators,
      isOwner,
      isCollaborator,
      canEdit: isOwner || isCollaborator
    });
    
    return isOwner || isCollaborator;
  };

  const canEditFormById = (formId: string): boolean => {
    const form = getForm(formId);
    if (!form) {
      console.log("useFormPermissions - Form not found for ID:", formId);
      return false;
    }
    
    const canEdit = canEditForm(form);
    console.log("useFormPermissions - canEditFormById result:", {
      formId,
      canEdit,
      reason: canEdit ? "Has permission" : "No permission"
    });
    
    return canEdit;
  };

  const getUserRole = (form: Form | undefined): 'owner' | 'collaborator' | 'viewer' | null => {
    if (!form || !currentUser?.email) return null;
    
    const userEmail = currentUser.email.toLowerCase();
    
    if (form.ownerId === userEmail) return 'owner';
    if (form.collaborators?.includes(userEmail)) return 'collaborator';
    
    return 'viewer';
  };

  const getPermissionSummary = (formId: string) => {
    const form = getForm(formId);
    const role = getUserRole(form);
    const canEdit = canEditForm(form);
    
    return {
      form,
      role,
      canEdit,
      userEmail: currentUser?.email,
      isAuthenticated: !!currentUser,
      debugInfo: {
        formOwner: form?.ownerId,
        collaborators: form?.collaborators || [],
        collaboratorCount: form?.collaborators?.length || 0
      }
    };
  };

  return {
    canEditForm,
    canEditFormById,
    getUserRole,
    getPermissionSummary,
    currentUser
  };
};
