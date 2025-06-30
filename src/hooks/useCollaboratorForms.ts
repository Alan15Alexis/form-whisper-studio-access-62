
import { useState, useEffect } from 'react';
import { Form } from '@/types/form';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from '@/contexts/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/toast';
import { v4 as uuidv4 } from 'uuid';

export const useCollaboratorForms = () => {
  const { currentUser } = useAuth();
  const { forms, setForms } = useForm();
  const [loading, setLoading] = useState(true);
  const [collaboratorForms, setCollaboratorForms] = useState<Form[]>([]);

  // Fetch forms where the current user is a collaborator
  useEffect(() => {
    const fetchCollaboratorForms = async () => {
      setLoading(true);
      
      if (!currentUser?.email) {
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching collaborator forms for user: ${currentUser.email}`);
        
        // Get all forms from the database
        const { data, error } = await supabase
          .from('formulario_construccion')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Filter forms where the current user is a collaborator
          const filteredData = data.filter(form => {
            if (!form.colaboradores) return false;
            
            let collaboratorsList: string[] = [];
            
            // Handle different data formats for collaborators
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
            
            return collaboratorsList.includes(currentUser.email?.toLowerCase() || '');
          });
          
          console.log(`Found ${filteredData.length} collaborator forms for user ${currentUser.email}`);
          
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
            formColor: form.configuracion?.formColor || "#686df3",
            allowViewOwnResponses: form.configuracion?.allowViewOwnResponses || false,
            allowEditOwnResponses: form.configuracion?.allowEditOwnResponses || false,
            showTotalScore: form.configuracion?.showTotalScore || false,
            scoreRanges: form.rangos_mensajes || []
          }));
          
          setCollaboratorForms(mappedForms);
          
          // Update global form state if these forms aren't already there
          const formIdsMap = new Map(forms.map(f => [f.id, f]));
          const newForms = mappedForms.filter(f => !formIdsMap.has(f.id));
          
          if (newForms.length > 0) {
            setForms(prevForms => [...prevForms, ...newForms]);
          }
        }
      } catch (error) {
        console.error("Error fetching collaborator forms:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los formularios donde eres colaborador",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCollaboratorForms();
  }, [currentUser?.email, setForms, forms]);

  return {
    loading,
    collaboratorForms,
    currentUser
  };
};
