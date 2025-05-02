import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { FileText, CheckCircle, Lock, ArrowRight, Users, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useForm } from "@/contexts/FormContext";
import AssignedForms from "./AssignedForms";

const features = [
  {
    icon: <FileText className="h-10 w-10 text-primary" />,
    title: "Generador de formularios dinámicos",
    description: "Cree formularios con una amplia gama de tipos de campos y opciones de personalización."
  },
  {
    icon: <Lock className="h-10 w-10 text-primary" />,
    title: "Formularios Privados",
    description: "Controle quién puede acceder y enviar sus formularios con permisos específicos del usuario."
  },
  {
    icon: <CheckCircle className="h-10 w-10 text-primary" />,
    title: "Gestión de respuestas",
    description: "Vea, administre y exporte todos los envíos de formularios en un panel centralizado."
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Control de acceso de usuarios",
    description: "Concede o revoca el acceso a usuarios específicos y crea enlaces privados que se puedan compartir."
  }
];

const Index = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { forms, isUserAllowed } = useForm();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  
  // Default form to check against (first form in the list)
  const defaultFormId = forms.length > 0 ? forms[0].id : "1";
  
  const handleContinue = () => {
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un correo electrónico válido",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);

    // Validar el correo electrónico contra los usuarios permitidos para el formulario predeterminado
    setTimeout(() => {
      const allowed = isUserAllowed(defaultFormId, email);

      if (allowed) {
        toast({
          title: "Acceso concedido",
          description: "Redirigiendo al dashboard...",
        });

        // Redirigir según el rol del usuario
        if (isAuthenticated && !isAdmin) {
          navigate('/AssignedForms'); // Redirigir al dashboard de usuario
        } else if (isAuthenticated && isAdmin) {
          navigate('/dashboard'); // Redirigir al dashboard de administrador
        }
      } else {
        toast({
          title: "Acceso denegado",
          description: "Tu correo no está autorizado para acceder a este formulario",
          variant: "destructive",
        });
      }

      setIsValidating(false);
    }, 800);
  };
  
  return (
    <Layout hideNav>
      {/* Custom Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <a href="https://beed.studio" target="_blank" rel="noopener noreferrer">
              <img 
                src="/lovable-uploads/90fe245b-54ef-4362-85ea-387a90015ebb.png" 
                alt="Beed" 
                className="h-8" 
                width="192" 
                height="32"
              />
            </a>
          </div>
          <div>
            <Link to="/login">
              <Button variant="ghost" className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                <span className="hidden sm:inline">Admin Login</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 min-h-screen flex flex-col items-center justify-center">
        <div className="container mx-auto px-4 flex-1 flex flex-col items-center justify-center">
          {/* Added minimalist title */}
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Construye Formularios <br />
              <span className="text-primary">Simplicado</span>
            </h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-lg border border-gray-100">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Responder formulario</CardTitle>
                <CardDescription>Por favor ingresa tu correo para continuar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-2 space-y-4">
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                  />
                  <Button 
                    className="w-full" 
                    onClick={handleContinue}
                    disabled={isValidating}
                  >
                    {isValidating ? "Validando..." : "Continuar"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Features Section (kept from original) */}
        <div className="bg-gray-50 py-16 w-full">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Potentes funciones</h2>
              <p className="text-gray-600 mt-2">Todo lo que necesitas para crear y gestionar formularios</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
