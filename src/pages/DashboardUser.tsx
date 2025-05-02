
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useForm } from "@/contexts/FormContext";
import { useAuth } from "@/contexts/AuthContext";
import AssignedFormCard from "@/components/AssignedFormCard";

const DashboardUser = () => {
  const { forms, removeAllowedUser } = useForm();
  const { currentUser, isAuthenticated } = useAuth();
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

  return (
    <Layout title="Mis Formularios Asignados">
      <div className="mb-6">
        <h2 className="text-lg text-gray-600">
          Bienvenido, {currentUser?.name || currentUser?.email || "Usuario"}. Aquí están los formularios asignados a ti.
        </h2>
      </div>
      
      {userAssignedForms && userAssignedForms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userAssignedForms.map(form => (
            <AssignedFormCard 
              key={form.id} 
              form={form} 
              onRemove={handleHideForm} 
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
    </Layout>
  );
};

export default DashboardUser;
