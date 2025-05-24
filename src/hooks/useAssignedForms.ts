
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/contexts/form";
import { Form } from "@/types/form";
import { supabase } from "@/integrations/supabase/client";

export function useAssignedForms() {
  const { currentUser } = useAuth();
  const { forms, removeAllowedUser } = useForm();
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState<Record<string, boolean>>({});

  // Get user's email from various sources
  const userEmail = currentUser?.email || localStorage.getItem('userEmail');

  // Filter forms assigned to the current user
  const userAssignedForms = forms.filter(form => 
    form.isPrivate && 
    userEmail && 
    form.allowedUsers.includes(userEmail)
  );

  // Check completion status for each form
  useEffect(() => {
    const checkFormStatus = async () => {
      if (!userEmail || userAssignedForms.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const statusMap: Record<string, boolean> = {};
        
        for (const form of userAssignedForms) {
          // Check if user has completed this form in Supabase
          const { data } = await supabase
            .from('formulario')
            .select('id')
            .eq('nombre_formulario', form.title)
            .eq('nombre_invitado', userEmail)
            .eq('estatus', true)
            .maybeSingle();
            
          statusMap[form.id] = !!data;
        }
        
        setFormStatus(statusMap);
      } catch (error) {
        console.error('Error checking form status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFormStatus();
  }, [userEmail, userAssignedForms.length]);

  // Separate forms into pending and completed
  const pendingForms = userAssignedForms.filter(form => !formStatus[form.id]);
  const completedForms = userAssignedForms.filter(form => formStatus[form.id]);

  // Function to hide a form (remove user from allowed users)
  const hideForm = (formId: string) => {
    if (userEmail) {
      removeAllowedUser(formId, userEmail);
    }
  };

  return {
    currentUser,
    loading,
    pendingForms,
    completedForms,
    formStatus,
    hideForm
  };
}
