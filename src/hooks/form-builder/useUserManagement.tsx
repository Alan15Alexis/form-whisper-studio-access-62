
import { useCallback } from 'react';
import { toast } from '@/hooks/toast';
import { addInvitedUser } from '@/integrations/supabase/client';

interface UseUserManagementProps {
  formData: any;
  updateFormData: (updater: (prev: any) => any) => void;
  allowedUserEmail: string;
  allowedUserName: string;
  setAllowedUserEmail: (email: string) => void;
  setAllowedUserName: (name: string) => void;
}

export const useUserManagement = ({
  formData,
  updateFormData,
  allowedUserEmail,
  allowedUserName,
  setAllowedUserEmail,
  setAllowedUserName
}: UseUserManagementProps) => {
  const addAllowedUser = useCallback(async () => {
    if (!allowedUserEmail || !allowedUserName) {
      toast({
        title: "Error",
        description: "Por favor, introduce tanto el nombre como el correo electrónico",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(allowedUserEmail)) {
      toast({
        title: "Error",
        description: "Por favor, introduce un correo electrónico válido",
        variant: "destructive",
      });
      return;
    }

    const lowerCaseEmail = allowedUserEmail.toLowerCase();

    if (formData.allowedUsers?.includes(lowerCaseEmail)) {
      toast({
        title: "Usuario ya añadido",
        description: "Este usuario ya tiene acceso a este formulario",
        variant: "destructive",
      });
      return;
    }

    try {
      const newInvitedUser = await addInvitedUser(allowedUserName, lowerCaseEmail);
      
      if (newInvitedUser) {
        updateFormData(prev => ({
          ...prev,
          allowedUsers: [...(prev.allowedUsers || []), lowerCaseEmail],
        }));
        
        setAllowedUserEmail('');
        setAllowedUserName('');
        
        toast({
          title: "Usuario añadido",
          description: `${allowedUserName} (${lowerCaseEmail}) ha sido añadido al formulario`,
        });
      }
    } catch (error) {
      console.error('Error adding invited user:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el usuario. Por favor, inténtalo de nuevo",
        variant: "destructive",
      });
    }
  }, [allowedUserEmail, allowedUserName, formData.allowedUsers, updateFormData, setAllowedUserEmail, setAllowedUserName]);

  const removeAllowedUser = useCallback((email: string) => {
    updateFormData(prev => ({
      ...prev,
      allowedUsers: (prev.allowedUsers || []).filter(user => user !== email),
    }));
  }, [updateFormData]);

  return {
    addAllowedUser,
    removeAllowedUser
  };
};
