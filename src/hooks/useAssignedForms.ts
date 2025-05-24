import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "@/contexts/form/FormContext";
import { Form } from "@/types/form";

/**
 * Custom hook to fetch assigned forms for a user
 */
export function useAssignedForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdmin } = useAuth();
  const { getForm } = useForm();

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          // If the user is an admin, fetch all forms
          const { data: formsData, error } = await supabase
            .from('forms')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error("Error fetching forms:", error);
            return;
          }

          if (formsData) {
            // Load forms from local storage if they exist, otherwise use the fetched forms
            const storedForms = localStorage.getItem('forms');
            const initialForms = storedForms ? JSON.parse(storedForms) : formsData;
            setForms(initialForms);
          }
        } else if (currentUser) {
          // If the user is not an admin, fetch only assigned forms
          const { data: formsData, error } = await supabase
            .from('forms')
            .select('*')
            .contains('allowedUsers', [currentUser.email])
            .order('created_at', { ascending: false });

          if (error) {
            console.error("Error fetching assigned forms:", error);
            return;
          }

          if (formsData) {
            // Load forms from local storage if they exist, otherwise use the fetched forms
            const storedForms = localStorage.getItem('forms');
            const initialForms = storedForms ? JSON.parse(storedForms) : formsData;
            setForms(initialForms);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [currentUser, isAdmin, getForm]);

  return { forms, loading };
}

