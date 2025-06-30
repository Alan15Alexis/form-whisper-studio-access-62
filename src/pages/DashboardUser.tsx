
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useForm } from "@/contexts/form";
import { useAuth } from "@/contexts/AuthContext";
import { useCollaboratorForms } from "@/hooks/useCollaboratorForms";
import AssignedFormCard from "@/components/AssignedFormCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Users } from "lucide-react";

const DashboardUser = () => {
  const { forms, removeAllowedUser } = useForm();
  const { currentUser, isAuthenticated } = useAuth();
  const { loading: collaboratorLoading, collaboratorForms } = useCollaboratorForms();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Si el usuario no está autenticado, redirigir al inicio
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  // Get assigned forms for the user by filtering all forms where the user is allowed
  const userAssignedForms = forms.filter(form => 
    form.isPrivate && 
    currentUser?.email && 
    form.allowedUsers.includes(currentUser.email)
  );
  
  // Función para ocultar un formulario (quitar el usuario de la lista de usuarios permitidos)
  const handleHideForm = (formId: string) => {
    if (currentUser?.email) {
      removeAllowedUser(formId, currentUser.email);
    }
  };

  const isLoading = collaboratorLoading;

  return (
    <Layout title="Mis Formularios">
      <div className="mb-6">
        <h2 className="text-lg text-gray-600">
          Bienvenido, {currentUser?.name || currentUser?.email || "Usuario"}. Aquí están tus formularios.
        </h2>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-500">
            Cargando formularios...
          </div>
        </div>
      ) : (
        <Tabs defaultValue="assigned" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="assigned">
              <ClipboardList className="mr-2 h-4 w-4" />
              Formularios Asignados ({userAssignedForms.length})
            </TabsTrigger>
            <TabsTrigger value="collaborator">
              <Users className="mr-2 h-4 w-4" />
              Como Colaborador ({collaboratorForms.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned" className="animate-fadeIn">
            {userAssignedForms && userAssignedForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userAssignedForms.map(form => (
                  <AssignedFormCard 
                    key={form.id} 
                    form={form} 
                    onRemove={handleHideForm}
                    isCollaborator={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <p className="text-xl text-gray-500 mb-2">No tienes formularios asignados</p>
                <p className="text-gray-400">
                  Un administrador debe darte acceso a formularios.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="collaborator" className="animate-fadeIn">
            {collaboratorForms && collaboratorForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaboratorForms.map(form => (
                  <AssignedFormCard 
                    key={form.id} 
                    form={form} 
                    onRemove={() => {}} // No remove option for collaborator forms
                    isCollaborator={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <p className="text-xl text-gray-500 mb-2">No eres colaborador de ningún formulario</p>
                <p className="text-gray-400">
                  Un administrador debe añadirte como colaborador en sus formularios.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </Layout>
  );
};

export default DashboardUser;
