
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/contexts/form";
import { Form } from "@/types/form";

export const useFormPermissions = () => {
  const { currentUser } = useAuth();
  const { canUserEditForm } = useForm();

  const canEditForm = (form: Form | undefined): boolean => {
    if (!form || !currentUser?.email) return false;
    
    // User is the owner
    if (form.ownerId === currentUser.email) return true;
    
    // User is a collaborator
    if (form.collaborators?.includes(currentUser.email.toLowerCase())) return true;
    
    return false;
  };

  const canEditFormById = (formId: string): boolean => {
    return canUserEditForm(formId);
  };

  const getUserRole = (form: Form | undefined): 'owner' | 'collaborator' | 'viewer' | null => {
    if (!form || !currentUser?.email) return null;
    
    if (form.ownerId === currentUser.email) return 'owner';
    if (form.collaborators?.includes(currentUser.email.toLowerCase())) return 'collaborator';
    
    return 'viewer';
  };

  return {
    canEditForm,
    canEditFormById,
    getUserRole,
    currentUser
  };
};
