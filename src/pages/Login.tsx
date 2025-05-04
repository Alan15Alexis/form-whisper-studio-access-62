
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Mail, KeyRound, LogIn, User, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addInvitedUser } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Login = () => {
  // Estados para login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para registro
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Estados para registro de usuario normal
  const [userRegisterName, setUserRegisterName] = useState("");
  const [userRegisterEmail, setUserRegisterEmail] = useState("");
  const [isUserRegistering, setIsUserRegistering] = useState(false);
  const [userRegisterError, setUserRegisterError] = useState("");
  
  const [activeTab, setActiveTab] = useState<"login" | "register" | "register-user">("login");
  
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Authentication logic
      const user = { email, password };
      const loggedInUser = await login(user);

      if (loggedInUser) {
        // Redirect based on role
        if (loggedInUser.role === "admin") {
          navigate("/dashboard-admin");
        } else {
          navigate("/assigned-forms");
        }
      } else {
        setError("Credenciales inválidas. Por favor, verifica e intenta nuevamente.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Se produjo un error al iniciar sesión. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };
  
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
      const user = await register({
        email: registerEmail,
        password: registerPassword,
        name: registerName,
        role: "admin" // Registramos como administrador
      });
      
      if (user) {
        // Redirect to admin dashboard
        navigate("/dashboard-admin");
      } else {
        setRegisterError("No se pudo crear la cuenta. Inténtalo nuevamente.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError("Se produjo un error al registrar la cuenta.");
    } finally {
      setIsRegistering(false);
    }
  };
  
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
      setActiveTab("login");
      
    } catch (error) {
      console.error("User registration error:", error);
      setUserRegisterError("Se produjo un error al registrar el usuario invitado.");
    } finally {
      setIsUserRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b py-4">
        <div className="container mx-auto px-4">
          <a href="https://beed.studio" target="_blank" rel="noopener noreferrer">
            <img 
              src="/lovable-uploads/90fe245b-54ef-4362-85ea-387a90015ebb.png" 
              alt="beedStudio" 
              className="h-8" 
              width="192" 
              height="32"
            />
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-gray-200">
          <Tabs 
            defaultValue="login" 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "login" | "register" | "register-user")}
            className="w-full"
          >
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                {activeTab === "login" && "Iniciar sesión"}
                {activeTab === "register" && "Crear cuenta de administrador"}
                {activeTab === "register-user" && "Registrar usuario invitado"}
              </CardTitle>
              <CardDescription>
                {activeTab === "login" && "Introduce tus credenciales para acceder al panel de control"}
                {activeTab === "register" && "Ingresa tus datos para registrarte como administrador"}
                {activeTab === "register-user" && "Ingresa los datos para registrar un usuario invitado"}
              </CardDescription>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Reg. Admin</TabsTrigger>
                <TabsTrigger value="register-user">Reg. Usuario</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@beed.studio"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Contraseña</Label>
                      <Link to="#" className="text-sm text-blue-600 hover:underline">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#686df3] hover:bg-[#575ce2]" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Iniciando sesión...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <LogIn className="mr-2 h-4 w-4" /> Iniciar sesión
                      </span>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="mt-0">
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
              </TabsContent>
              
              <TabsContent value="register-user" className="mt-0">
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
              </TabsContent>
            </CardContent>
          </Tabs>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-xs text-gray-500">
              {activeTab === "login" && (
                <p>Para demo, usa: admin@beed.studio / password123</p>
              )}
            </div>
            
            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full">
                Volver al inicio
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4 text-center text-sm text-gray-500">
        <div className="container mx-auto px-4">
          <p>© 2025. All rights reserved. | Proudly ⭐️ Powered by <a href="https://beed.studio" className="text-[#686df3] hover:underline">beedStudio</a></p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
