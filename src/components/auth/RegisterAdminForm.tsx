
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, User, Mail, KeyRound, UserPlus, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const RegisterAdminForm = () => {
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setIsRegistering(true);
    
    if (!registerName || !registerEmail || !registerPassword) {
      setRegisterError("Todos los campos son obligatorios");
      setIsRegistering(false);
      return;
    }
    
    try {
      await register({
        email: registerEmail,
        password: registerPassword,
        name: registerName,
        role: "admin"
      });
      
      // Show success message
      setRegistrationSuccess(true);
      
      // Reset form
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError("Se produjo un error al registrar la cuenta.");
    } finally {
      setIsRegistering(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-700">¡Registro exitoso!</h3>
          <p className="text-sm text-gray-600 mt-2">
            Tu cuenta de administrador ha sido registrada y está pendiente de aprobación por el super administrador.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Recibirás una notificación cuando tu cuenta sea aprobada.
          </p>
        </div>
        <Button 
          onClick={() => {
            setRegistrationSuccess(false);
            navigate("/login");
          }}
          className="w-full bg-[#686df3] hover:bg-[#575ce2]"
        >
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      {registerError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{registerError}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="registerName">Nombre completo</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="registerName"
            type="text"
            placeholder="Nombre y apellido"
            className="pl-10"
            value={registerName}
            onChange={(e) => setRegisterName(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="registerEmail">Correo electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="registerEmail"
            type="email"
            placeholder="admin@example.com"
            className="pl-10"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="registerPassword">Contraseña</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="registerPassword"
            type="password"
            placeholder="Contraseña segura"
            className="pl-10"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            required
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-[#686df3] hover:bg-[#575ce2]" 
        disabled={isRegistering}
      >
        {isRegistering ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Registrando...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <UserPlus className="mr-2 h-4 w-4" /> Crear cuenta de administrador
          </span>
        )}
      </Button>
    </form>
  );
};

export default RegisterAdminForm;
