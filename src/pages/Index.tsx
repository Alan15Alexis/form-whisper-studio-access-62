
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "@/hooks/toast";
import { useForm } from "@/contexts/form";
import { authenticateInvitedUser, validateInvitedUser } from "@/integrations/supabase/client";

const Index = () => {
  const {
    isAuthenticated,
    isAdmin,
    login
  } = useAuth();
  const {
    forms,
    isUserAllowed
  } = useForm();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Default form to check against (first form in the list)
  const defaultFormId = forms.length > 0 ? forms[0].id : "1";

  const handleContinue = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un correo electrónico válido",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    try {
      // Check if user is in the invited users table - this is the primary validation
      const isInvited = await validateInvitedUser(email);

      // Log detailed information for debugging
      console.log("Access validation results:", {
        email,
        isInvitedUser: isInvited,
        standardAccessCheck: isUserAllowed(defaultFormId, email)
      });

      if (isInvited) {
        toast({
          title: "Acceso concedido",
          description: "Redirigiendo a formularios asignados..."
        });

        // Use authenticateInvitedUser instead of login to get the user data properly
        const userData = await authenticateInvitedUser(email);
        
        if (userData) {
          // Directly set the user in localStorage to bypass authentication issues
          localStorage.setItem('currentUser', JSON.stringify(userData));
          
          // Also store email separately for easier access
          localStorage.setItem('userEmail', email);
          
          // Force immediate navigation to Assigned Forms page
          window.location.href = '/assigned-forms';
        } else {
          toast({
            title: "Error de autenticación",
            description: "No se pudo iniciar sesión con el correo proporcionado",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Acceso denegado",
          description: "Tu correo no está registrado en nuestra lista de usuarios invitados",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error validating access:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al verificar el acceso",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleAdminLogin = () => {
    // Navigate to login with state to force showing login page
    navigate('/login', { state: { forceLogin: true } });
  };

  return <Layout hideNav>
      {/* Custom Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <a href="https://beed.studio" target="_blank" rel="noopener noreferrer">
              <img src="/lovable-uploads/90fe245b-54ef-4362-85ea-387a90015ebb.png" alt="Beed" className="h-8" width="192" height="32" />
            </a>
          </div>
          <div>
            <Button variant="ghost" className="flex items-center gap-2" onClick={handleAdminLogin}>
              <LogIn className="h-5 w-5" />
              <span className="hidden sm:inline">Admin Login</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 min-h-screen flex flex-col items-center justify-center">
        <div className="container mx-auto px-4 flex-1 flex flex-col items-center justify-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="w-full max-w-md">
            <Card className="shadow-lg border border-gray-100">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-slate-950">¡Responde ahora mismo!</CardTitle>
                <CardDescription>Por favor ingresa tu correo para continuar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-2 space-y-4">
                  <Input type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full" />
                  <Button className="w-full" onClick={handleContinue} disabled={isValidating}>
                    {isValidating ? "Validando..." : "Continuar"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>;
};

export default Index;
