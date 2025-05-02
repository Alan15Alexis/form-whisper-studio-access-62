
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/contexts/FormContext";
import { useNavigate } from "react-router-dom";
import DashboardUser from "./DashboardUser";
import DashboardAdmin from "./DashboardAdmin";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { forms, isUserAllowed } = useForm();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect based on user role
    if (currentUser?.role === "admin") {
      navigate("/dashboard-admin");
    } else if (currentUser?.role === "user") {
      navigate("/dashboard-user");
    }
  }, [currentUser, navigate]);

  // This component will just handle redirection and won't render much
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
};

export default Dashboard;
