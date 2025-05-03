
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    // If authenticated, redirect based on user role
    if (currentUser?.role === "admin") {
      navigate("/dashboard-admin");
    } else if (currentUser?.role === "user") {
      navigate("/assigned-forms");
    }
  }, [currentUser, navigate, isAuthenticated]);

  // This component will just handle redirection and won't render much
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
};

export default Dashboard;
