
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Mail, X, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AccessControlProps {
  allowedUsers: string[];
  allowedUserEmail: string;
  onAllowedUserEmailChange: (email: string) => void;
  onAddAllowedUser: () => void;
  onRemoveAllowedUser: (email: string) => void;
}

const AccessControl = ({ 
  allowedUsers, 
  allowedUserEmail, 
  onAllowedUserEmailChange, 
  onAddAllowedUser, 
  onRemoveAllowedUser 
}: AccessControlProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-medium">Control de Acceso</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="p-0 ml-2 h-auto">
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Los usuarios añadidos aquí podrán acceder al formulario privado. 
                    Cuando compartas el formulario, se les pedirá verificar su correo electrónico.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Añade direcciones de correo electrónico de usuarios que pueden acceder a este formulario privado
          </p>
          
          <div className="flex space-x-2 mb-4">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={allowedUserEmail}
                onChange={(e) => onAllowedUserEmailChange(e.target.value)}
                placeholder="usuario@ejemplo.com"
                type="email"
                className="pl-10"
              />
            </div>
            <Button 
              type="button" 
              onClick={onAddAllowedUser}
              disabled={!allowedUserEmail.trim()}
              className="px-4"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Añadir
            </Button>
          </div>
          
          {allowedUsers && allowedUsers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Usuarios con acceso ({allowedUsers.length})</p>
              {allowedUsers.map(email => (
                <div 
                  key={email} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
                >
                  <span className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    {email}
                  </span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemoveAllowedUser(email)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-lg border-dashed">
              <Mail className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay usuarios con acceso añadidos aún</p>
              <p className="text-sm text-gray-400 mt-1">Añade correos electrónicos para permitir el acceso a este formulario</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AccessControl;
