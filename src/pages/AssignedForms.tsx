
import { useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/contexts/FormContext";
import FormCard from "@/components/FormCard";

const AssignedForms = () => {
  const { currentUser } = useAuth();
  const { forms } = useForm();
  
  // Filtrar formularios asignados al usuario actual por email
  const assignedForms = forms.filter(form => 
    form.isPrivate && 
    currentUser?.email && 
    form.allowedUsers.includes(currentUser.email)
  );
  
  // Simulación de respuestas - en una app real, esto vendría de una base de datos
  const hasResponded = (formId: string) => {
    return false; // Por ahora siempre retorna false
  };

  return (
    <Layout title="Dashboard">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">
          Welcome, {currentUser?.name || currentUser?.email}
        </h2>
      </div>

      {assignedForms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedForms.map(form => (
            <FormCard 
              key={form.id} 
              form={form} 
              hasResponded={hasResponded(form.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No forms assigned</h3>
          <p className="text-gray-500">
            You don't have any forms assigned to you yet. The admin will assign forms to your email when they're ready.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default AssignedForms;
