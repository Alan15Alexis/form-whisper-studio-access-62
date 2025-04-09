
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          <h3 className="text-lg font-medium mb-2">Usuarios Permitidos</h3>
          <p className="text-sm text-gray-500 mb-4">
            Añade direcciones de correo electrónico de usuarios que pueden acceder a este formulario
          </p>
          
          <div className="flex space-x-2 mb-4">
            <Input
              value={allowedUserEmail}
              onChange={(e) => onAllowedUserEmailChange(e.target.value)}
              placeholder="usuario@ejemplo.com"
              type="email"
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={onAddAllowedUser}
              disabled={!allowedUserEmail.trim()}
            >
              Añadir
            </Button>
          </div>
          
          {allowedUsers && allowedUsers.length > 0 ? (
            <div className="space-y-2">
              {allowedUsers.map(email => (
                <div 
                  key={email} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
                >
                  <span>{email}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemoveAllowedUser(email)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-lg border-dashed">
              <p className="text-gray-500">No hay usuarios añadidos aún</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AccessControl;
