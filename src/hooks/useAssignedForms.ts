
import { useState, useEffect } from 'react';
import { Form } from '@/types/form';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from '@/contexts/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/toast';
import { v4 as uuidv4 } from 'uuid';

export const useAssignedForms = () => {
  const { currentUser } = useAuth();
  const { forms, setForms, responses } = useForm();
  const [hiddenForms, setHiddenForms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedForms, setAssignedForms] = useState<Form[]>([]);
  const [formStatus, setFormStatus] = useState<Record<string, boolean>>({});

  // Load hidden forms from localStorage
  useEffect(() => {
    if (currentUser?.id) {
      const stored = localStorage.getItem(`hiddenForms:${currentUser.id}`);
      setHiddenForms(stored ? JSON.parse(stored) : []);
    }
  }, [currentUser?.id]);

  // Fetch forms and update when responses change
  useEffect(() => {
    const fetchAssignedForms = async () => {
      setLoading(true);
      try {
        const userEmail = currentUser?.email || localStorage.getItem('userEmail');
        
        if (!userEmail) {
          setLoading(false);
          return;
        }
        
        console.log(`Fetching assigned forms for user: ${userEmail}`);
        
        // Get all forms from the database
        const { data, error } = await supabase
          .from('formulario_construccion')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Filter the data client-side to find forms assigned to this user
          // Include both forms where user is in allowedUsers AND forms where user is a collaborator
          const filteredData = data.filter(form => {
            const isAssigned = Array.isArray(form.acceso) && form.acceso.includes(userEmail);
            
            // Check if user is a collaborator
            let isCollaborator = false;
            if (form.colaboradores) {
              let collaboratorsList: string[] = [];
              
              if (Array.isArray(form.colaboradores)) {
                collaboratorsList = form.colaboradores;
              } else if (typeof form.colaboradores === 'string') {
                try {
                  const parsed = JSON.parse(form.colaboradores);
                  if (Array.isArray(parsed)) {
                    collaboratorsList = parsed;
                  }
                } catch (e) {
                  console.warn('Error parsing collaborators JSON:', e);
                }
              }
              
              isCollaborator = collaboratorsList.includes(userEmail.toLowerCase());
            }
            
            return isAssigned || isCollaborator;
          });
          
          console.log(`Found ${filteredData.length} forms (assigned + collaborator) for user ${userEmail}`);
          
          // Map Supabase data to our app's Form type
          const mappedForms: Form[] = filteredData.map(form => ({
            id: form.id ? String(form.id) : uuidv4(),
            title: form.titulo || "Sin título",
            description: form.descripcion || "",
            fields: form.preguntas || [],
            isPrivate: form.configuracion?.isPrivate || false,
            allowedUsers: form.acceso || [],
            collaborators: Array.isArray(form.colaboradores) ? form.colaboradores : [],
            createdAt: form.created_at || new Date().toISOString(),
            updatedAt: form.created_at || new Date().toISOString(),
            accessLink: uuidv4(),
            ownerId: form.administrador || "0",
            enableScoring: form.configuracion?.enableScoring || false,
            formColor: form.configuracion?.formColor || "#686df3",
            allowViewOwnResponses: form.configuracion?.allowViewOwnResponses || false,
            allowEditOwnResponses: form.configuracion?.allowEditOwnResponses || false,
            showTotalScore: form.configuracion?.showTotalScore || false,
            scoreRanges: form.rangos_mensajes || []
          }));
          
          // Update global form state and local state
          setAssignedForms(mappedForms);
          
          // If the forms aren't already in the global state, add them
          const formIdsMap = new Map(forms.map(f => [f.id, f]));
          const newForms = mappedForms.filter(f => !formIdsMap.has(f.id));
          
          if (newForms.length > 0) {
            setForms(prevForms => [...prevForms, ...newForms]);
          }
          
          // Check the status of each form in the formulario table SPECIFICALLY FOR THIS USER
          await fetchFormCompletionStatus(mappedForms, userEmail);
        }
      } catch (error) {
        console.error("Error fetching assigned forms:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los formularios asignados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedForms();
  }, [currentUser?.email, setForms, forms, responses]);

  // Function to fetch form status specifically for the current user
  const fetchFormCompletionStatus = async (forms: Form[], userEmail: string) => {
    try {
      // Build a status map for all forms for this specific user
      const statusMap: Record<string, boolean> = {};

      // Get submissions from the 'formulario' table for this specific user
      const { data, error } = await supabase
        .from('formulario')
        .select('nombre_formulario, nombre_invitado, estatus')
        .eq('nombre_invitado', userEmail);

      if (error) {
        throw error;
      }

      console.log(`Found ${data?.length || 0} form submissions for user ${userEmail}`);

      // Map form titles to their status for this specific user
      if (data) {
        forms.forEach(form => {
          // Find if this specific user has a submission with status=true for this form
          const submission = data.find(sub => 
            sub.nombre_formulario === form.title && 
            sub.nombre_invitado === userEmail && 
            sub.estatus === true
          );
          
          // Set the status in our map based on this user's submissions
          statusMap[form.id] = !!submission;
        });
      }

      console.log("User-specific form completion status map:", statusMap);
      setFormStatus(statusMap);
    } catch (error) {
      console.error("Error fetching form completion status:", error);
    }
  };

  const hideForm = (formId: string) => {
    const updated = [...hiddenForms, formId];
    setHiddenForms(updated);
    if (currentUser?.id) {
      localStorage.setItem(`hiddenForms:${currentUser.id}`, JSON.stringify(updated));
    }
  };

  // Filter out hidden forms and separate assigned vs collaborator forms
  const visibleForms = assignedForms.filter(form => !hiddenForms.includes(form.id));
  
  // Split into assigned forms (where user is in allowedUsers) and collaborator forms
  const userEmail = currentUser?.email?.toLowerCase();
  const assignedOnly = visibleForms.filter(form => 
    form.allowedUsers.map(u => u.toLowerCase()).includes(userEmail || '') && 
    !form.collaborators.map(c => c.toLowerCase()).includes(userEmail || '')
  );
  const collaboratorOnly = visibleForms.filter(form => 
    form.collaborators.map(c => c.toLowerCase()).includes(userEmail || '')
  );
  
  // Split forms into pending and completed based on the user-specific status map
  const pendingForms = assignedOnly.filter(form => !formStatus[form.id]);
  const completedForms = assignedOnly.filter(form => formStatus[form.id]);

  return {
    loading,
    pendingForms,
    completedForms,
    collaboratorForms: collaboratorOnly,
    formStatus,
    hideForm,
    currentUser
  };
};
