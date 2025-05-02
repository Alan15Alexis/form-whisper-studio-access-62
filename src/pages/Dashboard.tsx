import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/contexts/FormContext";
import { useLocation } from "react-router-dom";
import DashboardUser from "./DashboardUser";
import DashboardAdmin from "./DashboardAdmin";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { forms, isUserAllowed } = useForm();
  const location = useLocation();

  // Leer el parámetro de consulta "role"
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get("role");

  const [hiddenForms, setHiddenForms] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (currentUser?.id) {
      const stored = localStorage.getItem(`hiddenForms:${currentUser.id}`);
      setHiddenForms(stored ? JSON.parse(stored) : []);
    }
  }, [currentUser?.id]);

  const hideForm = (formId: string) => {
    const updated = [...hiddenForms, formId];
    setHiddenForms(updated);
    if (currentUser?.id) {
      localStorage.setItem(`hiddenForms:${currentUser.id}`, JSON.stringify(updated));
    }
  };

  const userForms = forms.filter(form => form.ownerId === currentUser?.id);

  const assignedForms = forms.filter(
    form =>
      form.isPrivate &&
      currentUser?.email &&
      isUserAllowed(form.id, currentUser.email) &&
      form.ownerId !== currentUser.id &&
      !hiddenForms.includes(form.id)
  );

  return role === "admin" ? (
    <DashboardAdmin userForms={userForms} currentUser={currentUser} />
  ) : (
    <DashboardUser assignedForms={assignedForms} hideForm={hideForm} currentUser={currentUser} />
  );
};

export default Dashboard;
