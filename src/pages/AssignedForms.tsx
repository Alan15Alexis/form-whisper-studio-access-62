
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/contexts/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssignedFormCard from "@/components/AssignedFormCard";
import { ClipboardList, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Form } from "@/types/form";
import { v4 as uuidv4 } from "uuid";

const AssignedForms = () => {
  const { currentUser } = useAuth();
  const { forms, isUserAllowed, getFormResponses, setForms, responses } = useForm();
  const [hiddenForms, setHiddenForms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedForms, setAssignedForms] = useState<Form[]>([]);

  // Load hidden forms from localStorage
  useEffect(() => {
    if(currentUser?.id) {
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
        
        console.log(`Fetching forms for user: ${userEmail}`);
        
        // Fix the contains query by converting the email to JSON string
        const { data, error } = await supabase
          .from('formulario_construccion')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Filter the data client-side instead of using the contains operation
          const filteredData = data.filter(form => {
            // Check if acceso is an array and contains the user email
            return Array.isArray(form.acceso) && form.acceso.includes(userEmail);
          });
          
          console.log(`Found ${filteredData.length} forms for user ${userEmail}`);
          
          // Map Supabase data to our app's Form type
          const mappedForms: Form[] = filteredData.map(form => ({
            id: form.id ? String(form.id) : uuidv4(),
            title: form.titulo || "Sin título",
            description: form.descripcion || "",
            fields: form.preguntas || [],
            isPrivate: form.configuracion?.isPrivate || false,
            allowedUsers: form.acceso || [],
            createdAt: form.created_at || new Date().toISOString(),
            updatedAt: form.created_at || new Date().toISOString(),
            accessLink: uuidv4(),
            ownerId: form.administrador || "0",
            enableScoring: form.configuracion?.enableScoring || false,
            formColor: form.configuracion?.formColor || "#686df3",
            allowViewOwnResponses: form.configuracion?.allowViewOwnResponses || false,
            allowEditOwnResponses: form.configuracion?.allowEditOwnResponses || false,
          }));
          
          // Update global form state and local state
          setAssignedForms(mappedForms);
          
          // If the forms aren't already in the global state, add them
          const formIdsMap = new Map(forms.map(f => [f.id, f]));
          const newForms = mappedForms.filter(f => !formIdsMap.has(f.id));
          
          if (newForms.length > 0) {
            setForms(prevForms => [...prevForms, ...newForms]);
          }
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
  }, [currentUser?.email, setForms, forms, responses]); // Added responses as a dependency

  const hideForm = (formId: string) => {
    const updated = [...hiddenForms, formId];
    setHiddenForms(updated);
    if(currentUser?.id) {
      localStorage.setItem(`hiddenForms:${currentUser.id}`, JSON.stringify(updated));
    }
  };

  // Filter out hidden forms
  const visibleForms = assignedForms.filter(form => !hiddenForms.includes(form.id));
  
  // Split forms into pending and completed
  const pendingForms = visibleForms.filter(form => getFormResponses(form.id).length === 0);
  const completedForms = visibleForms.filter(form => getFormResponses(form.id).length > 0);

  return (
    <Layout title="Formularios Asignados">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">
          Bienvenido, {currentUser?.name || currentUser?.email || localStorage.getItem('userEmail') || "Usuario"}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              <ClipboardList className="mr-2 h-4 w-4" />
              Formularios Pendientes ({pendingForms.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              <FileText className="mr-2 h-4 w-4" />
              Formularios Completados ({completedForms.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="animate-fadeIn">
            {pendingForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingForms.map(form => (
                  <AssignedFormCard key={form.id} form={form} onRemove={hideForm} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No hay formularios pendientes</h3>
                <p className="text-gray-500">
                  No tienes formularios pendientes por completar
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="animate-fadeIn">
            {completedForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedForms.map(form => (
                  <AssignedFormCard key={form.id} form={form} onRemove={hideForm} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No hay formularios completados</h3>
                <p className="text-gray-500">
                  Aún no has completado ningún formulario asignado
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </Layout>
  );
};

export default AssignedForms;
