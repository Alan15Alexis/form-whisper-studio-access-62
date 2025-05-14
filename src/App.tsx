
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FormProvider } from "./contexts/form";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AssignedForms from "./pages/AssignedForms";
import FormBuilder from "./pages/FormBuilder";
import FormView from "./pages/FormView";
import FormResponses from "./pages/FormResponses";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import DashboardAdmin from "./pages/DashboardAdmin";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FormProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard-admin" element={<PrivateRoute role="admin"><DashboardAdmin /></PrivateRoute>} />
              <Route path="/assigned-forms" element={<PrivateRoute><AssignedForms /></PrivateRoute>} />
              <Route path="/forms/new" element={<PrivateRoute role="admin"><FormBuilder /></PrivateRoute>} />
              <Route path="/forms/:id/edit" element={<PrivateRoute role="admin"><FormBuilder /></PrivateRoute>} />
              <Route path="/forms/:id/responses" element={<PrivateRoute role="admin"><FormResponses /></PrivateRoute>} />
              <Route path="/forms/:id" element={<FormView />} />
              <Route path="/forms/:id/access/:token" element={<FormView />} />
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
