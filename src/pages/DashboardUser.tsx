import React from "react";
import Layout from "@/components/Layout";
import AssignedFormCard from "@/components/AssignedFormCard";

const DashboardUser = ({ assignedForms, hideForm, currentUser }) => {
  return (
    <Layout title="Tus Formularios">
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-medium mb-6">
            Bienvenido, {currentUser?.name || currentUser?.email}
          </h2>
          <h3 className="text-lg font-medium mb-4">Formularios asignados para ti</h3>
          {assignedForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedForms.map(form => (
                <AssignedFormCard key={form.id} form={form} onRemove={hideForm} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No tienes formularios asignados.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardUser;