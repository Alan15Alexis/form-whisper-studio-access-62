
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { LockKeyhole, Mail, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface FormAccessProps {
  onAccessGranted: () => void;
  isUserAllowed: (email: string) => boolean;
}

const FormAccess = ({ onAccessGranted, isUserAllowed }: FormAccessProps) => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [accessEmail, setAccessEmail] = useState("");
  const [validatingAccess, setValidatingAccess] = useState(false);

  const handleAccessRequest = async () => {
    // Si el usuario está autenticado, usar su email
    const emailToCheck = isAuthenticated && currentUser?.email ? currentUser.email : accessEmail.trim();
    
    if (!emailToCheck) {
      toast({
        title: "Error",
        description: "Por favor, introduce tu correo electrónico",
        variant: "destructive",
      });
      return;
    }

    setValidatingAccess(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const hasAccess = isUserAllowed(emailToCheck);
      
      if (hasAccess) {
        toast({
          title: "Acceso Concedido",
          description: "Tu correo electrónico ha sido verificado. Tienes acceso a este formulario.",
        });
        onAccessGranted();
      } else {
        toast({
          title: "Acceso Denegado",
          description: "Tu correo electrónico no está en la lista de usuarios permitidos para este formulario.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al verificar tu acceso.",
        variant: "destructive", 
      });
    } finally {
      setValidatingAccess(false);
    }
  };

  // Si el usuario está autenticado, mostrar su email automáticamente
  if (isAuthenticated && currentUser?.email && !accessEmail) {
    setAccessEmail(currentUser.email);
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-md shadow-md border border-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-xl">
            <LockKeyhole className="mr-2 h-5 w-5 text-amber-500" />
            Formulario Privado
          </CardTitle>
          <CardDescription className="text-base">
            Este formulario requiere verificación de acceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <Alert className="bg-amber-50 border-amber-200">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-700 font-medium">Verificación requerida</AlertTitle>
              <AlertDescription className="text-amber-700">
                Este formulario está restringido a usuarios autorizados. Por favor, introduce tu correo electrónico para verificar si tienes acceso.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Label htmlFor="access-email" className="text-gray-700">Tu Correo Electrónico</Label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="access-email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={accessEmail}
                    onChange={(e) => setAccessEmail(e.target.value)}
                    className="pl-10"
                    disabled={isAuthenticated && currentUser?.email ? true : false}
                  />
                </div>
                <Button 
                  onClick={handleAccessRequest} 
                  disabled={validatingAccess || !accessEmail.trim()}
                  className="btn-primary"
                >
                  {validatingAccess ? "Verificando..." : "Verificar Acceso"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={() => navigate('/')} className="btn-minimal btn-outline">
            Volver al inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FormAccess;
