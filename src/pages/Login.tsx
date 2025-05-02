import { createContext, useContext, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Mail, KeyRound, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AuthContext = createContext({
  isAuthenticated: false,
  currentUser: null,
  login: (user: { email: string; password: string; role: string }) => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const login = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from the location state or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Simular autenticación
      const user = { email, password, role: email === "admin@correo.com" ? "admin" : "user" };
      login(user);

      // Redirigir según el rol
      if (user.role === "admin") {
        navigate("/dashboard-admin");
      } else {
        navigate("/dashboard-user");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Se produjo un error al iniciar sesión. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
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
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Iniciar sesión como Administrador</CardTitle>
            <CardDescription>
              Introduce tus credenciales de administrador para acceder al panel de control
            </CardDescription>
          </CardHeader>

          <CardContent>
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
                    placeholder="admin@correo.com"
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
                    <LogIn className="mr-2 h-4 w-4" /> Iniciar sesión como Administrador
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-xs text-gray-500">
              <p>Para demo, usa: admin@beed.studio / password123</p>
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
