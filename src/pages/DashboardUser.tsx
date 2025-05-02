
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useForm } from "@/contexts/FormContext";
import { useAuth } from "@/contexts/AuthContext";
import AssignedFormCard from "@/components/AssignedFormCard";

interface DashboardUserProps {
  assignedForms?: any[];
  hideForm?: (formId: string) => void;
  currentUser?: any;
}

const DashboardUser = ({ assignedForms: propAssignedForms, hideForm: propHideForm, currentUser: propCurrentUser }: DashboardUserProps) => {
  const { getAssignedForms, hideFormForUser } = useForm();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Si el usuario no está autenticado, redirigir al inicio
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Usar props si se proporcionan, de lo contrario usar contexto
  const user = propCurrentUser || currentUser;
  const assignedForms = propAssignedForms || getAssignedForms(user?.email);
  const hideForm = propHideForm || hideFormForUser;

  const handleHideForm = (formId: string) => {
    if (user?.email) {
      hideForm(user.email, formId);
    }
  };

  return (
    <Layout title="Mis Formularios Asignados">
      <div className="mb-6">
        <h2 className="text-lg text-gray-600">
          Bienvenido, {user?.name || user?.email || "Usuario"}. Aquí están los formularios asignados a ti.
        </h2>
      </div>
      
      {assignedForms && assignedForms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedForms.map(form => (
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
