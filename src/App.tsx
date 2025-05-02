
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FormProvider } from "./contexts/FormContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AssignedForms from "./pages/AssignedForms";
import FormBuilder from "./pages/FormBuilder";
import FormView from "./pages/FormView";
import FormResponses from "./pages/FormResponses";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import DashboardUser from "./pages/DashboardUser";
import DashboardAdmin from "./pages/DashboardAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FormProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/assigned-forms" element={<PrivateRoute><AssignedForms /></PrivateRoute>} />
              <Route path="/forms/new" element={<PrivateRoute><FormBuilder /></PrivateRoute>} />
              <Route path="/forms/:id/edit" element={<PrivateRoute><FormBuilder /></PrivateRoute>} />
              <Route path="/forms/:id/responses" element={<PrivateRoute><FormResponses /></PrivateRoute>} />
              <Route path="/forms/:id" element={<FormView />} />
              <Route path="/forms/:id/access/:token" element={<FormView />} />
              <Route path="/dashboard-user" element={<PrivateRoute><DashboardUser assignedForms={undefined} hideForm={undefined} currentUser={undefined} /></PrivateRoute>} />
              <Route path="/dashboard-admin" element={<DashboardAdmin userForms={undefined} currentUser={undefined} />} />
              <Route path="/users" element={<PrivateRoute role="admin"><UserManagement /></PrivateRoute>} />
              <Route path="*" element={<NotFound />} />
              
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </FormProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
