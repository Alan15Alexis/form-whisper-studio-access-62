
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X, Plus, Users, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/toast";

interface CollaboratorsCardProps {
  collaborators?: string[];
  onCollaboratorsChange?: (collaborators: string[]) => void;
}

const CollaboratorsCard = ({
  collaborators = [],
  onCollaboratorsChange
}: CollaboratorsCardProps) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>("");
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [availableAdmins, setAvailableAdmins] = useState<Array<{id: number, nombre: string, correo: string}>>([]);

  console.log('CollaboratorsCard - Current state:', {
    collaborators,
    collaboratorsCount: collaborators.length,
    currentUserEmail: currentUser?.email,
    isAdmin
  });

  // Load available administrators
  useEffect(() => {
    const loadAvailableAdmins = async () => {
      try {
        console.log('CollaboratorsCard - Loading available administrators...');
        const { data, error } = await supabase
          .from('usuario_administrador')
          .select('id, nombre, correo')
          .eq('estatus_aprobacion', 'aprobado')
          .neq('correo', currentUser?.email); // Exclude current user

        if (error) {
          console.error('CollaboratorsCard - Error loading administrators:', error);
          return;
        }

        console.log('CollaboratorsCard - Loaded administrators:', data);
        setAvailableAdmins(data || []);
      } catch (error) {
        console.error('CollaboratorsCard - Error loading administrators:', error);
      }
    };

    if (isAdmin) {
      loadAvailableAdmins();
    }
  }, [currentUser?.email, isAdmin]);

  const handleAddCollaborator = async () => {
    if (!selectedCollaboratorId) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un administrador",
        variant: "destructive",
      });
      return;
    }

    const selectedAdmin = availableAdmins.find(admin => admin.id.toString() === selectedCollaboratorId);
    
    if (!selectedAdmin) {
      toast({
        title: "Error",
        description: "Administrador no encontrado",
        variant: "destructive",
      });
      return;
    }

    const email = selectedAdmin.correo.toLowerCase().trim();

    // Check if email is already a collaborator
    if (collaborators.includes(email)) {
      toast({
        title: "Colaborador ya añadido",
        description: "Este administrador ya es colaborador de este formulario",
        variant: "destructive",
      });
      return;
    }

    // Check if email is the form owner
    if (email === currentUser?.email) {
      toast({
        title: "Error",
        description: "No puedes añadirte a ti mismo como colaborador",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCollaborator(true);

    try {
      // Add to collaborators list
      const updatedCollaborators = [...collaborators, email];
      console.log('CollaboratorsCard - Adding collaborator:', {
        newCollaborator: email,
        adminName: selectedAdmin.nombre,
        updatedCollaborators,
        totalCount: updatedCollaborators.length
      });
      
      onCollaboratorsChange?.(updatedCollaborators);

      setSelectedCollaboratorId("");
      
      toast({
        title: "Colaborador añadido exitosamente",
        description: `${selectedAdmin.nombre} ahora puede editar este formulario`,
      });
    } catch (error) {
      console.error('CollaboratorsCard - Error adding collaborator:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el colaborador",
        variant: "destructive",
      });
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = (email: string) => {
    const updatedCollaborators = collaborators.filter(collab => collab !== email);
    console.log('CollaboratorsCard - Removing collaborator:', {
      removedCollaborator: email,
      updatedCollaborators,
      totalCount: updatedCollaborators.length
    });
    
    onCollaboratorsChange?.(updatedCollaborators);
    
    const admin = availableAdmins.find(admin => admin.correo.toLowerCase() === email);
    toast({
      title: "Colaborador eliminado",
      description: `${admin?.nombre || email} ya no puede editar este formulario`,
    });
  };

  const getAdminName = (email: string) => {
    const admin = availableAdmins.find(admin => admin.correo.toLowerCase() === email.toLowerCase());
    return admin?.nombre || email;
  };

  // Filter out already added collaborators from the dropdown
  const availableCollaborators = availableAdmins.filter(admin => 
    !collaborators.includes(admin.correo.toLowerCase()) &&
    admin.correo.toLowerCase() !== currentUser?.email?.toLowerCase()
  );

  // Only render for admins
  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="p-6 shadow-sm border border-gray-100">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Users className="h-5 w-5" />
          Colaboradores
        </CardTitle>
        <p className="text-sm text-gray-500">
          Los colaboradores pueden editar este formulario y añadir campos
        </p>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="space-y-4">
          {/* Add new collaborator */}
          <div className="flex gap-2">
            <Select
              value={selectedCollaboratorId}
              onValueChange={setSelectedCollaboratorId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar administrador..." />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {availableCollaborators.length > 0 ? (
                  availableCollaborators.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{admin.nombre}</span>
                        <span className="text-sm text-gray-500">{admin.correo}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-admins" disabled>
                    No hay administradores disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddCollaborator}
              disabled={isAddingCollaborator || !selectedCollaboratorId || availableCollaborators.length === 0}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              {isAddingCollaborator ? 'Añadiendo...' : 'Añadir'}
            </Button>
          </div>

          {/* List of current collaborators */}
          {collaborators.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Colaboradores actuales ({collaborators.length}):
              </Label>
              <div className="flex flex-wrap gap-2">
                {collaborators.map((email) => (
                  <Badge 
                    key={email} 
                    variant="secondary" 
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <span>{getAdminName(email)}</span>
                    <button
                      onClick={() => handleRemoveCollaborator(email)}
                      className="ml-1 hover:text-red-600 transition-colors"
                      title="Eliminar colaborador"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {collaborators.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Sin colaboradores</p>
                <p className="text-yellow-700">Solo tú puedes editar este formulario actualmente</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CollaboratorsCard;
