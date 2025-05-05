
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardTitle, CardDescription, CardHeader } from "@/components/ui/card";

interface LoginHeaderProps {
  activeTab: "login" | "register" | "register-user";
}

const LoginHeader = ({ activeTab }: LoginHeaderProps) => {
  return (
    <CardHeader className="space-y-1">
      <CardTitle className="text-2xl font-bold">
        {activeTab === "login" && "Iniciar sesión"}
        {activeTab === "register" && "Crear cuenta de administrador"}
        {activeTab === "register-user" && "Registrar usuario invitado"}
      </CardTitle>
      <CardDescription>
        {activeTab === "login" && "Introduce tus credenciales para acceder al panel de control"}
        {activeTab === "register" && "Ingresa tus datos para registrarte como administrador"}
        {activeTab === "register-user" && "Registra un nuevo usuario invitado en el sistema"}
      </CardDescription>
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
        <TabsTrigger value="register">Reg. Admin</TabsTrigger>
      </TabsList>
    </CardHeader>
  );
};

export default LoginHeader;
