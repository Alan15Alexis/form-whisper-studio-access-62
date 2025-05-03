
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, UserPlus, Mail, User, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchInvitedUsers, addInvitedUser, removeInvitedUser } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface InvitedUsersManagerProps {
  formId: string;
}

interface InvitedUser {
  id: number;
  nombre: string;
  correo: string;
  created_at?: string;
}

const InvitedUsersManager = ({ formId }: InvitedUsersManagerProps) => {
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load invited users
  useEffect(() => {
    const loadInvitedUsers = async () => {
      try {
        const users = await fetchInvitedUsers();
        setInvitedUsers(users);
      } catch (error) {
        console.error('Error loading invited users:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios invitados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInvitedUsers();
  }, [formId]);

  const handleAddInvitedUser = async () => {
    if (!userName.trim() || !userEmail.trim()) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      toast({
        title: "Error",
        description: "Por favor, introduce un correo electrónico válido",
        variant: "destructive",
      });
      return;
    }

    // Check if the email is already in the list
    const emailExists = invitedUsers.some(
      (user) => user.correo.toLowerCase() === userEmail.toLowerCase()
    );

    if (emailExists) {
      toast({
        title: "Error",
        description: "Este correo electrónico ya está en la lista",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newUser = await addInvitedUser(userName, userEmail.toLowerCase());
      if (newUser) {
        setInvitedUsers([...invitedUsers, newUser]);
        setUserName("");
        setUserEmail("");
        toast({
          title: "Usuario invitado añadido",
          description: `${userName} (${userEmail}) ha sido añadido a la lista de usuarios invitados`,
        });
      }
    } catch (error) {
      console.error('Error adding invited user:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el usuario invitado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveInvitedUser = async (id: number, name: string, email: string) => {
    try {
      await removeInvitedUser(id);
      setInvitedUsers(invitedUsers.filter(user => user.id !== id));
      toast({
        title: "Usuario eliminado",
        description: `${name} (${email}) ha sido eliminado de la lista de usuarios invitados`,
      });
    } catch (error) {
      console.error('Error removing invited user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario invitado",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-medium">Gestión de Usuarios Invitados</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="p-0 ml-2 h-auto">
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Los usuarios añadidos aquí podrán acceder a los formularios privados 
                    mediante su correo electrónico. Solo podrán acceder si su correo está 
                    en esta lista.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Añade usuarios invitados que pueden responder a los formularios privados
          </p>
          
          <div className="space-y-3 mb-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nombre del usuario"
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                type="email"
                className="pl-10"
              />
            </div>
            
            <Button 
              type="button" 
              onClick={handleAddInvitedUser}
              disabled={isSubmitting || !userName.trim() || !userEmail.trim()}
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {isSubmitting ? "Añadiendo..." : "Añadir Usuario Invitado"}
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Cargando usuarios invitados...</p>
            </div>
          ) : invitedUsers && invitedUsers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Usuarios Invitados ({invitedUsers.length})
              </p>
              {invitedUsers.map(user => (
                <div 
                  key={user.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{user.nombre}</span>
                    <span className="text-sm text-gray-500">{user.correo}</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveInvitedUser(user.id, user.nombre, user.correo)}
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
              <p className="text-gray-500">No hay usuarios invitados añadidos aún</p>
              <p className="text-sm text-gray-400 mt-1">
                Añade usuarios invitados para permitirles acceder a los formularios
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default InvitedUsersManager;
