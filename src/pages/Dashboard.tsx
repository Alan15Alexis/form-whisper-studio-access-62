
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the current URL is already dashboard-admin and user is admin
    // If so, don't redirect to avoid refresh loops
    const isCurrentlyOnAdminDashboard = window.location.pathname === "/dashboard-admin";
    
    // Check if we have a stored email from the homepage flow
    const storedEmail = localStorage.getItem('userEmail');
    
    // If not authenticated but we have a stored email, go directly to assigned forms
    if (!isAuthenticated && storedEmail) {
      navigate("/assigned-forms");
      return;
    }
    
    // If not authenticated and no stored email, redirect to login
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    // If authenticated and admin, redirect to admin dashboard (unless already there)
    if (currentUser?.role === "admin") {
      if (!isCurrentlyOnAdminDashboard) {
        navigate("/dashboard-admin");
      }
      // If already on admin dashboard, don't navigate anywhere
      return;
    } 
    
    // If authenticated as regular user, redirect to assigned forms
    if (currentUser?.role === "user") {
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
