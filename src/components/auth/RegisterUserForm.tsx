
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, User, Mail, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addInvitedUser } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const RegisterUserForm = ({ onSuccessRegister }: { onSuccessRegister: () => void }) => {
  const [userRegisterName, setUserRegisterName] = useState("");
  const [userRegisterEmail, setUserRegisterEmail] = useState("");
  const [isUserRegistering, setIsUserRegistering] = useState(false);
  const [userRegisterError, setUserRegisterError] = useState("");

  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserRegisterError("");
    setIsUserRegistering(true);
    
    if (!userRegisterName || !userRegisterEmail) {
      setUserRegisterError("Todos los campos son obligatorios");
      setIsUserRegistering(false);
      return;
    }
    
    try {
      // Register invited user
      await addInvitedUser(userRegisterName, userRegisterEmail);
      
      toast({
        title: "Usuario registrado",
        description: "El usuario ha sido registrado correctamente. Ahora puede acceder al sistema.",
      });
      
      // Reset form and switch to login tab
      setUserRegisterName("");
      setUserRegisterEmail("");
      onSuccessRegister();
      
    } catch (error) {
      console.error("User registration error:", error);
      setUserRegisterError("Se produjo un error al registrar el usuario invitado.");
    } finally {
      setIsUserRegistering(false);
    }
  };

  return (
    <form onSubmit={handleUserRegister} className="space-y-4">
      {userRegisterError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{userRegisterError}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="userRegisterName">Nombre del usuario</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="userRegisterName"
            type="text"
            placeholder="Nombre del usuario"
            className="pl-10"
            value={userRegisterName}
            onChange={(e) => setUserRegisterName(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="userRegisterEmail">Correo electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="userRegisterEmail"
            type="email"
            placeholder="usuario@example.com"
            className="pl-10"
            value={userRegisterEmail}
            onChange={(e) => setUserRegisterEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-[#686df3] hover:bg-[#575ce2]" 
        disabled={isUserRegistering}
      >
        {isUserRegistering ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Registrando...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <UserPlus className="mr-2 h-4 w-4" /> Registrar usuario invitado
          </span>
        )}
      </Button>
    </form>
  );
};

export default RegisterUserForm;
