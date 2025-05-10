
import React from "react";
import Layout from "@/components/Layout";
import { useAssignedForms } from "@/hooks/useAssignedForms";
import LoadingSpinner from "@/components/assigned-forms/LoadingSpinner";
import FormsTabs from "@/components/assigned-forms/FormsTabs";

const AssignedForms = () => {
  const { currentUser, loading, pendingForms, completedForms, formStatus, hideForm } = useAssignedForms();

  return (
    <Layout title="Formularios Asignados">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">
          Bienvenido, {currentUser?.name || currentUser?.email || localStorage.getItem('userEmail') || "Usuario"}
        </h2>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FormsTabs 
          pendingForms={pendingForms}
          completedForms={completedForms}
          formStatus={formStatus}
          onHideForm={hideForm}
        />
      )}
    </Layout>
  );
};

export default AssignedForms;
